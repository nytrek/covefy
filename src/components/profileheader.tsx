import Link from "next/link";
import { FireIcon, ArrowRightIcon } from "@heroicons/react/20/solid";

export default function ProfileHeader({
  url,
  name,
  text,
  popularity,
}: {
  url: string;
  name: string;
  text: string;
  popularity: number;
}) {
  return (
    <div className="flex items-center justify-between px-4 sm:px-6 lg:px-0">
      <div>
        <div className="flex items-center space-x-3 text-brand-50">
          <h2 className="text-2xl font-bold tracking-tight">{name}</h2>
          <div className="flex items-center space-x-1">
            <FireIcon className="h-5 w-5" />
            <span className="text-xl font-medium">{popularity}</span>
          </div>
        </div>
        <p className="text-brand-500">{text}</p>
      </div>
      <Link
        href={url}
        className="hidden text-sm font-semibold text-brand-50 sm:block"
      >
        View profile
        <span aria-hidden="true">
          {" "}
          <ArrowRightIcon className="inline h-4 w-4" />
        </span>
      </Link>
    </div>
  );
}
