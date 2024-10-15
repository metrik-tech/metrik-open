interface PreviewEnvironmentAccess {
	robloxId: number;
}

interface EarlyAccess {
	robloxId: number;
}

interface BannedUser {
	robloxId: number;
	reason?: string;
	expiry?: number;
	appealable?: boolean;
	timestamp?: number;
	friendlyIdentifier?: string;
}

const hash = async (message: string) => {
	const encoder = new TextEncoder();
	const data = encoder.encode(message);

	const hashBuffer = await crypto.subtle.digest("MD5", data);

	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");

	return hashHex;
};

export default {
	async fetch(
		request: Request,
		env: Env & { API_KEY: string },
		ctx: FetchEvent,
	) {
		const url = new URL(request.url);
		const path = url.pathname;

		if (url.hostname !== "localhost") {
			const ip = request.headers.get("CF-Connecting-IP")!;
			const { success } = await env.RATE_LIMIT.limit({
				key: ip,
			});

			if (!success) {
				return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
			}
		}

		const token = request.headers.get("Authorization");

		if (!token) {
			return Response.json({ error: "No token provided" }, { status: 401 });
		}

		if (token.split(" ")[1] !== env.API_KEY) {
			return Response.json({ error: "Invalid token" }, { status: 401 });
		}

		if (request.method === "GET") {
			if (path === "/") {
				// const config = await getShallowDetails(env.KV);

				// const etag = request.headers.get("If-None-Match");

				// if ((await hash(JSON.stringify(config))).slice(0, 16) === etag) {
				// 	return new Response(null, { status: 304 });
				// }

				return Response.json(await getShallowDetails(env.KV));
			}

			if (path === "/deep") {
				return Response.json(await getDetails(env.KV));
			}

			if (path === "/early-access") {
				return Response.json(await getEarlyAccess(env.KV));
			}

			if (path === "/preview-env-access") {
				return Response.json(await getPreviewEnvAccess(env.KV));
			}

			if (path === "/banned-users") {
				return Response.json(await getBannedUsers(env.KV));
			}

			if (path === "/lily") {
				const { results } = await env.LILY_DB.prepare(
					"select * from lily",
				).all<{
					fingerprints: string;
					ips: string;
					ids: string;
				}>();

				const lilyData = results.map((r) => ({
					fingerprints: JSON.parse(r.fingerprints) as Array<string>,
					ips: JSON.parse(r.ips) as Array<string>,
					ids: JSON.parse(r.ids) as Array<string>,
				}));

				return Response.json(lilyData);
			}

			return Response.json({ error: "Invalid path" }, { status: 404 });
		} else if (request.method === "POST") {
			// if (path === "/set") {
			// 	const json = await request.json<{
			// 		key: string;
			// 		value: unknown;
			// 	}>();

			// 	return Response.json(
			// 		await env.KV.put(json.key, JSON.stringify(json.value)),
			// 	);
			// }

			if (path === "/insert/early-access") {
				const json = await request.json<EarlyAccess>();

				return Response.json(await addEarlyAccess(env.KV, json));
			}

			if (path === "/insert/banned-users") {
				const json = await request.json<BannedUser>();

				return Response.json(await addBannedUser(env.KV, json));
			}

			if (path === "/insert/preview-env-access") {
				const json = await request.json<PreviewEnvironmentAccess>();

				return Response.json(await addPreviewEnvAccess(env.KV, json));
			}

			if (path === "/remove/early-access") {
				const { robloxId } = await request.json<{ robloxId: number }>();

				return Response.json(await removeEarlyAccess(env.KV, robloxId));
			}

			if (path === "/remove/banned-users") {
				const { robloxId } = await request.json<{ robloxId: number }>();

				return Response.json(await removeBannedUser(env.KV, robloxId));
			}

			if (path === "/remove/preview-env-access") {
				const { robloxId } = await request.json<{ robloxId: number }>();

				return Response.json(await removePreviewEnvAccess(env.KV, robloxId));
			}

			return Response.json({ error: "Invalid path" }, { status: 404 });
		}

		return Response.json(path);
	},
};

async function getShallowDetails(kv: KVNamespace) {
	console.log("getShallowDetails");
	const time = performance.now();
	const res = await Promise.all([
		kv.get("bannedUsers"),
		kv.get("previewEnvAccess"),
		kv.get("earlyAccess"),
	]);
	const time2 = performance.now();

	console.log(time2 - time);

	return {
		bannedUsers: res[0]
			? (JSON.parse(res[0]) as Array<BannedUser>).map((r) => r.robloxId)
			: [],
		previewEnvAccess: res[1]
			? (JSON.parse(res[1]) as Array<PreviewEnvironmentAccess>).map(
					(r) => r.robloxId,
				)
			: [],
		earlyAccess: res[2]
			? (JSON.parse(res[2]) as Array<EarlyAccess>).map((r) => r.robloxId)
			: [],
	};
}

