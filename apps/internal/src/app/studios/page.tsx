import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

import { prisma } from "@metrik/db";

import { cn } from "@/utils/cn";

export default async function Studios() {
  const studios = await prisma.studio.findMany({
    include: {
      _count: {
        select: { projects: true, membership: true },
      },
    },
  });

  return (
    <div className="">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mt-8 text-xl font-semibold">Studios</h1>
          <p className="mb-8">Studios are containers for projects.</p>
        </div>
        <button className="bg-black px-3 py-1.5 text-sm font-medium text-white">
          CREATE STUDIO
        </button>
      </div>

      <table>
        <thead>
          <tr className="*:pr-4 *:text-left">
            <th>ID</th>
            <th>Name</th>
            <th>Project Count</th>
            <th>Members</th>
            <th>Plan (Plan ID)</th>
            <th>Trial Ends</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {studios.map((studio) => (
            <tr key={studio.id} className="*:pr-4">
              <td className="font-mono text-sm">{studio.id}</td>
              <td>{studio.name}</td>
              <td className="tabular-nums">{studio._count.projects}</td>
              <td className="tabular-nums">{studio._count.membership}</td>
              <td>
                {studio.planSlug} (
                <span
                  className={cn(
                    "font-mono",
                    studio.plan === "PRO" && "font-bold text-purple-600",
                  )}
                >
                  {studio.plan}
                </span>
                )
              </td>
              <td>
                {studio.trialEnds ? (
                  <span>{format(studio.trialEnds, "MMMM d, yyyy")}</span>
                ) : (
                  "No"
                )}
              </td>

              <td className="flex items-center gap-x-2">
                <Link href={`/studios/${studio.id}`}>Details</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
