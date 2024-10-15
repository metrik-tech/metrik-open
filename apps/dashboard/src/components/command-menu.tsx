// import { useEffect, useState } from "react";
// import {
//   ArrowUturnLeftIcon,
//   ExclamationTriangleIcon,
//   MinusCircleIcon,
//   NoSymbolIcon,
//   ShieldCheckIcon,
// } from "@heroicons/react/20/solid";
// import { CommandLoading } from "cmdk";

// import {
//   Command,
//   CommandDialog,
//   CommandEmpty,
//   CommandGroup,
//   CommandInput,
//   CommandItem,
//   CommandList,
//   CommandSeparator,
//   CommandShortcut,
// } from "@/components/ui/Command";
// import { api } from "@/utils/api";
// import { Breadcrumbs } from "./command/breadcrumb";
// import {
//   Group,
//   Input,
//   Item,
//   Menu,
//   PageItemTrigger,
// } from "./command/command-pages";
// import { Pages, usePages } from "./command/pages";
// import { PageContent, usePageContent } from "./command/pages-content";
// import { useProject } from "./hooks/project";
// import { useStudio } from "./hooks/studio";
// import { Dialog, DialogContent } from "./ui/Dialog";

// const asyncPages = new Set(["ban"]);

// export function CommandMenu() {
//   const [open, setOpen] = useState(false);
//   const [searchValue, setSearchValue] = useState("");
//   const [shouldFilter, setShouldFilter] = useState<boolean>(true);
//   const { currentStudio } = useStudio();
//   const { project } = useProject();
//   const { currentPage } = usePages();
//   const utils = api.useUtils();

//   const {
//     mutate: searchUsers,
//     data: users,
//     isPending: isUsersLoading,
//   } = api.commands.userLookup.useMutation();

//   console.log(currentPage);

//   useEffect(() => {
//     if (asyncPages.has(currentPage)) {
//       setShouldFilter(false);
//     } else {
//       setShouldFilter(true);
//     }

//     return () => {
//       setShouldFilter(true);
//     };
//   }, [currentPage]);

//   useEffect(() => {
//     if (currentPage === "ban") {
//       searchUsers({ search: searchValue });
//     }
//   }, [currentPage, searchValue, searchUsers]);

//   useEffect(() => {
//     const down = (e: KeyboardEvent) => {
//       if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
//         e.preventDefault();
//         setOpen((open) => !open);
//       }
//     };
//     document.addEventListener("keydown", down);
//     return () => document.removeEventListener("keydown", down);
//   }, []);

//   return (
//     <Dialog open={open} onOpenChange={setOpen}>
//       <DialogContent className="overflow-hidden p-0 shadow-lg">
//         <Menu
//           shouldFilter={shouldFilter}
//           className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
//         >
//           <Breadcrumbs>
//             <Breadcrumbs.Viewport />
//             <Input autoFocus />
//             <CommandList>
//               {isUsersLoading && <CommandLoading>Loading...</CommandLoading>}
//               <CommandEmpty>No results found.</CommandEmpty>
//               <Breadcrumbs.Item>Home</Breadcrumbs.Item>
//               {project && (
//                 <>
//                   <Group title={project.name}>
//                     <PageItemTrigger page="moderation">
//                       <ShieldCheckIcon className="mr-2 h-5 w-5" />
//                       Moderation
//                     </PageItemTrigger>
//                   </Group>

//                   <PageContent page="moderation">
//                     <Breadcrumbs.Item>Moderation</Breadcrumbs.Item>
//                     <Group heading="Moderation">
//                       <PageItemTrigger page="ban">
//                         <NoSymbolIcon className="mr-2 h-5 w-5" />
//                         Quick Ban
//                       </PageItemTrigger>
//                       <Item>
//                         <MinusCircleIcon className="mr-2 h-5 w-5" />
//                         Kick
//                       </Item>
//                       <Item>
//                         <ArrowUturnLeftIcon className="mr-2 h-5 w-5" />
//                         Quick Unban
//                       </Item>
//                     </Group>
//                   </PageContent>

//                   <PageContent page="ban">
//                     <Breadcrumbs.Item>Ban</Breadcrumbs.Item>
//                     <Group heading="Ban">
//                       {users?.map((user) => (
//                         <Item key={user.userId}>
//                           <img
//                             src={user.avatarUrl}
//                             alt={user.username}
//                             className="mr-2 h-5 w-5 rounded-full"
//                           />
//                           {user.username}
//                         </Item>
//                       ))}
//                     </Group>
//                   </PageContent>
//                 </>
//               )}
//             </CommandList>
//           </Breadcrumbs>
//         </Menu>
//       </DialogContent>
//     </Dialog>
//   );
// }

// const BanPage = () => {
//   const page = usePageContent();
// };
