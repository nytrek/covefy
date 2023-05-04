import { useUser } from "@clerk/nextjs";
import { CheckBadgeIcon } from "@heroicons/react/20/solid";
import { FireIcon } from "@heroicons/react/24/outline";
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
  const utils = trpc.useContext();

  const profile = trpc.getProfile.useQuery();

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

  const handleOnCreatePurchase = () => {
    if (!profile.data) return;
    if (profile.data.popularity - price < 0)
      return toast.error("You don't have enough popularity");
    toast.loading("Loading...");
    createPurchase.mutate({
      bannerId: id,
      profileId: profile.data.id,
      popularity: profile.data.popularity - price,
    });
  };

  const handleOnDeletePurchase = () => {
    if (!profile.data) return;
    toast.loading("Loading...");
    deletePurchase.mutate({
      bannerId: id,
      profileId: profile.data.id,
      popularity: profile.data.popularity + price,
    });
  };
  return (
    <div className="flex flex-col space-y-4">
      <div className="relative">
        <img
          src={src}
          alt="banner"
          className="h-48 w-full rounded-lg object-cover"
        />
        <span className="absolute inset-0" />
      </div>
      <div>
        <div className="flex items-center space-x-5">
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-2xl font-bold text-brand-50">{title}</h4>
              {verified && (
                <CheckBadgeIcon className="mt-1 h-6 w-6 text-brand-50" />
              )}
            </div>
            <p className="text-sm font-medium text-brand-500">{description}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-col justify-stretch space-y-4">
          <span className="inline-flex items-center justify-center space-x-1 rounded-md bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-900 shadow-sm ring-1 ring-inset ring-brand-300 hover:bg-brand-50">
            <span>{price}</span>
            <FireIcon className="h-5 w-5" />
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
    </div>
  );
}

