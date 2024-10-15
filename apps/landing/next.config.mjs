import createMDX from "@next/mdx";
import rehypeSlug from "rehype-slug";

const withMDX = createMDX({
  options: {
    rehypePlugins: [rehypeSlug],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["js", "jsx", "mdx", "md", "ts", "tsx"],
  experimental: {
    mdxRs: true,
  },
};

export default withMDX(nextConfig);
