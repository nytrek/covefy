import {
  BookmarkIcon,
  HomeIcon,
  InboxStackIcon,
  RectangleStackIcon,
} from "@heroicons/react/20/solid";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/router";

export default function Footer() {
  const { route } = useRouter();
  const navigation = [
    {
      href: "/",
      current: route === "/",
      icon: HomeIcon,
    },
    {
      href: "/posts",
      current: route === "/posts",
      icon: RectangleStackIcon,
    },
    {
      href: "/bookmarks",
      current: route === "/bookmarks",
      icon: BookmarkIcon,
    },
    {
      href: "/inbox",
      current: route === "/inbox",
      icon: InboxStackIcon,
    },
  ];
  return (
    <footer className="pointer-events-none fixed inset-x-0 bottom-0 z-40 sm:flex sm:justify-center sm:px-6 sm:pb-5 lg:px-8">
      <div className="pointer-events-auto flex items-center justify-between border border-brand-600 bg-brand-900 bg-opacity-90 p-6 backdrop-blur-md sm:gap-x-16 sm:rounded-xl">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="relative border border-transparent p-2"
          >
            {item.current ? (
              <motion.div
                layoutId="current"
                className="absolute inset-0 rounded-full border border-brand-base bg-brand-800"
              ></motion.div>
            ) : null}
            <item.icon className="relative h-6 w-6 rounded-full text-brand-50/70 sm:h-8 sm:w-8" />
          </Link>
        ))}
      </div>
    </footer>
  );
}
