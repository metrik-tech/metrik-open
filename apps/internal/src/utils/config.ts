interface Config {
  bannedUsers: number[];
  earlyAccess: number[];
  previewEnvAccess: number[];
}

interface DeepConfig {
  bannedUsers: {
    timestamp: number;
    robloxId: number;
    friendlyIdentifier: string;
    reason: string;
    appealable?: boolean;
    expiry?: number;
  }[];
  earlyAccess: {
    robloxId: number;
  }[];
  previewEnvAccess: {
    robloxId: number;
  }[];
}

export async function getConfigForUser(robloxId: number) {
  const deepConfig = await getDeepConfig();
  const config = await getShallowConfig();

  return {
    bannedUser: config.bannedUsers.includes(robloxId)
      ? deepConfig.bannedUsers.find((user) => user.robloxId === robloxId)
      : undefined,
    earlyAccess: config.earlyAccess.includes(robloxId) ?? false,
    previewEnvAccess: config.previewEnvAccess.includes(robloxId) ?? false,
  };
}

export async function toggleEarlyAccess(robloxId: number) {
  const config = await getShallowConfig();

  if (!config.earlyAccess.includes(robloxId)) {
    await addEarlyAccessUser(robloxId);
  } else {
    await removeEarlyAccessUser(robloxId);
  }
}

export async function togglePreviewEnvAccess(robloxId: number) {
  const config = await getShallowConfig();

  if (!config.previewEnvAccess.includes(robloxId)) {
    await addPreviewEnvAccessUser(robloxId);
  } else {
    await removePreviewEnvAccessUser(robloxId);
  }
}

// export async function toggleBannedUser(robloxId: number) {
//   const config = await getShallowConfig();

//   if (config.bannedUsers.includes(robloxId)) {
//     await addBannedUser(robloxId);
//   } else {
//     await removeBannedUser(robloxId);
//   }
// }

export async function getShallowConfig() {
  const config = await fetch("https://config.metrik.app", {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${process.env.CONFIG_API_KEY}`,
    },
  });

  return await config.json<Config>();
}

export async function getDeepConfig() {
  const config = await fetch("https://config.metrik.app/deep", {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${process.env.CONFIG_API_KEY}`,
    },
  });

  return await config.json<DeepConfig>();
}

export async function addEarlyAccessUser(robloxId: number) {
  await fetch("https://config.metrik.app/insert/early-access", {
    method: "POST",
    body: JSON.stringify({
      robloxId,
    }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.CONFIG_API_KEY}`,
    },
  });

  return;
}

export async function removeEarlyAccessUser(robloxId: number) {
  await fetch("https://config.metrik.app/remove/early-access", {
    method: "POST",
    body: JSON.stringify({
      robloxId,
    }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.CONFIG_API_KEY}`,
    },
  });

  return;
}

export async function addBannedUser({
  robloxId,
  reason,
  friendlyIdentifier,
  timestamp,
  appealable,
  expiry,
}: {
  robloxId: number;
  reason: string;
  friendlyIdentifier: string;
  timestamp: number;
  appealable: boolean;
  expiry: number | null;
}) {
  const res = await fetch("https://config.metrik.app/insert/banned-users", {
    method: "POST",
    body: JSON.stringify({
      robloxId,
      reason,
      friendlyIdentifier,
      timestamp,
      appealable,
      expiry,
    }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.CONFIG_API_KEY}`,
    },
  });

  console.log(res.status);

  return;
}

export async function removeBannedUser(robloxId: number) {
  const res = await fetch("https://config.metrik.app/remove/banned-users", {
    method: "POST",
    body: JSON.stringify({
      robloxId,
    }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.CONFIG_API_KEY}`,
    },
    cache: "no-cache",
  });
  console.log(res.status);
  console.log(await res.text());

  return;
}

export async function addPreviewEnvAccessUser(robloxId: number) {
  await fetch("https://config.metrik.app/insert/preview-env-access", {
    method: "POST",
    body: JSON.stringify({
      robloxId,
    }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.CONFIG_API_KEY}`,
    },
  });

  return;
}

export async function removePreviewEnvAccessUser(robloxId: number) {
  await fetch("https://config.metrik.app/remove/preview-env-access", {
    method: "POST",
    body: JSON.stringify({
      robloxId,
    }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.CONFIG_API_KEY}`,
    },
  });

  return;
}

export async function getLilyData() {
  const res = await fetch("https://config.metrik.app/lily", {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${process.env.CONFIG_API_KEY}`,
    },
  });

  return await res.json<
    {
      fingerprints: string[];
      ips: string[];
      ids: string[];
    }[]
  >();
}
