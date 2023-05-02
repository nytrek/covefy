import {
  ArrowRightIcon,
  CalendarDaysIcon,
  ChartBarIcon,
} from "@heroicons/react/20/solid";
import { Prisma } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

type Post = Prisma.PostGetPayload<{
  include: {
    _count: true;
  };
}>;

export default function ProfilePosts({ post }: { post: Post }) {
  return (
    <li className="inline-flex w-64 flex-col rounded-lg border border-brand-600 bg-brand-800 lg:w-auto">
      <div className="lg:col-start-3 lg:row-end-1">
        <h2 className="sr-only">Summary</h2>
        <div className="rounded-lg shadow-sm ring-1 ring-gray-900/5">
          <dl className="flex flex-wrap space-y-4">
            <div className="flex-auto px-4 pt-4 sm:px-6 sm:pt-6">
              <dd className="mt-1 w-full max-w-[10rem] truncate text-base font-semibold leading-6 text-brand-50">
                {post.title}
              </dd>
            </div>
            <div className="flex w-full flex-none gap-x-4 px-6">
              <dt className="flex-none">
                <span className="sr-only">Stats</span>
                <ChartBarIcon
                  className="h-6 w-5 text-brand-50"
                  aria-hidden="true"
                />
              </dt>
              <dd className="text-sm font-medium leading-6 text-brand-50">
                {post._count.likes +
                  post._count.comments +
                  post._count.bookmarks}
              </dd>
            </div>
            <div className="flex w-full flex-none gap-x-4 px-6">
              <dt className="flex-none">
                <span className="sr-only">Created</span>
                <CalendarDaysIcon
                  className="h-6 w-5 text-brand-50"
                  aria-hidden="true"
                />
              </dt>
              <dd className="text-sm leading-6 text-brand-50">
                <time dateTime={post.createdAt.toString()}>
                  {formatDistanceToNow(post.createdAt, {
                    addSuffix: true,
                  })}
                </time>
              </dd>
            </div>
          </dl>
          <div className="px-6 py-6">
            <Link
              href={"/post/" + post.id}
              className="text-sm font-semibold leading-6 text-brand-50"
            >
              View post{" "}
              <span aria-hidden="true">
                {" "}
                <ArrowRightIcon className="inline h-4 w-4" />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </li>
  );
}
