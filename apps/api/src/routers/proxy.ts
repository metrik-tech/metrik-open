import { Elysia, t, type Context } from "elysia";

import { context } from "../context";
import { robloxOnly, robloxRestricted } from "../procedures";

export const proxyRouter = new Elysia({
  prefix: "/proxy",
})
  .use(context)
  .get(
    "/users/:userId",
    async ({ params, studio, request }) => {
      robloxRestricted(request.headers, params.userId, studio.id);

      const userReq = await fetch(
        `https://users.roblox.com/v1/users/${params.userId}`,
      );

      const user = (await userReq.json()) as {
        description: string;
        created: string;
        isBanned: boolean;
        externalAppDisplayName: string | null;
        hasVerifiedBadge: boolean;
        id: number;
        name: string;
        displayName: string;
      };

      return {
        description: user.description,
        created: user.created,
        isBanned: user.isBanned,
        externalAppDisplayName: user.externalAppDisplayName,
        hasVerifiedBadge: user.hasVerifiedBadge,
        id: user.id,
        name: user.name,
        displayName: user.displayName,
      };
    },
    {
      response: t.Object({
        description: t.String(),
        created: t.String(),
        isBanned: t.Boolean(),
        externalAppDisplayName: t.Nullable(t.String()),
        hasVerifiedBadge: t.Boolean(),
        id: t.Number(),
        name: t.String(),
        displayName: t.String(),
      }),
      detail: {
        tags: ["Proxy"],
        security: [
          {
            Token: [],
          },
        ],
        summary: "Get Roblox user by ID",
      },
    },
  );
