import "@src/styles/globals.css";
import type { AppType } from "next/app";
import { trpc } from "../utils/trpc";
import { Toaster } from "react-hot-toast";
const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <>
      <Toaster />
      <Component {...pageProps} />
    </>
  );
};
export default trpc.withTRPC(MyApp);
