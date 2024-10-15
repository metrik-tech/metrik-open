import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@tremor/react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { Layout } from "@/components/base-layout";
import { LoadingSpinner } from "@/components/loading-spinner";
import { PageWrapper } from "@/components/page-wrapper";
import { StudioAvatar } from "@/components/studio-avatar";
import { api } from "@/utils/api";

function JoinButton({ inviteCode }: { inviteCode: string }) {
  const router = useRouter();

  const { mutate, isPending: isMutating } = api.invites.use.useMutation({
    onSuccess: (data) => {
      toast.success(`Joined studio ${data.name}`);

      void router.push("/");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <Button onClick={() => mutate({ code: inviteCode })} loading={isMutating}>
      Join Studio
    </Button>
  );
}

export default function Join() {
  const router = useRouter();
  const { inviteCode } = router.query;

  const { data: invite, isPending: isLoading } = api.invites.get.useQuery(
    {
      code: inviteCode as string,
    },
    {
      enabled: Boolean(inviteCode),
    },
  );
  const { data: session } = useSession();

  if (!session || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center dark:bg-dark-tremor-background-muted">
        <div role="status">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <Layout
      title={!isLoading && invite ? `Join ${invite.studio.name}` : undefined}
    >
      <div className="flex h-screen items-center justify-center dark:bg-dark-tremor-background-muted">
        {invite && session ? (
          <div>
            <div className="mb-3 flex w-full items-center justify-center">
              <StudioAvatar
                id={invite.studio.id}
                size={"lg"}
                url={invite.studio.avatarUrl}
              />
            </div>
            <div className="mb-5 flex w-full items-center justify-center font-medium">
              <span>{invite.studio.name}</span>
            </div>

            <h1 className="text-center text-lg">
              You have been invited to join{" "}
              <span className="font-semibold">{invite.studio.name}</span> on
              Metrik.
            </h1>

            <p className="mb-6 text-center text-sm text-neutral-600 dark:text-neutral-500">
              Logged in as {session.user.name}. Not you?{" "}
              <Link href="/auth/signout" className="font-medium">
                Sign out
              </Link>
            </p>
            <div className="flex w-full items-center justify-center pb-2">
              <JoinButton inviteCode={inviteCode as string} />
            </div>
          </div>
        ) : (
          <div>Invite not found</div>
        )}
      </div>
    </Layout>
  );
}

Join.PageWrapper = PageWrapper;
