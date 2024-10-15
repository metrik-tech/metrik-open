export const GLOBAL_CONFIG_CACHE = new Map<Type, Config>();
export const NAMESPACE_CONFIG_CACHE = new Map<string, NamespaceConfig>();

interface Config {
  timestamp: Date;

  items: {
    earlyAccess: number[];
    previewEnvAccess: number[];
    bannedUsers: number[];
  };
}

interface NamespaceConfig {
  timestamp: Date;
  items: number[];
}

type Type = keyof Config["items"] | "all";

// namespace for caching
// make return type based on namespace

export const getConfig = async () => {
  const cache = GLOBAL_CONFIG_CACHE.get("all");

  if (cache && cache.timestamp.getTime() > Date.now() - 1000 * 180) {
    return cache.items;
  }

  const req = await fetch("https://config.metrik.app", {
    headers: {
      Authorization: `Bearer ${process.env.CONFIG_API_KEY}`,
    },
  });

  if (!req.ok) {
    throw new Error("Failed to fetch global config");
  }
  const data = (await req.json()) as {
    earlyAccess: number[];
    previewEnvAccess: number[];
    bannedUsers: number[];
  };

  GLOBAL_CONFIG_CACHE.set("all", {
    timestamp: new Date(),
    items: data,
  });

  return data;
};

export const getEarlyAccess = async () => {
  const cache = NAMESPACE_CONFIG_CACHE.get("earlyAccess");

  if (cache && cache.timestamp.getTime() > Date.now() - 1000 * 180) {
    return cache.items;
  }

  const req = await fetch("https://config.metrik.app/early-access", {
    headers: {
      Authorization: `Bearer ${process.env.CONFIG_API_KEY}`,
    },
  });

  if (!req.ok) {
    throw new Error("Failed to fetch early access config");
  }
  const data = (await req.json()) as number[];

  NAMESPACE_CONFIG_CACHE.set("earlyAccess", {
    timestamp: new Date(),
    items: data,
  });

  return data;
};

export const getPreviewEnvAccess = async () => {
  const cache = NAMESPACE_CONFIG_CACHE.get("previewEnvAccess");

  if (cache && cache.timestamp.getTime() > Date.now() - 1000 * 180) {
    return cache.items;
  }

  const req = await fetch("https://config.metrik.app/preview-env-access", {
    headers: {
      Authorization: `Bearer ${process.env.CONFIG_API_KEY}`,
    },
  });

  if (!req.ok) {
    throw new Error("Failed to fetch preview env access config");
  }
  const data = (await req.json()) as number[];

  NAMESPACE_CONFIG_CACHE.set("previewEnvAccess", {
    timestamp: new Date(),
    items: data,
  });

  return data;
};

export const getBannedUsers = async () => {
  const cache = NAMESPACE_CONFIG_CACHE.get("bannedUsers");

  if (cache && cache.timestamp.getTime() > Date.now() - 1000 * 180) {
    return cache.items;
  }

  const req = await fetch("https://config.metrik.app/banned-users", {
    headers: {
      Authorization: `Bearer ${process.env.CONFIG_API_KEY}`,
    },
  });

  if (!req.ok) {
    throw new Error("Failed to fetch banned users config");
  }
  const data = (await req.json()) as number[];

  NAMESPACE_CONFIG_CACHE.set("bannedUsers", {
    timestamp: new Date(),
    items: data,
  });

  return data;
};
