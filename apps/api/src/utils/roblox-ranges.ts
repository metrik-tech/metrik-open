import { createChecker } from "is-in-subnet";

const ranges = await fetch("https://bgp.he.net/super-lg/report/api/v1/prefixes/originated/22697").then(res => res.json()) as {
    prefixes: {
        Prefix: string;
    }[]
}

export const robloxRanges = new Set<string>();

ranges.prefixes.forEach(prefix => robloxRanges.add(prefix.Prefix));

export const checker = createChecker(Array.from(robloxRanges));
