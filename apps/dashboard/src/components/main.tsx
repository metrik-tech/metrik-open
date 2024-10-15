import type { ReactNode } from "react";

import { useMembership } from "./hooks/membership";
import { useProject } from "./hooks/project";
import { useStudio } from "./hooks/studio";
import { LoadingSpinner } from "./loading-spinner";

export function Main({ children }: { children: ReactNode }) {
  const { isLoading: isProjectLoading } = useProject();
  const { isLoading: isStudioLoading } = useStudio();

  const isLoading = isProjectLoading || isStudioLoading;

  return (
    <main className="mx-auto min-h-[calc(100vh-160px)] w-full px-4 sm:px-6 md:max-w-[80rem]">
      {!isLoading ? (
        children
      ) : (
        <div className="flex h-[69vh] items-center justify-center">
          <div role="status">
            <LoadingSpinner />
          </div>
        </div>
      )}
    </main>
  );
}
