const config = await fetch("https://config.metrik.app", {
  headers: {
    Authorization: `Bearer ${process.env.CONFIG_API_KEY}`,
  },
});

const json = (await config.json()) as {
  bannedUsers: Array<number>;
  previewEnvAccess: Array<number>;
  earlyAccess: Array<number>;
};

// sleep function
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const getRobloxUsername = async (robloxId: number) => {
  const req = await fetch(`https://users.roblox.com/v1/users/${robloxId}`);
  const json = (await req.json()) as {
    name: string;
  };

  return json.name;
};

const bannedUsers = json.bannedUsers.forEach(async (robloxId) => {
  const username = await getRobloxUsername(robloxId);
  console.log(`Banned user ${robloxId} (${username})`);
});

await sleep(1000);

const previewEnvAccess = json.previewEnvAccess.forEach(async (robloxId) => {
  const username = await getRobloxUsername(robloxId);
  console.log(`Preview env access user ${robloxId} (${username})`);
});

await sleep(1000);

const earlyAccess = json.earlyAccess.forEach(async (robloxId) => {
  const username = await getRobloxUsername(robloxId);
  console.log(`Early access user ${robloxId} (${username})`);
});
