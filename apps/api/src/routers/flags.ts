import { Elysia, t } from "elysia";

import { prisma } from "@metrik/db";
import {
  DynamicFlagOperator,
  DynamicFlagRuleBehaviour,
  DynamicFlagRuleType,
  FlagType,
} from "@metrik/db/client";
import { nid } from "@metrik/id";

import { context } from "../context";
import { MError } from "../utils/error";
import { NativeEnum } from "../utils/native-enum";

const Rule = t.Object({
  type: NativeEnum(DynamicFlagRuleType),
  param: t.Nullable(
    t.String({
      description:
        "Parameter for rules that require arguments, see Metrik docs for more information.",
    }),
  ),
  operator: NativeEnum(DynamicFlagOperator),
  operand: t.String(),
});

const operatorRules = {
  PLAYERS: "array",
  REGION: "string",
  SERVER_TYPE: "string",
  PLAYER_RANK_IN_GROUP: "string",
  PLAYER_ROLE_IN_GROUP: "string",
  PLAYER_IN_GROUP: "string",
  PLAYER_COUNT: "number",
  PLACE_VERSION: "number",
  PLAYER_NOT_IN_GROUP: "string",
};

const operandTypes = {
  EQUALS: ["array", "string", "number"],
  NOT_EQUALS: ["array", "string", "number"],
  CONTAINS: ["array", "string"],
  NOT_CONTAINS: ["array", "string"],
  GREATER_THAN: ["number"],
  LESS_THAN: ["number"],
  GREATER_THAN_OR_EQUALS: ["number"],
  LESS_THAN_OR_EQUALS: ["number"],
};

const rulesWithParams = ["PLAYER_RANK_IN_GROUP", "PLAYER_ROLE_IN_GROUP"];

