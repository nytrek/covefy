import {
  BookmarkIcon,
  HomeIcon,
  InboxStackIcon,
  SwatchIcon,
} from "@heroicons/react/20/solid";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/router";

export default function Footer() {
  const { route } = useRouter();
  const navigation = [
    {
      href: "/",
      name: "Home feed",
      current: route === "/",
      icon: HomeIcon,
    },
    {
      href: "/posts",
      name: "Your posts",
      current: route === "/posts",
      icon: SwatchIcon,
    },
    {
      href: "/bookmarks",
      name: "Bookmarks",
      current: route === "/bookmarks",
      icon: BookmarkIcon,
    },
    {
      href: "/inbox",
      name: "Digital inbox",
      current: route === "/inbox",
      icon: InboxStackIcon,
    },
  ];
  return (
    <footer className="pointer-events-none fixed inset-x-0 bottom-0 z-40 sm:flex sm:justify-center sm:px-6 sm:pb-5 lg:px-8">
      <div className="pointer-events-auto flex items-center justify-between border border-brand-600 bg-brand-900 bg-opacity-90 p-6 backdrop-blur-md sm:gap-x-16 sm:rounded-xl">
        {navigation.map((item) => (
          <div key={item.href} className="flex flex-col items-center space-y-1">
            <Link
              href={item.href}
              className="relative border border-transparent p-2"
            >
              {item.current && (
                <motion.div
                  layoutId="current"
                  className="absolute inset-0 rounded-full border border-brand-base bg-brand-800"
                ></motion.div>
              )}
              <item.icon className="relative h-6 w-6 rounded-full text-brand-50/70 sm:h-8 sm:w-8" />
            </Link>
            <p className="text-center text-xs text-brand-50 sm:text-sm">
              {item.name}
            </p>
          </div>
        ))}
      </div>
    </footer>
  );
}
