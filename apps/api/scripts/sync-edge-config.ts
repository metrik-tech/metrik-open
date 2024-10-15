const edgeConfig = await fetch(process.env.EDGE_CONFIG!);

const config = (await edgeConfig.json()) as {
  items: {
    previewAccess: string[];
    betaUsers: string[];
  };
};

// const res1 = await fetch("https://config.metrik.app/set", {
//   method: "POST",
//   headers: {
//     "Content-Type": "application/json",
//     Authorization: `Bearer ${process.env.CONFIG_API_KEY}`,
//   },
//   body: JSON.stringify({
//     key: "earlyAccess",
//     value: config.items.betaUsers.map((r) => ({ robloxId: Number(r) })),
//   }),
// });

// console.log(res1.status);

// const res2 = await fetch("https://config.metrik.app/set", {
//   method: "POST",
//   headers: {
//     "Content-Type": "application/json",
//     Authorization: `Bearer ${process.env.CONFIG_API_KEY}`,
//   },
//   body: JSON.stringify({
//     key: "previewEnvAccess",
//     value: config.items.previewAccess.map((r) => ({ robloxId: Number(r) })),
//   }),
// });

// console.log(res2.status);

const res3 = await fetch("https://config.metrik.app/set", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.CONFIG_API_KEY}`,
  },
  body: JSON.stringify({
    key: "bannedUsers",
    value: [],
  }),
});

console.log(res3.status);
