"use client";

import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";

import { isAuthorizedForAdmin } from "@/utils/authorization";
import { deleteUser } from "./action";

export function DeleteButton({ id, email }: { id: string; email: string }) {
  const router = useRouter();
  const { execute } = useAction(deleteUser, {
    onSettled: () => {
      router.refresh();
    },
  });

  if (!isAuthorizedForAdmin(email)) {
    return null;
  }

  return (
    <button
      onClick={() => {
        const formData = new FormData();

        formData.append("id", id);

        window.confirm("Are you sure you want to delete this user?") &&
          execute(formData);
      }}
      className="text-red-500"
    >
      Delete
    </button>
  );
}
