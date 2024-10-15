import Link from "next/link";
import { useRouter } from "next/navigation";

import { prisma } from "@metrik/db";

import { DeleteButton } from "./delete-button";

export default async function Users() {
  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: { memberships: true },
      },
    },
  });

  return (
    <div className="">
      <h1 className="mt-8 text-xl font-semibold">Users</h1>
      <p className="mb-8">
        Our wonderful users that we love very much. Give them a kiss. *muah*
      </p>

      <table>
        <thead>
          <tr className="*:pr-2 *:text-left">
            <th>ID</th>
            <th>Username</th>
            <th>Roblox ID</th>
            <th>Stripe Customer ID</th>
            <th>Memberships</th>
            <th>Onboarded</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="*:pr-4 ">
              <td className="font-mono text-sm">{user.id}</td>
              <td>{user.name}</td>
              <td className="font-mono text-sm">{user.robloxId}</td>
              <td className="font-mono text-sm">{user.stripeCustomerId}</td>
              <td className="flex items-center gap-x-2">
                <p>{user._count.memberships}</p>
              </td>
              <td>{user.onboarded ? "Yes" : "No"}</td>
              <td className="flex items-center gap-x-2">
                <Link href={`/users/${user.id}`}>Details</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
