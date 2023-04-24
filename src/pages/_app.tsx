import { ClerkProvider, SignedIn } from "@clerk/nextjs";
import "@src/styles/globals.css";
import { MotionConfig } from "framer-motion";
import type { AppType } from "next/app";
import { Toaster } from "react-hot-toast";
import { Tokens } from "../../.mirrorful/theme";
import { trpc } from "../utils/trpc";
import Navbar from "@src/components/navbar";
import Footer from "@src/components/footer";
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
        <MotionConfig reducedMotion="user">
          <Navbar />
          <Component {...pageProps} />
          <SignedIn>
            <Footer />
          </SignedIn>
        </MotionConfig>
      </ClerkProvider>
    </>
  );
};
export default trpc.withTRPC(MyApp);
