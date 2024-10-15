import { cookies, headers } from "next/headers";
import Link from "next/link";
import { decode } from "@tsndr/cloudflare-worker-jwt";

import { getLilyData } from "@/utils/config";

export default async function Lily() {
  const lilyData = await getLilyData();
  const store = cookies();
  const token = store.get("CF_Authorization")?.value;
  const headersStore = headers();

  if (!token && headersStore.get("x-forwarded-host") !== "localhost:3002") {
    return (
      <main className="">
        <h1 className="mt-8 text-xl font-semibold">Lily Data</h1>
        <p className="mb-8">Fancy-shmancy alt database</p>

        <p>You must be logged in to view this page.</p>
      </main>
    );
  }

  const jwt = decode<{ email: string }>(token ?? "");
  const ALLOWED_EMAILS = ["ethan@metrik.app", "azurex443@gmail.com"];

  if (
    (!jwt?.payload?.email || !ALLOWED_EMAILS.includes(jwt?.payload?.email)) &&
    headersStore.get("x-forwarded-host") !== "localhost:3002"
  ) {
    return (
      <main className="">
        <h1 className="mt-8 text-xl font-semibold">Lily Data</h1>
        <p className="mb-8">Fancy-shmancy alt database</p>

        <p>You do not have access to this page.</p>
      </main>
    );
  }

  return (
    <main className="">
      <h1 className="mt-8 text-xl font-semibold">Lily Data</h1>
      <p className="mb-8">Fancy-shmancy alt database</p>

      <table className="border-spacing-2">
        <thead>
          <tr className="*:pr-2 *:text-left">
            <th>Fingerprints</th>
            <th>IPs (Click on to open in IPAPI)</th>
            <th>IDs (Click on to open details)</th>
          </tr>
        </thead>
        <tbody className="space-y-2">
          {lilyData.map((lily) => (
            <tr
              key={lily.fingerprints[0]}
              className="border *:pb-2 *:pl-2 *:pr-4 *:pt-2"
            >
              <td className="font-mono text-sm">
                <ul>
                  {lily.fingerprints.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </td>
              <td className="font-mono text-sm">
                <ul>
                  {lily.ips.map((f) => (
                    <li key={f}>
                      <Link href={`https://ipapi.co/${f}`} target="_blank">
                        {f}
                      </Link>{" "}
                    </li>
                  ))}
                </ul>
              </td>
              <td className="font-mono text-sm">
                <ul>
                  {lily.ids.map((f) => (
                    <li key={f}>
                      <Link href={`/users/${f}`}>{f}</Link>
                    </li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
