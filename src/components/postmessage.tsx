import { ReactNode } from "react";

export default function PostMessage({
  message,
  imageUrl,
  children,
}: {
  message: string;
  imageUrl: string;
  children?: ReactNode;
}) {
  return (
    <div className="mx-4 flex flex-col items-center justify-center space-y-6 rounded-lg border border-brand-600 bg-brand-800 px-4 py-8 sm:mx-6 lg:mx-0">
      <img src={imageUrl} alt="receiver" className="h-14 w-14 rounded-full" />
      <p className="text-center text-sm font-semibold text-brand-50">
        {message}
      </p>
      {children}
    </div>
  );
}
