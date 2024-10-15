import {
	decryptData,
	encryptData,
	exportPrivateKey,
	exportPublicKey,
	generateKeyPair,
	hmac,
	importPrivateKey,
	importPublicKey,
} from "./lib";

export default {
	async fetch(request: Request, env: Env, ctx) {
		const origin = request.headers.get("origin") ?? "null";

		const url = new URL(request.url);

		if (
			request.method === "GET" &&
			["/index.css", "/", "/lily.svg"].includes(url.pathname)
		) {
			const response = await fetch(
				`https://cdn.metrik.app/lily${url.pathname === "/" ? "/index.html" : url.pathname}`,
			);

			return new Response(response.body, {
				status: response.status,
				headers: {
					"Content-Type": response.headers.get("Content-Type") ?? "text/html",
					"Access-Control-Allow-Origin": "*",
				},
			});
		}

		if (
			!request.url.startsWith("http://localhost") &&
			origin !== "https://preview.metrik.app" &&
			origin !== "https://alpha.metrik.app"
			// && origin !== "http://localhost:3000" // TODO: remove this
		) {
			return new Response("Not allowed", { status: 403 });
		}

		if (request.method === "GET" && url.pathname === "/keys") {
			return Response.json(env.PUBLIC_KEY, {
				headers: {
					"Access-Control-Allow-Origin": origin,
				},
			});
		}

		if (request.method === "POST" && url.pathname === "/") {
			const { success } = await env.RATE_LIMIT.limit({
				key: request.headers.get("cf-connecting-ip") ?? "127.0.0.1",
			});

			if (!success) {
				return new Response("Too many requests", {
					status: 429,
					headers: {
						"Access-Control-Allow-Origin": origin,
					},
				});
			}

			const encrypted = (await request.text()).replace(/"/g, "");

			let decrypted: string;
			try {
				decrypted = await decryptData(
					await importPrivateKey(env.PRIVATE_KEY),
					encrypted,
				);
			} catch (error) {
				console.log(error);
				return new Response("Invalid encrypted data", {
					status: 400,
					headers: { "Access-Control-Allow-Origin": origin },
				});
			}

			if (!decrypted) {
				return new Response("Invalid encrypted data", {
					status: 400,
					headers: { "Access-Control-Allow-Origin": origin },
				});
			}

			const { fingerprint, id, hash } = (await JSON.parse(decrypted)) as {
				fingerprint: string;
				hash: string;
				id: string;
			};

			const ip = request.headers.get("cf-connecting-ip") ?? "127.0.0.1";

			if (hash !== (await hmac(env.LILY_TOKEN, id))) {
				return new Response("Invalid ID hash", {
					status: 401,
					headers: { "Access-Control-Allow-Origin": origin },
				});
			}

			const db = env.DB;

			const { results: all } = await db
				.prepare("SELECT rowid, * FROM lily;")
				.all<{
					rowid: number;
					fingerprints: string;
					ids: string;
					ips: string;
				}>();

			const matchedRows = all.filter((row) => {
				const parsedFingerprints = JSON.parse(row.fingerprints) as string[];
				const parsedIds = JSON.parse(row.ids) as string[];
				const parsedIps = JSON.parse(row.ips) as string[];

				return (
					parsedFingerprints.includes(fingerprint) ||
					parsedIds.includes(id) ||
					parsedIps.includes(ip)
				);
			});

			if (matchedRows.length === 0) {
				await db
					.prepare(
						"INSERT INTO lily (fingerprints, ids, ips) VALUES (?, ?, ?);",
					)
					.bind(
						JSON.stringify([fingerprint]),
						JSON.stringify([id]),
						JSON.stringify([ip]),
					)
					.run();
			} else if (matchedRows.length === 1) {
				const row = matchedRows[0]!;

				const fingerprints = JSON.parse(row.fingerprints) as string[];
				const ids = JSON.parse(row.ids) as string[];
				const ips = JSON.parse(row.ips) as string[];

				if (!fingerprints.includes(fingerprint)) fingerprints.push(fingerprint);
				if (!ids.includes(id)) ids.push(id);
				if (!ips.includes(ip)) ips.push(ip);

				ctx.waitUntil(
					db
						.prepare(
							"UPDATE lily SET fingerprints = ?, ids = ?, ips = ? WHERE rowid = ?;",
						)
						.bind(
							JSON.stringify(fingerprints),
							JSON.stringify(ids),
							JSON.stringify(ips),
							JSON.stringify(row.rowid),
						)
						.run(),
				);
			} else {
				const combinedFingerprints = new Set();
				const combinedIds = new Set();
				const combinedIps = new Set();

				matchedRows.forEach((row) => {
					const fingerprints = JSON.parse(row.fingerprints) as string[];
					const ids = JSON.parse(row.ids) as string[];
					const ips = JSON.parse(row.ips) as string[];

					fingerprints.forEach((fingerprint) => {
						if (!combinedFingerprints.has(fingerprint))
							combinedFingerprints.add(fingerprint);
					});
					ids.forEach((id) => {
						if (!combinedIds.has(id)) combinedIds.add(id);
					});
					ips.forEach((ip) => {
						if (!combinedIps.has(ip)) combinedIps.add(ip);
					});

					if (row.rowid !== matchedRows[0]!.rowid) {
						ctx.waitUntil(
							db
								.prepare("DELTE FROM lily WHERE rowid = ?;")
								.bind(JSON.stringify(row.rowid))
								.run(),
						);
					}
				});

				combinedFingerprints.add(fingerprint);
				combinedIds.add(id);
				combinedIps.add(ip);

				ctx.waitUntil(
					db
						.prepare(
							"UPDATE lily SET fingerprints = ?, ids = ?, ips = ? WHERE rowid = ?;",
						)
						.bind(
							JSON.stringify(Array.from(combinedFingerprints)),
							JSON.stringify(Array.from(combinedIds)),
							JSON.stringify(Array.from(combinedIps)),
							JSON.stringify(matchedRows[0]!.rowid),
						)
						.run(),
				);
			}

			return new Response("OK", {
				status: 200,
				headers: {
					"Access-Control-Allow-Origin": origin,
				},
			});
		}

		return new Response(null, {
			status: 204,
			headers: {
				"Access-Control-Allow-Origin": origin,
			},
		});
	},
} satisfies ExportedHandler<Env>;
