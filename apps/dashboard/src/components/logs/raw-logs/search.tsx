import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";

export function Search() {
  return (
    <div className="relative min-w-[20rem] max-w-xs rounded-md border border-neutral-300 shadow-sm">
      <form className="flex h-full flex-row">
        <input
          type="text"
          className="flex w-full items-center justify-between rounded-md rounded-r-none border-none px-4 py-2 font-mono text-xs text-neutral-700 focus:outline-0"
        />
        <span className="flex cursor-pointer items-center rounded-md rounded-l-none bg-blue-500 text-sm">
          <button className="px-4 text-white">
            <MagnifyingGlassIcon className="h-[1.1rem] w-[1.1rem]" />
          </button>
        </span>
      </form>
    </div>
  );
}
