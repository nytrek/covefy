import { useUser } from "@clerk/nextjs";
import { CheckBadgeIcon } from "@heroicons/react/20/solid";
import { TicketIcon } from "@heroicons/react/24/outline";
import Footer from "@src/components/footer";
import Navbar from "@src/components/navbar";
import { trpc } from "@src/utils/trpc";
import { useEffect } from "react";
import { Upload } from "upload-js";

const upload = Upload({
  apiKey: process.env.NEXT_PUBLIC_UPLOAD_APIKEY as string,
});

function Banner({
  src,
  title,
  price,
  verified,
  description,
}: {
  src: string;
  title: string;
  price: number;
  verified: boolean;
  description: string;
}) {
  return (
    <>
      <div className="relative">
        <img src={src} alt="banner" className="rounded-lg object-cover" />
        <span className="absolute inset-0" />
      </div>
      <div className="md:flex md:items-center md:justify-between md:space-x-5">
        <div className="flex items-center space-x-5">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-brand-50">{title}</h1>
              {verified ? (
                <CheckBadgeIcon className="mt-1 h-6 w-6 text-brand-50" />
              ) : null}
            </div>
            <p className="text-sm font-medium text-brand-500">{description}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-col justify-stretch space-y-4 sm:flex-row-reverse sm:justify-end sm:space-x-3 sm:space-y-0 sm:space-x-reverse md:mt-0 md:flex-row md:space-x-3">
          <span className="inline-flex items-center justify-center space-x-1 rounded-md bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-900 shadow-sm ring-1 ring-inset ring-brand-300 hover:bg-brand-50">
            <span>{price}</span>
            <TicketIcon className="h-5 w-5" />
          </span>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-brand-50 shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Purchase
          </button>
        </div>
      </div>
    </>
  );
}

export default function Marketplace() {
  const { user } = useUser();
  const banners = trpc.getBanners.useQuery();
  const initializeAuthSession = async () => {
    try {
      await upload.beginAuthSession("/api/auth", async () => ({}));
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
      <Navbar />
      <main className="pb-36 pt-12">
        <div className="mx-auto max-w-3xl space-y-10 px-4 sm:px-6 lg:max-w-7xl lg:px-8">
          {banners.data?.map((banner) => (
            <Banner
              key={banner.id}
              src={banner.imageUrl}
              title={banner.title}
              description={banner.description}
              price={banner.price}
              verified={banner.verified}
            />
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
