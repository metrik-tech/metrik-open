import type { DetailedHTMLProps, HTMLAttributes } from "react";
import Image, { type ImageProps } from "next/image";
import Link, { type LinkProps } from "next/link";
import type { MDXComponents } from "mdx/types";
import slugify from "slugify";

import { cn } from "@/utils/cn";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    img: (props) => (
      <Image
        sizes="100vw"
        style={{ width: "100%", height: "auto" }}
        {...(props as ImageProps)}
      />
    ),

    a: (props) => <Link {...(props as LinkProps)} />,

    h2: (props) => (
      <h2
        {...props}
        style={{
          ...props.style,
          scrollMarginTop: "6rem",
        }}
        id={slugify((props.children as string).replace(/&/g, "and"), {
          lower: true,
        }).replace(/'/g, "")}
      />
    ),
  };
}
