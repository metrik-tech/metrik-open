"use client";

import { useRouter } from "next/router";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import {
  Button,
  Card,
  Divider,
  List,
  ListItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@tremor/react";
import { KeyIcon } from "lucide-react";

import { useProject } from "@/hooks/project";
import { api } from "@/utils/api";
import { LoadingSpinner } from "../../loading-spinner";
import { Footer } from "../../ui/footer";
import { NewTokenModal } from "./create-modal";
import { TokenItem } from "./item";

export function TokensTab() {
  const { project } = useProject();
  const router = useRouter();
  const [parent] = useAutoAnimate();

  const { data: tokens, isPending: isTokensLoading } =
    api.tokens.getAll.useQuery(
      {
        projectId: router.query.id as string,
      },
      {
        enabled: !!router.query.id,
      },
    );

  return (
    <div>
      <Card>
        <h4 className="font-display text-xl font-semibold">Tokens</h4>
        <p className="mb-4 mt-2 text-sm text-neutral-800 dark:text-neutral-400">
          Tokens are API keys that can be used to access the Metrik API.{" "}
        </p>

        <div className="mb-4 border-b" />
        {!isTokensLoading && tokens?.length ? (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell className="pl-0 text-neutral-800 dark:text-neutral-300">
                  Nickname
                </TableHeaderCell>
                <TableHeaderCell className=" text-neutral-800 dark:text-neutral-300">
                  Prefix
                </TableHeaderCell>
                <TableHeaderCell className=" text-neutral-800 dark:text-neutral-300">
                  Creator
                </TableHeaderCell>

                <TableHeaderCell className="text-neutral-800 dark:text-neutral-300">
                  Last Used
                </TableHeaderCell>
                <TableHeaderCell className="text-neutral-800 dark:text-neutral-300">
                  Expiry
                </TableHeaderCell>
                <TableHeaderCell className="text-neutral-800 dark:text-neutral-300">
                  Created At
                </TableHeaderCell>
                <TableHeaderCell className="text-neutral-800 dark:text-neutral-300">
                  Actions
                </TableHeaderCell>
              </TableRow>
            </TableHead>

            <TableBody ref={parent}>
              {!isTokensLoading &&
                tokens?.map((token) => (
                  <TokenItem key={token.id} token={token} />
                ))}
            </TableBody>
          </Table>
        ) : !isTokensLoading ? (
          <div className="flex h-32 w-full items-center justify-center rounded-md border-2 border-dashed">
            <div>
              <KeyIcon
                className="mx-auto h-7 w-7 text-neutral-400 dark:text-neutral-600"
                strokeWidth="1.5px"
              />
              <p className="mt-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                No tokens
              </p>
            </div>
          </div>
        ) : (
          <div className="flex h-32 w-full items-center justify-center">
            <div className="flex" role="status">
              <LoadingSpinner />
            </div>
          </div>
        )}
        <Footer>
          <div className="flex w-full items-center justify-end">
            <NewTokenModal isLoading={isTokensLoading} />
          </div>
        </Footer>
      </Card>
    </div>
  );
}