export default function Marketplace() {
  const { user } = useUser();

  const profile = trpc.getProfile.useQuery();
  const banners = trpc.getBanners.useQuery();

  const [isAuth, setIsAuth] = useState(false);

  const initializeAuthSession = async () => {
    try {
      await upload.beginAuthSession("/api/auth", async () => ({}));
      setIsAuth(true);
    } catch (err: any) {
      console.log(err.message);
    }
  };

  useEffect(() => {
    if (user) initializeAuthSession();
    else upload.endAuthSession();
  }, [user]);
  return (
    <>
      <main className="pb-36 pt-12">
        <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6 lg:max-w-7xl lg:px-8">
          <h2 className="text-4xl font-semibold text-brand-50">Banners</h2>
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            {isAuth ? (
              <>
                {banners.data
                  ?.filter((banner) => banner.imageUrl !== profile.data?.banner)
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
              </>
            ) : (
              <>
                <div className="flex flex-col space-y-6 motion-safe:animate-pulse">
                  <div className="relative">
                    <div className="h-48 w-full rounded-lg bg-brand-600"></div>
                    <span className="absolute inset-0" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-5">
                      <div className="flex w-full flex-col space-y-3">
                        <div className="flex h-2.5 w-1/4 items-center space-x-4 rounded-full bg-brand-700"></div>
                        <div className="flex h-2.5 w-2/4 items-center space-x-4 rounded-full bg-brand-700"></div>
                      </div>
                    </div>
                    <div className="mt-6 flex flex-col justify-stretch space-y-4">
                      <div className="flex h-4 items-center space-x-4 rounded-full bg-brand-700"></div>
                      <div className="flex h-4 items-center space-x-4 rounded-full bg-brand-700"></div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col space-y-6 motion-safe:animate-pulse">
                  <div className="relative">
                    <div className="h-48 w-full rounded-lg bg-brand-600"></div>
                    <span className="absolute inset-0" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-5">
                      <div className="flex w-full flex-col space-y-3">
                        <div className="flex h-2.5 w-1/4 items-center space-x-4 rounded-full bg-brand-700"></div>
                        <div className="flex h-2.5 w-2/4 items-center space-x-4 rounded-full bg-brand-700"></div>
                      </div>
                    </div>
                    <div className="mt-6 flex flex-col justify-stretch space-y-4">
                      <div className="flex h-4 items-center space-x-4 rounded-full bg-brand-700"></div>
                      <div className="flex h-4 items-center space-x-4 rounded-full bg-brand-700"></div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col space-y-6 motion-safe:animate-pulse">
                  <div className="relative">
                    <div className="h-48 w-full rounded-lg bg-brand-600"></div>
                    <span className="absolute inset-0" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-5">
                      <div className="flex w-full flex-col space-y-3">
                        <div className="flex h-2.5 w-1/4 items-center space-x-4 rounded-full bg-brand-700"></div>
                        <div className="flex h-2.5 w-2/4 items-center space-x-4 rounded-full bg-brand-700"></div>
                      </div>
                    </div>
                    <div className="mt-6 flex flex-col justify-stretch space-y-4">
                      <div className="flex h-4 items-center space-x-4 rounded-full bg-brand-700"></div>
                      <div className="flex h-4 items-center space-x-4 rounded-full bg-brand-700"></div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col space-y-6 motion-safe:animate-pulse">
                  <div className="relative">
                    <div className="h-48 w-full rounded-lg bg-brand-600"></div>
                    <span className="absolute inset-0" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-5">
                      <div className="flex w-full flex-col space-y-3">
                        <div className="flex h-2.5 w-1/4 items-center space-x-4 rounded-full bg-brand-700"></div>
                        <div className="flex h-2.5 w-2/4 items-center space-x-4 rounded-full bg-brand-700"></div>
                      </div>
                    </div>
                    <div className="mt-6 flex flex-col justify-stretch space-y-4">
                      <div className="flex h-4 items-center space-x-4 rounded-full bg-brand-700"></div>
                      <div className="flex h-4 items-center space-x-4 rounded-full bg-brand-700"></div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col space-y-6 motion-safe:animate-pulse">
                  <div className="relative">
                    <div className="h-48 w-full rounded-lg bg-brand-600"></div>
                    <span className="absolute inset-0" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-5">
                      <div className="flex w-full flex-col space-y-3">
                        <div className="flex h-2.5 w-1/4 items-center space-x-4 rounded-full bg-brand-700"></div>
                        <div className="flex h-2.5 w-2/4 items-center space-x-4 rounded-full bg-brand-700"></div>
                      </div>
                    </div>
                    <div className="mt-6 flex flex-col justify-stretch space-y-4">
                      <div className="flex h-4 items-center space-x-4 rounded-full bg-brand-700"></div>
                      <div className="flex h-4 items-center space-x-4 rounded-full bg-brand-700"></div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col space-y-6 motion-safe:animate-pulse">
                  <div className="relative">
                    <div className="h-48 w-full rounded-lg bg-brand-600"></div>
                    <span className="absolute inset-0" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-5">
                      <div className="flex w-full flex-col space-y-3">
                        <div className="flex h-2.5 w-1/4 items-center space-x-4 rounded-full bg-brand-700"></div>
                        <div className="flex h-2.5 w-2/4 items-center space-x-4 rounded-full bg-brand-700"></div>
                      </div>
                    </div>
                    <div className="mt-6 flex flex-col justify-stretch space-y-4">
                      <div className="flex h-4 items-center space-x-4 rounded-full bg-brand-700"></div>
                      <div className="flex h-4 items-center space-x-4 rounded-full bg-brand-700"></div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col space-y-6 motion-safe:animate-pulse">
                  <div className="relative">
                    <div className="h-48 w-full rounded-lg bg-brand-600"></div>
                    <span className="absolute inset-0" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-5">
                      <div className="flex w-full flex-col space-y-3">
                        <div className="flex h-2.5 w-1/4 items-center space-x-4 rounded-full bg-brand-700"></div>
                        <div className="flex h-2.5 w-2/4 items-center space-x-4 rounded-full bg-brand-700"></div>
                      </div>
                    </div>
                    <div className="mt-6 flex flex-col justify-stretch space-y-4">
                      <div className="flex h-4 items-center space-x-4 rounded-full bg-brand-700"></div>
                      <div className="flex h-4 items-center space-x-4 rounded-full bg-brand-700"></div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col space-y-6 motion-safe:animate-pulse">
                  <div className="relative">
                    <div className="h-48 w-full rounded-lg bg-brand-600"></div>
                    <span className="absolute inset-0" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-5">
                      <div className="flex w-full flex-col space-y-3">
                        <div className="flex h-2.5 w-1/4 items-center space-x-4 rounded-full bg-brand-700"></div>
                        <div className="flex h-2.5 w-2/4 items-center space-x-4 rounded-full bg-brand-700"></div>
                      </div>
                    </div>
                    <div className="mt-6 flex flex-col justify-stretch space-y-4">
                      <div className="flex h-4 items-center space-x-4 rounded-full bg-brand-700"></div>
                      <div className="flex h-4 items-center space-x-4 rounded-full bg-brand-700"></div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
