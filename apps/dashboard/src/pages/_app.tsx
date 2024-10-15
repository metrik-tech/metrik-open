import "@/styles/globals.css";

import localFont from "next/font/local";

import type { AppProps } from "@/components/providers";
import { api } from "@/utils/api";

const App = (props: AppProps) => {
  const { Component, pageProps } = props;
  if (Component.PageWrapper !== undefined) return Component.PageWrapper(props);
  return <Component {...pageProps} />;
};

export default api.withTRPC(App);