export const flagsRouter = new Elysia({
  prefix: "/flags",
})
  .use(context)
  .post(
    "/create/dynamic",
    async ({ project, prisma, body, openCloud }) => {
      // TODO: Usage Limits
      const existingFlag = await prisma.dynamicFlag.findFirst({
        where: {
          projectId: project.id,
          name: body.name,
        },
      });

      if (existingFlag) {
        throw new MError({
          message: "Flag with that name already exists",
          code: "BAD_REQUEST",
        });
      }

      if (body.rules && body.type !== "BOOLEAN") {
        throw new MError({
          message: "Rules can only be set for boolean flags",
          code: "BAD_REQUEST",
        });
      }

      const rules = [body.rules ?? []].flat().map((rule) => {
        if (rulesWithParams.includes(rule.type)) {
          if (!rule.param) {
            throw new MError({
              message: `Rule ${rule.type} requires parameter`,
              code: "BAD_REQUEST",
            });
          }
        } else {
          if (rule.param) {
            throw new MError({
              message: "Rule does not require parameter",
              code: "BAD_REQUEST",
            });
          }
        }

        const ruleType = operatorRules[rule.type] as
          | "array"
          | "string"
          | "number";
        const ruleOperator = operandTypes[rule.operator];

        if (!ruleType) {
          throw new MError({
            message: `Invalid type for rule ${rule.type}`,
            code: "BAD_REQUEST",
          });
        }

        if (!ruleOperator) {
          throw new MError({
            message: `Invalid operator for rule ${rule.operator}`,
            code: "BAD_REQUEST",
          });
        }

        if (!ruleOperator.includes(ruleType)) {
          throw new MError({
            message: `Invalid operator for rule type ${rule.type}`,
            code: "BAD_REQUEST",
          });
        }

        // TODO: Validate values

        return {
          id: nid(),
          ...rule,
        };
      });

      const flag = await prisma.dynamicFlag.create({
        data: {
          id: nid(),
          name: body.name,
          value: body.value,
          type: body.type,
          rules: body.rules ? { createMany: { data: rules } } : undefined,
          ruleBehaviour: body.ruleBehaviour,
          projectId: project.id,
        },
      });

      await openCloud.safePublishMessage({
        topic: "metrik",
        virtualTopic: "flags",
        message: {
          type: "CREATE_DYNAMIC",
          id: flag.id,
          name: flag.name,
          value: flag.value,
          rules,
        },
        universeId: project.universeId,
      });

      return {
        id: flag.id,
      };
    },
    {
      type: "application/json",
      body: t.Object({
        name: t.String(),
        value: t.String(),
        type: NativeEnum(FlagType),
        rules: t.Optional(t.Array(Rule)),
        ruleBehaviour: t.Optional(NativeEnum(DynamicFlagRuleBehaviour)),
      }),
      response: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Flags"],
        summary: "Create dynamic flag",
        security: [
          {
            Token: [],
          },
        ],
      },
    },
  )
  .post(
    "/create/static",
    async ({ project, prisma, body }) => {
      // TODO: Usage limits

      const existingFlag = await prisma.staticFlag.findFirst({
        where: {
          projectId: project.id,
          name: body.name,
        },
      });

      if (existingFlag) {
        throw new MError({
          message: "Flag with that name already exists",
          code: "CONFLICT",
        });
      }

      const flag = await prisma.staticFlag.create({
        data: {
          id: nid(),
          name: body.name,
          value: body.value,
          type: body.type,
          projectId: project.id,
        },
      });

      return {
        id: flag.id,
      };
    },
    {
      type: "application/json",
      body: t.Object({
        name: t.String(),
        value: t.String(),
        type: NativeEnum(FlagType),
      }),
      response: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Flags"],
        summary: "Create static flag",
        security: [
          {
            Token: [],
          },
        ],
      },
    },
  )
  .patch(
    "/set",
    async ({ body, prisma, project, openCloud }) => {
      if (body.type === "STATIC") {
        const [usageLimits, flagCount] = await prisma.$transaction([
          prisma.usageLimits.findFirst({
            where: {
              studioId: project.studio.id,
            },
          }),
          prisma.staticFlag.count({
            where: {
              projectId: project.id,
            },
          }),
        ]);

        if (!usageLimits) {
          throw new MError({
            message: "Usage limit not found",
            code: "INTERNAL_SERVER_ERROR",
          });
        }

        if (flagCount >= usageLimits.staticFlagCount) {
          throw new MError({
            message: "Usage limit reached",
            code: "BAD_REQUEST",
          });
        }

        const flag = await prisma.staticFlag.update({
          where: {
            id: body.id,
            projectId: project.id,
          },
          data: {
            value: body.value,
          },
        });

        return {
          message: "Updated static flag",
          oldValue: flag.value,
          newValue: body.value,
        };
      } else if (body.type === "DYNAMIC") {
        const [usageLimits, flagCount] = await prisma.$transaction([
          prisma.usageLimits.findFirst({
            where: {
              studioId: project.studio.id,
            },
          }),
          prisma.dynamicFlag.count({
            where: {
              projectId: project.id,
            },
          }),
        ]);

        if (!usageLimits) {
          throw new MError({
            message: "Usage limit not found",
            code: "INTERNAL_SERVER_ERROR",
          });
        }

        if (flagCount >= usageLimits.dynamicFlagCount) {
          throw new MError({
            message: "Usage limit reached",
            code: "BAD_REQUEST",
          });
        }

        const flag = await prisma.dynamicFlag.update({
          where: {
            id: body.id,
            projectId: project.id,
          },
          data: {
            value: body.value,
          },
        });

        await openCloud.safePublishMessage({
          topic: "metrik",
          virtualTopic: "flags",
          message: {
            type: "UPDATE_VALUE",
            id: body.id,
            name: flag.name,
            value: body.value,
          },
          universeId: project.id,
        });

        return {
          message: "Updated dynamic flag",
          oldValue: flag.value,
          newValue: body.value,
        };
      }

      return {
        message: "Invalid flag type",
      };
    },
    {
      type: "application/json",
      body: t.Object({
        type: NativeEnum({
          STATIC: "STATIC",
          DYNAMIC: "DYNAMIC",
        }),
        id: t.String(),
        value: t.String(),
      }),
      response: t.Object({
        message: t.String(),
        oldValue: t.Optional(t.String()),
        newValue: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Flags"],
        summary: "Set flag value",
        security: [
          {
            Token: [],
          },
        ],
      },
    },
  )
  .get(
    "/get",
    async ({ project }) => {
      const flags = await getFlags(project.id);

      return {
        static: flags.static.map((flag) => ({
          id: flag.id,
          name: flag.name,
          value: flag.value,
          type: flag.type,
        })),
        dynamic: flags.dynamic.map((flag) => ({
          id: flag.id,
          name: flag.name,
          value: flag.value,
          type: flag.type,
          rules: flag.rules.map((rule) => ({
            type: rule.type,
            param: rule.param,
            operator: rule.operator,
            operand: rule.operand,
          })),
        })),
      };
    },
    {
      response: t.Object({
        dynamic: t.Array(
          t.Object({
            id: t.String(),
            name: t.String(),
            value: t.String(),
            type: NativeEnum(FlagType),
            rules: t.Array(Rule),
          }),
        ),
        static: t.Array(
          t.Object({
            id: t.String(),
            name: t.String(),
            value: t.String(),
            type: NativeEnum(FlagType),
          }),
        ),
      }),
      detail: {
        tags: ["Flags"],
        summary: "Get all flags",
        security: [
          {
            Token: [],
          },
        ],
      },
    },
  )
  .post(
    "/delete",
    async ({ project, prisma, body, openCloud }) => {
      if (body.type === "STATIC") {
        await prisma.staticFlag.delete({
          where: {
            id: body.id,
            projectId: project.id,
          },
        });
      }

      if (body.type === "DYNAMIC") {
        await prisma.dynamicFlag.delete({
          where: {
            id: body.id,

            projectId: project.id,
          },
        });

        await openCloud.safePublishMessage({
          topic: "metrik",
          virtualTopic: "flags",
          message: {
            type: "DELETE",
            id: body.id,
          },
          universeId: project.id,
        });
      }

      return {
        message: "Deleted flag",
      };
    },
    {
      type: "application/json",
      body: t.Object({
        type: NativeEnum({
          STATIC: "STATIC",
          DYNAMIC: "DYNAMIC",
        }),
        id: t.String(),
      }),
      response: t.Object({
        message: t.String(),
      }),
      detail: {
        tags: ["Flags"],
        summary: "Delete flag",
        security: [
          {
            Token: [],
          },
        ],
      },
    },
  )

  .post(
    "/rules/new",
    async ({ project, prisma, openCloud, body }) => {
      const [flag, rulesCount] = await prisma.$transaction([
        prisma.dynamicFlag.findFirst({
          where: {
            id: body.flagId,
            projectId: project.id,
          },
        }),
        prisma.dynamicFlagRule.count({
          where: {
            flag: {
              projectId: project.id,
            },
          },
        }),
      ]);

      if (flag?.type !== "BOOLEAN") {
        throw new MError({
          message: "Rules can only be added for boolean flags",
          code: "BAD_REQUEST",
        });
      }

      if (rulesCount >= 10) {
        throw new MError({
          message: "Each flag can have up to 10 rules",
          code: "BAD_REQUEST",
        });
      }

      const rule = await prisma.dynamicFlagRule.create({
        data: {
          id: nid(),
          flag: {
            connect: {
              id: body.flagId,
            },
          },
          type: body.rule.type,
          param: body.rule.param,
          operator: body.rule.operator,
          operand: body.rule.operand,
        },
      });

      await openCloud.safePublishMessage({
        topic: "metrik",
        virtualTopic: "flags",
        message: {
          type: "NEW_RULE",
          flagId: body.flagId,
          rule: {
            id: rule.id,
            type: rule.type,
            param: rule.param, // possibly null
            operator: rule.operator,
            operand: rule.operand,
          },
        },
        universeId: project.id,
      });

      return {
        id: rule.id,
      };
    },
    {
      type: "application/json",
      body: t.Object({
        flagId: t.String(),
        rule: Rule,
      }),
      response: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Flags"],
        summary: "Create new rule",
        security: [
          {
            Token: [],
          },
        ],
      },
    },
  )
  .patch(
    "/rules/update",
    async ({ prisma, project, body, openCloud }) => {
      const existingRule = await prisma.dynamicFlagRule.findFirst({
        where: {
          id: body.id,
          flag: {
            projectId: project.id,
          },
        },
      });

      if (!existingRule) {
        throw new MError({
          message: "Rule not found",
          code: "NOT_FOUND",
        });
      }

      if (
        body.operator &&
        !operandTypes[body.operator].includes(operatorRules[existingRule.type])
      ) {
        throw new MError({
          message: `Invalid operator for rule type ${existingRule.type}`,
          code: "BAD_REQUEST",
        });
      }

      if (!rulesWithParams.includes(existingRule.type) && body.param) {
        throw new MError({
          message: `Rule ${existingRule.type} does not require parameter`,
          code: "BAD_REQUEST",
        });
      }

      const rule = await prisma.dynamicFlagRule.update({
        where: {
          id: body.id,
        },
        data: {
          param: body.param,
          operator: body.operator,
          operand: body.operand,
        },
      });

      await openCloud.safePublishMessage({
        topic: "metrik",
        virtualTopic: "flags",
        message: {
          type: "UPDATE_RULE",
          rule: {
            id: rule.id,
            param: rule.param, // possibly null
            operator: rule.operator,
            operand: rule.operand,
          },
        },
        universeId: project.id,
      });

      return {
        message: "Updated rule",
      };
    },
    {
      type: "application/json",
      body: t.Object({
        id: t.String(),

        param: t.Optional(
          t.String({
            description:
              "Parameter for rules that require arguments, see Metrik docs for more information.",
          }),
        ),
        operator: t.Optional(NativeEnum(DynamicFlagOperator)),
        operand: t.Optional(t.String()),
        result: t.Optional(t.String()),
      }),
      response: t.Object({
        message: t.String(),
      }),
      detail: {
        tags: ["Flags"],
        summary: "Update rule",
        security: [
          {
            Token: [],
          },
        ],
      },
    },
  )
  .post(
    "/rules/delete",
    async ({ body, prisma, project, openCloud }) => {
      const rule = await prisma.dynamicFlagRule.delete({
        where: {
          id: body.id,
        },
      });

      await openCloud.safePublishMessage({
        topic: "metrik",
        virtualTopic: "flags",
        message: {
          type: "DELETE_RULE",
          id: rule.id,
        },
        universeId: project.id,
      });

      return {
        message: "Deleted rule",
      };
    },
    {
      type: "application/json",
      body: t.Object({
        id: t.String(),
      }),
      response: t.Object({
        message: t.String(),
      }),
      detail: {
        tags: ["Flags"],
        summary: "Delete rule",
        security: [
          {
            Token: [],
          },
        ],
      },
    },
  );

export async function getFlags(projectId: string) {
  const [dynamicFlags, staticFlags] = await prisma.$transaction([
    prisma.dynamicFlag.findMany({
      where: {
        projectId,
      },
      include: {
        rules: true,
      },
    }),
    prisma.staticFlag.findMany({
      where: {
        projectId,
      },
    }),
  ]);

  return {
    static: staticFlags,
    dynamic: dynamicFlags,
  };
}
