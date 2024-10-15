function formatDateToUTC(date: Date) {
	const utcDate = Date.UTC(
		date.getUTCFullYear(),
		date.getUTCMonth(),
		date.getUTCDate(),
		date.getUTCHours(),
		date.getUTCMinutes(),
		date.getUTCSeconds(),
	);

	const newDate = new Date(utcDate);

	const isoString = newDate.toISOString();
	const datePart = isoString.substring(0, 10);
	const timePart = isoString.substring(11, 19);
	return `${datePart} ${timePart}`;
}

function makeRequest(query: string, env: Env) {
	return fetch(
		`https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/analytics_engine/sql`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${env.CF_API_TOKEN}`,
			},
			body: query,
		},
	);
}

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
	//
	// Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
	// MY_SERVICE: Fetcher;
	//
	// Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
	// MY_QUEUE: Queue;
	METRIK_CLIENT_ANALYTICS_ALPHA: AnalyticsEngineDataset;
	API_KEY: string;
	CF_ACCOUNT_ID: string;
	CF_API_TOKEN: string;
}

interface Analytic {
	timestamp: string;
	playerCount: number;
	visits: string;
	serverCount: number;
	likes: number;
	dislikes: number;
	favourites: number;
	projectId: string;
}

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext,
	): Promise<Response> {
		const url = new URL(request.url);
		const authorization = request.headers.get("Authorization");

		if (!authorization || authorization !== `Bearer ${env.API_KEY}`) {
			return new Response("Unauthorized", { status: 401 });
		}

		if (request.method === "GET") {
			const { searchParams } = url;

			const projectId = searchParams.get("projectId");

			if (url.pathname === "/single") {
				const lte = formatDateToUTC(
					new Date(searchParams.get("lte") ?? new Date()),
				);

				const gte = formatDateToUTC(
					new Date(searchParams.get("gte") ?? new Date()),
				);

				let query = "";

				if (lte && gte) {
					query = `
						SELECT
							index1 AS projectId,
							timestamp,
							blob1 AS visits,
							double1 AS playerCount,
							double2 AS serverCount,
							double3 AS likes,
							double4 AS dislikes,
							double5 AS favourites
						FROM
							METRIK_CLIENT_ANALYTICS_ALPHA
						WHERE
							projectId = '${projectId}'
						AND timestamp >= toDateTime('${gte}')
						AND timestamp <= toDateTime('${lte}')
						ORDER BY timestamp DESC
					`;
				} else if (gte) {
					query = `
						SELECT
							index1 AS projectId,
							timestamp,
							blob1 AS visits,
							double1 AS playerCount,
							double2 AS serverCount,
							double3 AS likes,
							double4 AS dislikes,
							double5 AS favourites
						FROM
							METRIK_CLIENT_ANALYTICS_ALPHA
						WHERE
							projectId = '${projectId}'
						AND timestamp >= toDateTime('${gte}')
						ORDER BY timestamp DESC
					`;
				} else if (lte) {
					query = `
						SELECT
							index1 AS projectId,
							timestamp,
							blob1 AS visits,
							double1 AS playerCount,
							double2 AS serverCount,
							double3 AS likes,
							double4 AS dislikes,
							double5 AS favourites
						FROM
							METRIK_CLIENT_ANALYTICS_ALPHA
						WHERE
							projectId = '${projectId}'
						AND timestamp <= toDateTime('${lte}')
						ORDER BY timestamp DESC
					`;
				} else {
					query = `
						SELECT
							index1 AS projectId,
							timestamp,
							blob1 AS visits,
							double1 AS playerCount,
							double2 AS serverCount,
							double3 AS likes,
							double4 AS dislikes,
							double5 AS favourites
						FROM
							METRIK_CLIENT_ANALYTICS_ALPHA
						WHERE
							projectId = '${projectId}'
						ORDER BY timestamp DESC
					`;
				}

				const response = await makeRequest(query, env);

				if (!response.ok) {
					return new Response("undefined", {
						headers: {
							"content-type": "application/json",
						},
					});
				}

				const { data } = await response.json<{ data: unknown[] }>();

				if (data.length === 0) {
					return new Response("undefined", {
						headers: {
							"content-type": "application/json",
						},
					});
				}

				return new Response(JSON.stringify(data[0]), {
					headers: {
						"content-type": "application/json",
					},
				});
			}

			if (url.pathname === "/many") {
				const lte = formatDateToUTC(
					new Date(searchParams.get("lte") ?? new Date()),
				);

				const gte = formatDateToUTC(
					new Date(searchParams.get("gte") ?? new Date()),
				);

				let query = "";

				if (lte && gte) {
					query = `
						SELECT
							index1 AS projectId,
							timestamp,
							blob1 AS visits,
							double1 AS playerCount,
							double2 AS serverCount,
							double3 AS likes,
							double4 AS dislikes,
							double5 AS favourites
						FROM
							METRIK_CLIENT_ANALYTICS_ALPHA
						WHERE
							projectId = '${projectId}'
						AND timestamp >= toDateTime('${gte}')
						AND timestamp <= toDateTime('${lte}')
						ORDER BY timestamp DESC
					`;
				} else if (gte) {
					query = `
						SELECT
							index1 AS projectId,
							timestamp,
							blob1 AS visits,
							double1 AS playerCount,
							double2 AS serverCount,
							double3 AS likes,
							double4 AS dislikes,
							double5 AS favourites
						FROM
							METRIK_CLIENT_ANALYTICS_ALPHA
						WHERE
							projectId = '${projectId}'
						AND timestamp >= toDateTime('${gte}')
						ORDER BY timestamp DESC
					`;
				} else if (lte) {
					query = `
						SELECT
							index1 AS projectId,
							timestamp,
							blob1 AS visits,
							double1 AS playerCount,
							double2 AS serverCount,
							double3 AS likes,
							double4 AS dislikes,
							double5 AS favourites
						FROM
							METRIK_CLIENT_ANALYTICS_ALPHA
						WHERE
							projectId = '${projectId}'
						AND timestamp <= toDateTime('${lte}')
						ORDER BY timestamp DESC
					`;
				} else {
					query = `
						SELECT
							index1 AS projectId,
							timestamp,
							blob1 AS visits,
							double1 AS playerCount,
							double2 AS serverCount,
							double3 AS likes,
							double4 AS dislikes,
							double5 AS favourites
						FROM
							METRIK_CLIENT_ANALYTICS_ALPHA
						WHERE
							projectId = '${projectId}'
						ORDER BY timestamp DESC
					`;
				}

				const response = await makeRequest(query, env);

				if (!response.ok) {
					return new Response("[]", {
						headers: {
							"content-type": "application/json",
						},
					});
				}

				const { data } = await response.json<{
					data: unknown[];
				}>();

				return new Response(JSON.stringify(data), {
					headers: {
						"content-type": "application/json",
					},
				});
			}

			// const query = `
			// 	SELECT
			// 		index1 AS projectId,
			// 		timestamp,
			// 		blob1 AS visits,
			// 		double1 AS playerCount,
			// 		double2 AS serverCount,
			// 		double3 AS likes,
			// 		double4 AS dislikes,
			// 		double5 AS favourites
			// 	FROM
			// 		METRIK_CLIENT_ANALYTICS_ALPHA
			// 	WHERE
			// 		projectId = '${projectId}'
			// 	AND timestamp >= toDateTime('${from ?? formatDateToUTC(new Date(Date.now() - 1000 * 60 * 60 * 24 * 7))}')
			// 	AND timestamp < toDateTime('${to ?? formatDateToUTC(new Date())}')
			// `;
		}

		if (request.method === "POST") {
			if (url.pathname === "/single") {
				const analytic = await request.json<Analytic>();

				env.METRIK_CLIENT_ANALYTICS_ALPHA.writeDataPoint({
					blobs: [
						formatDateToUTC(new Date(analytic.timestamp)), // blob1
						analytic.visits, // blob2
					],
					doubles: [
						analytic.playerCount, // double1
						analytic.serverCount, // double2
						analytic.likes, // double3
						analytic.dislikes, // double4
						analytic.favourites, // double5
					],
					indexes: [analytic.projectId],
				});
			}

			if (url.pathname === "/bulk") {
				const analytics = await request.json<Analytic[]>();

				analytics.forEach((analytic) => {
					env.METRIK_CLIENT_ANALYTICS_ALPHA.writeDataPoint({
						blobs: [
							// formatDateToUTC(new Date(analytic.timestamp)), // blob1
							analytic.visits, // blob1
						],
						doubles: [
							analytic.playerCount, // double1
							analytic.serverCount, // double2
							analytic.likes, // double3
							analytic.dislikes, // double4
							analytic.favourites, // double5
						],
						indexes: [analytic.projectId],
					});
				});
			}

			return new Response("Success");
		}

		return new Response("Go away");
	},
};