async function getDetails(kv: KVNamespace) {
	const res = await Promise.all([
		kv.get("bannedUsers"),
		kv.get("previewEnvAccess"),
		kv.get("earlyAccess"),
	]);

	if (!res[0] || !res[1] || !res[2]) {
		return {
			bannedUsers: [],
			previewEnvAccess: [],
			earlyAccess: [],
		};
	}

	return {
		bannedUsers: JSON.parse(res[0]) as Array<BannedUser>,
		previewEnvAccess: JSON.parse(res[1]) as Array<PreviewEnvironmentAccess>,
		earlyAccess: JSON.parse(res[2]) as Array<EarlyAccess>,
	};
}

async function getEarlyAccess(kv: KVNamespace) {
	const res = await kv.get("earlyAccess");

	if (!res) {
		return [];
	}

	return ((await JSON.parse(res)) as Array<EarlyAccess>).map((r) => r.robloxId);
}

async function getPreviewEnvAccess(kv: KVNamespace) {
	const res = await kv.get("previewEnvAccess");

	if (!res) {
		return [];
	}

	return ((await JSON.parse(res)) as Array<PreviewEnvironmentAccess>).map(
		(r) => r.robloxId,
	);
}

async function getBannedUsers(kv: KVNamespace) {
	const res = await kv.get("bannedUsers");

	if (!res) {
		return [];
	}

	return ((await JSON.parse(res)) as Array<BannedUser>).map((r) => r.robloxId);
}

async function addEarlyAccess(kv: KVNamespace, data: EarlyAccess) {
	const earlyAccess = JSON.parse(
		(await kv.get("earlyAccess")) ?? "[]",
	) as Array<EarlyAccess>;

	if (earlyAccess.find((r) => r.robloxId === data.robloxId)) {
		return "ok";
	}

	earlyAccess.push(data);

	await kv.put("earlyAccess", JSON.stringify(earlyAccess));

	return "ok";
}

async function removeEarlyAccess(kv: KVNamespace, robloxId: number) {
	const earlyAccess = JSON.parse(
		(await kv.get("earlyAccess")) ?? "[]",
	) as Array<EarlyAccess>;

	const index = earlyAccess.findIndex((r) => r.robloxId === robloxId);

	if (index === -1) {
		return "ok";
	}

	earlyAccess.splice(index, 1);

	await kv.put("earlyAccess", JSON.stringify(earlyAccess));

	return "ok";
}

async function addBannedUser(kv: KVNamespace, data: BannedUser) {
	const bannedUsers = JSON.parse(
		(await kv.get("bannedUsers")) ?? "[]",
	) as Array<BannedUser>;

	if (bannedUsers.find((r) => r.robloxId === data.robloxId)) {
		return "ok";
	}

	bannedUsers.push(data);

	await kv.put("bannedUsers", JSON.stringify(bannedUsers));

	return "ok";
}

async function removeBannedUser(kv: KVNamespace, robloxId: number) {
	const bannedUsers = JSON.parse(
		(await kv.get("bannedUsers")) ?? "[]",
	) as Array<BannedUser>;

	const index = bannedUsers.findIndex((r) => r.robloxId === robloxId);

	if (index === -1) {
		return "not banned";
	}

	bannedUsers.splice(index, 1);

	await kv.put("bannedUsers", JSON.stringify(bannedUsers));

	return "ok";
}

async function addPreviewEnvAccess(
	kv: KVNamespace,
	data: PreviewEnvironmentAccess,
) {
	const previewEnvAccess = JSON.parse(
		(await kv.get("previewEnvAccess")) ?? "[]",
	) as Array<PreviewEnvironmentAccess>;

	if (previewEnvAccess.find((r) => r.robloxId === data.robloxId)) {
		return "ok";
	}

	previewEnvAccess.push(data);

	await kv.put("previewEnvAccess", JSON.stringify(previewEnvAccess));

	return "ok";
}

async function removePreviewEnvAccess(kv: KVNamespace, robloxId: number) {
	const previewEnvAccess = JSON.parse(
		(await kv.get("previewEnvAccess")) ?? "[]",
	) as Array<PreviewEnvironmentAccess>;

	const index = previewEnvAccess.findIndex((r) => r.robloxId === robloxId);

	if (index === -1) {
		return "ok";
	}

	previewEnvAccess.splice(index, 1);

	await kv.put("previewEnvAccess", JSON.stringify(previewEnvAccess));

	return "ok";
}
