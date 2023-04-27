import { useUser } from "@clerk/nextjs";
import { CheckBadgeIcon } from "@heroicons/react/20/solid";
import { TicketIcon } from "@heroicons/react/24/outline";
import { trpc } from "@src/utils/trpc";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Upload } from "upload-js";

const API_ERROR_MESSAGE =
  "API request failed, please refresh the page and try again.";

const upload = Upload({
  apiKey: process.env.NEXT_PUBLIC_UPLOAD_APIKEY as string,
});

interface Props {
  id: number;
  src: string;
  title: string;
  price: number;
  verified: boolean;
  description: string;
  purchased: boolean;
}

function Banner({
  id,
  src,
  title,
  price,
  verified,
  description,
  purchased,
}: Props) {
  /**
   * trpc context
   */
  const utils = trpc.useContext();

  /**
   * trpc queries
   */
  const profile = trpc.getProfile.useQuery();

  /**
   * create purchase mutation that links to corresponding procedure in the backend
   */
  const createPurchase = trpc.createPurchase.useMutation({
    onSuccess: () => {
      toast.dismiss();
      utils.getBanners.invalidate();
      utils.getProfile.invalidate();
      toast.success("Banner purchased!");
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });

  /**
   * delete purchase mutation that links to corresponding procedure in the backend
   */
  const deletePurchase = trpc.deletePurchase.useMutation({
    onSuccess: () => {
      toast.dismiss();
      utils.getBanners.invalidate();
      utils.getProfile.invalidate();
      toast.success("Banner sold!");
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });

  /**
   * event handler for creating purchase
   */
  const handleOnCreatePurchase = () => {
    if (!profile.data) return;
    toast.loading("Loading...");
    createPurchase.mutate({
      bannerId: id,
      profileId: profile.data.id,
      credits: profile.data.credits - price,
    });
  };

  /**
   * event handler for deleting purchase
   */
  const handleOnDeletePurchase = () => {
    if (!profile.data) return;
    toast.loading("Loading...");
    deletePurchase.mutate({
      bannerId: id,
      profileId: profile.data.id,
      credits: profile.data.credits + price,
    });
  };
  return (
    <>
      {/**
       * Render banner image
       */}
      <div className="relative">
        <img src={src} alt="banner" className="rounded-lg object-cover" />
        <span className="absolute inset-0" />
      </div>
      <div className="md:flex md:items-center md:justify-between md:space-x-5">
        {/**
         * Render banner details
         */}
        <div className="flex items-center space-x-5">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-brand-50">{title}</h1>
              {verified && (
                <CheckBadgeIcon className="mt-1 h-6 w-6 text-brand-50" />
              )}
            </div>
            <p className="text-sm font-medium text-brand-500">{description}</p>
          </div>
        </div>

        {/**
         * Render banner buttons
         */}
        <div className="mt-6 flex flex-col justify-stretch space-y-4 sm:flex-row-reverse sm:justify-end sm:space-x-3 sm:space-y-0 sm:space-x-reverse md:mt-0 md:flex-row md:space-x-3">
          <span className="inline-flex items-center justify-center space-x-1 rounded-md bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-900 shadow-sm ring-1 ring-inset ring-brand-300 hover:bg-brand-50">
            <span>{price}</span>
            <TicketIcon className="h-5 w-5" />
          </span>
          {purchased ? (
            <button
              type="button"
              onClick={handleOnDeletePurchase}
              className="inline-flex items-center justify-center rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-brand-50 shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              Sell
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOnCreatePurchase}
              className="inline-flex items-center justify-center rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-brand-50 shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              Purchase
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default function Marketplace() {
  /**
   * user hook by clerk
   */
  const { user } = useUser();

  /**
   * trpc queries
   */
  const profile = trpc.getProfile.useQuery();
  const banners = trpc.getBanners.useQuery();

  /**
   * useState that might be replaced with a state management library
   */
  const [isAuth, setIsAuth] = useState(false);

  /**
   * initialize auth session if user is authenticated to render private images from upload.io
   */
  const initializeAuthSession = async () => {
    try {
      await upload.beginAuthSession("/api/auth", async () => ({}));
      setIsAuth(true);
    } catch (err: any) {
      console.log(err.message);
    }
  };

  /**
   * useEffect hook for checking the state of the user
   */
  useEffect(() => {
    if (user) initializeAuthSession();
    else upload.endAuthSession();
  }, [user]);
  return (
    <>
      {isAuth ? (
        <main className="pb-36 pt-12">
          <div className="mx-auto max-w-3xl space-y-10 px-4 sm:px-6 lg:max-w-7xl lg:px-8">
            {banners.data
              ?.filter((item) => item.imageUrl !== profile.data?.banner)
              .map((banner) => (
                <Banner
                  key={banner.id}
                  id={banner.id}
                  src={banner.imageUrl}
                  title={banner.title}
                  description={banner.description}
                  price={banner.price}
                  verified={banner.verified}
                  purchased={!!banner.purchases.length}
                />
              ))}
          </div>
        </main>
      ) : null}
    </>
  );
}
