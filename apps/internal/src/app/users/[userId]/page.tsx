import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { decode } from "@tsndr/cloudflare-worker-jwt";
import { format } from "date-fns";

import { prisma } from "@metrik/db";

import { getConfigForUser } from "@/utils/config";
import { DeleteButton } from "../delete-button";
import {
  EarlyAccessToggle,
  PreviewAccessToggle,
  RobloxAccountBannedToggle,
} from "./tunable-toggle";

export const dynamic = "force-dynamic";

export default async function UserPage({
  params,
}: {
  params: { userId: string };
}) {
  const store = cookies();
  const token = store.get("CF_Authorization")!.value;
  const email = decode<{ email: string }>(token).payload!.email;
  const user = await prisma.user.findFirst({
    where: {
      id: params.userId,
    },
    include: {
      memberships: true,
    },
  });

  if (!user) {
    return notFound();
  }

  const studios = await prisma.studio.findMany({
    where: {
      id: {
        in: user.memberships.map((m) => m.studioId),
      },
    },
  });

  const config = await getConfigForUser(Number(user.robloxId));

  return (
    <div className="mx-auto max-w-7xl px-4">
      <Link href="/users" className="mt-8 block">
        ← Back
      </Link>
      <div className="my-2 flex items-center gap-x-3">
        <img src={user.image!} className="h-10 w-10 " />
        <div>
          <h1 className="text-2xl font-semibold">{user.name}</h1>
          <p className=" font-mono text-sm">{user.id}</p>
        </div>
      </div>
      <div className="mb-6 flex items-center gap-x-4">
        <Link
          href={`https://roblox.com/users/${user.robloxId}/profile`}
          target="_blank"
        >
          Roblox Profile
        </Link>
        <Link href="https://stripe.com" target="_blank">
          Stripe Customer
        </Link>
        <Link href={`/users/${user.id}?edit=true`}>Edit</Link>
        <DeleteButton id={user.id} email={email} />
      </div>

      <h2 className="mb-2 mt-4 text-xl font-medium">User Info</h2>
      <ul>
        <li>
          <span className="mr-2 font-medium">Roblox Username</span>
          <span>{user.name}</span>
        </li>
        <li>
          <span className="mr-2 font-medium">ID</span>
          <span className="font-mono text-sm">{user.id}</span>
        </li>
        <li>
          <span className="mr-2 font-medium">Roblox ID</span>
          <span className="font-mono text-sm">{user.robloxId}</span>
        </li>
        <li>
          <span className="mr-2 font-medium">Joined at</span>
          <span>{format(user.createdAt, "h:mm a MM/dd (O)")}</span>
        </li>
        <li>
          <span className="mr-2 font-medium">Stripe Customer ID</span>
          <span className="font-mono text-sm">{user.stripeCustomerId}</span>
        </li>
        <li>
          <span className="mr-2 font-medium">Onboarded</span>
          <span>{user.onboarded ? "Yes" : "No"}</span>
        </li>

        <li>
          <span className="mr-2 font-medium">Studio Trial Used</span>
          <span>{user.studioTrialUsed ? "Yes" : "No"}</span>
        </li>
        <li>
          <span className="mr-2 font-medium">Memberships</span>
          <span>{user.memberships.length}</span>
        </li>
        <li>
          <span className="mr-2 font-medium">Studios Owned</span>
          <span>
            {user.memberships.filter((m) => m.role === "OWNER").length}
          </span>
        </li>
      </ul>

      <h2 className="mb-2 mt-4 text-xl font-medium">Tunables</h2>
      <ul>
        <li className="flex">
          <span className="mr-2 font-medium">Early Access</span>
          <EarlyAccessToggle
            email={email}
            userId={user.robloxId!}
            status={config.earlyAccess}
          />
        </li>
        <li className="flex">
          <span className="mr-2 font-medium">Roblox Account Banned</span>
          <RobloxAccountBannedToggle
            email={email}
            username={user.name!}
            userId={user.id}
            robloxId={user.robloxId!}
            status={config.bannedUser}
          />
        </li>

        <li className="flex">
          <span className="mr-2 font-medium">Preview Environment Access</span>
          <PreviewAccessToggle
            email={email}
            userId={user.robloxId!}
            status={config.previewEnvAccess}
          />
        </li>
      </ul>

      <h2 className="mb-2 mt-4 text-xl font-medium">Studios</h2>
      <table>
        <thead>
          <tr className="*:pr-2 *:text-left">
            <th>ID</th>

            <th>Name</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {user.memberships.map((membership) => {
            const studio = studios.find((s) => s.id === membership.studioId);

            if (!studio) {
              return null;
            }

            return (
              <tr key={membership.id} className="*:pr-4 ">
                <td className="font-mono text-sm">{studio.id}</td>
                <td className="flex">
                  {studio.avatarUrl && (
                    <img src={studio.avatarUrl} className="mr-2 size-6" />
                  )}
                  {studio.name}
                </td>
                <td className="font-mono text-sm">{membership.role}</td>
                <td>
                  <Link href={`/studios/${studio.id}`}>Details</Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
