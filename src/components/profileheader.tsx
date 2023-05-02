import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/20/solid";

export default function ProfileHeader({
  url,
  name,
  text,
}: {
  url: string;
  name: string;
  text: string;
}) {
  return (
    <div className="flex items-center justify-between px-4 sm:px-6 lg:px-0">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-brand-50">
          {name}
        </h2>
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
