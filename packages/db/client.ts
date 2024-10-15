declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace PrismaJson {
    type JsonNumberArray = number[];
    type JsonStringArray = string[];
    type JsonObject = Record<string, unknown>;
    type ActionRunDetailContent = {
      message?: string;
      serverId?: string;
    };
  }
}

export * from "@prisma/client";
