import { ClerkProvider } from "@clerk/nextjs";
import "@src/styles/globals.css";
import type { AppType } from "next/app";
import { Toaster } from "react-hot-toast";
import { Tokens } from "../../.mirrorful/theme";
import { trpc } from "../utils/trpc";
const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <>
      <Toaster
        toastOptions={{
          style: {
            color: Tokens.colors.brand[50],
            backgroundColor: Tokens.colors.brand[800],
          },
        }}
      />
      <ClerkProvider {...pageProps}>
        <Component {...pageProps} />
      </ClerkProvider>
    </>
  );
};
export default trpc.withTRPC(MyApp);
