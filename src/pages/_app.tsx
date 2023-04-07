import "@src/styles/globals.css";
import type { AppType } from "next/app";
import { trpc } from "../utils/trpc";
import { Toaster } from "react-hot-toast";
import { Tokens } from "../../.mirrorful/theme";
const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <>
      <Toaster
        toastOptions={{
          style: {
            color: Tokens.colors.brand[50],
            backgroundColor: Tokens.colors.brand[900],
          },
        }}
      />
      <Component {...pageProps} />
    </>
  );
};
export default trpc.withTRPC(MyApp);
