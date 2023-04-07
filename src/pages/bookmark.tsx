import { Dialog, Listbox, Menu, Popover, Transition } from "@headlessui/react";
import {
  BookmarkIcon,
  CalendarIcon,
  ChartBarIcon,
  CheckIcon,
  HandThumbUpIcon,
  HomeIcon,
  InboxStackIcon,
  MagnifyingGlassIcon,
  PaperClipIcon,
  PencilSquareIcon,
  SwatchIcon,
  TagIcon,
  UserCircleIcon,
  UserGroupIcon,
} from "@heroicons/react/20/solid";
import { Bars3Icon, BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Prisma } from "@prisma/client";
import clsx from "clsx";
import Link from "next/link";
import { Dispatch, FormEvent, Fragment, SetStateAction, useState } from "react";
import { toast } from "react-hot-toast";
import { trpc } from "../utils/trpc";

const user = {
  name: "Chelsea Hagon",
  email: "chelsea.hagon@example.com",
  imageUrl:
    "https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
};
const userNavigation = [
  { name: "Your Profile", href: "/profile" },
  { name: "Settings", href: "/settings" },
  { name: "Sign out", href: "#" },
];

type Post = Prisma.PostGetPayload<{
  include: {
    author: true;
    booksmarks: true;
  };
}>;

const assignees = [
  { name: "Unassigned", value: null },
  {
    name: "Wade Cooper",
    value: "wade-cooper",
    avatar:
      "https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  },
  // More items...
];
const labels = [
  { name: "Unlabelled", value: null },
  { name: "Engineering", value: "engineering" },
  // More items...
];
const dueDates = [
  { name: "No due date", value: null },
  { name: "Today", value: "today" },
  // More items...
];

function Modal({
  open,
  post,
  setOpen,
  setPost,
}: {
  open: boolean;
  post: Post | null;
  setOpen: Dispatch<SetStateAction<boolean>>;
  setPost: Dispatch<SetStateAction<Post | null>>;
}) {
  const utils = trpc.useContext();
  const createMutation = trpc.createPost.useMutation({
    onSuccess: () => {
      setOpen(false);
      utils.posts.invalidate();
      toast.success("Post created!");
    },
    onError: (err: any) => {
      console.log(err.message);
      toast.error("API request failed, check console.log");
    },
  });
  const updateMutation = trpc.updatePost.useMutation({
    onSuccess: () => {
      setPost(null);
      setOpen(false);
      utils.posts.invalidate();
      toast.success("Post updated!");
    },
    onError: (err: any) => {
      console.log(err.message);
      toast.error("API request failed, check console.log");
    },
  });
  const deleteMutation = trpc.deletePost.useMutation({
    onSuccess: () => {
      //clear post state
      setPost(null);
      //close the modal
      setOpen(false);
      //invalidate cache
      utils.posts.invalidate();
      //notification
      toast.success("Post deleted!");
    },
    onError: (err: any) => {
      //console out error
      console.log(err.message);
      //notification
      toast.error("API request failed, check console.log");
    },
  });
  const [assigned, setAssigned] = useState(assignees[0]);
  const [labelled, setLabelled] = useState(labels[0]);
  const [dated, setDated] = useState(dueDates[0]);
  const handleOnClick = () => {
    if (!post) return; //execute if the user has selected a post
    deleteMutation.mutate({
      id: post.id,
    });
  };
  const handleOnSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const target = e.target as typeof e.target & {
      title: { value: string };
    };
    if (post) {
      updateMutation.mutate({
        id: post.id,
        title: target.title.value,
      });
    } else {
      createMutation.mutate({
        title: target.title.value,
      });
    }
  };
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-brand-900 bg-opacity-75 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-brand-50 px-4 pb-4 pt-5 text-left shadow-xl transition-all max-w-xl w-full">
                <form className="relative" onSubmit={handleOnSubmit}>
                  <div className="overflow-hidden rounded-lg border border-brand-300 shadow-sm focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500">
                    <label htmlFor="title" className="sr-only">
                      Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      id="title"
                      className="block w-full border-0 pt-2.5 text-lg font-medium placeholder:text-brand-400 focus:ring-0"
                      placeholder="Title"
                      defaultValue={post?.title}
                    />
                    <label htmlFor="description" className="sr-only">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      name="description"
                      id="description"
                      className="block w-full resize-none border-0 py-0 text-brand-900 placeholder:text-brand-400 focus:ring-0 sm:text-sm sm:leading-6"
                      placeholder="Write a description..."
                      defaultValue={""}
                    />

                    {/* Spacer element to match the height of the toolbar */}
                    <div aria-hidden="true">
                      <div className="py-2">
                        <div className="h-9" />
                      </div>
                      <div className="h-px" />
                      <div className="py-2">
                        <div className="py-px">
                          <div className="h-9" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute inset-x-px bottom-0">
                    {/* Actions: These are just examples to demonstrate the concept, replace/wire these up however makes sense for your project. */}
                    <div className="flex flex-nowrap justify-end space-x-2 px-2 py-2 sm:px-3">
                      <Listbox
                        as="div"
                        value={assigned}
                        onChange={setAssigned}
                        className="flex-shrink-0"
                      >
                        {({ open }) => (
                          <>
                            <Listbox.Label className="sr-only">
                              {" "}
                              Assign{" "}
                            </Listbox.Label>
                            <div className="relative">
                              <Listbox.Button className="relative inline-flex items-center whitespace-nowrap rounded-full bg-brand-50 px-2 py-2 text-sm font-medium text-brand-500 hover:bg-brand-100 sm:px-3">
                                {assigned.value === null ? (
                                  <UserCircleIcon
                                    className="h-5 w-5 flex-shrink-0 text-brand-300 sm:-ml-1"
                                    aria-hidden="true"
                                  />
                                ) : (
                                  <img
                                    src={assigned.avatar}
                                    alt=""
                                    className="h-5 w-5 flex-shrink-0 rounded-full"
                                  />
                                )}

                                <span
                                  className={clsx(
                                    assigned.value === null
                                      ? ""
                                      : "text-brand-900",
                                    "hidden truncate sm:ml-2 sm:block"
                                  )}
                                >
                                  {assigned.value === null
                                    ? "Assign"
                                    : assigned.name}
                                </span>
                              </Listbox.Button>

                              <Transition
                                show={open}
                                as={Fragment}
                                leave="transition ease-in duration-100"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                              >
                                <Listbox.Options className="absolute right-0 z-10 mt-1 max-h-56 w-52 overflow-auto rounded-lg bg-brand-50 py-3 text-base shadow ring-1 ring-brand-900 ring-opacity-5 focus:outline-none sm:text-sm">
                                  {assignees.map((assignee) => (
                                    <Listbox.Option
                                      key={assignee.value}
                                      className={({ active }) =>
                                        clsx(
                                          active
                                            ? "bg-brand-100"
                                            : "bg-brand-50",
                                          "relative cursor-default select-none px-3 py-2"
                                        )
                                      }
                                      value={assignee}
                                    >
                                      <div className="flex items-center">
                                        {assignee.avatar ? (
                                          <img
                                            src={assignee.avatar}
                                            alt=""
                                            className="h-5 w-5 flex-shrink-0 rounded-full"
                                          />
                                        ) : (
                                          <UserCircleIcon
                                            className="h-5 w-5 flex-shrink-0 text-brand-400"
                                            aria-hidden="true"
                                          />
                                        )}

                                        <span className="ml-3 block truncate font-medium">
                                          {assignee.name}
                                        </span>
                                      </div>
                                    </Listbox.Option>
                                  ))}
                                </Listbox.Options>
                              </Transition>
                            </div>
                          </>
                        )}
                      </Listbox>

                      <Listbox
                        as="div"
                        value={labelled}
                        onChange={setLabelled}
                        className="flex-shrink-0"
                      >
                        {({ open }) => (
                          <>
                            <Listbox.Label className="sr-only">
                              {" "}
                              Add a label{" "}
                            </Listbox.Label>
                            <div className="relative">
                              <Listbox.Button className="relative inline-flex items-center whitespace-nowrap rounded-full bg-brand-50 px-2 py-2 text-sm font-medium text-brand-500 hover:bg-brand-100 sm:px-3">
                                <TagIcon
                                  className={clsx(
                                    labelled.value === null
                                      ? "text-brand-300"
                                      : "text-brand-500",
                                    "h-5 w-5 flex-shrink-0 sm:-ml-1"
                                  )}
                                  aria-hidden="true"
                                />
                                <span
                                  className={clsx(
                                    labelled.value === null
                                      ? ""
                                      : "text-brand-900",
                                    "hidden truncate sm:ml-2 sm:block"
                                  )}
                                >
                                  {labelled.value === null
                                    ? "Label"
                                    : labelled.name}
                                </span>
                              </Listbox.Button>

                              <Transition
                                show={open}
                                as={Fragment}
                                leave="transition ease-in duration-100"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                              >
                                <Listbox.Options className="absolute right-0 z-10 mt-1 max-h-56 w-52 overflow-auto rounded-lg bg-brand-50 py-3 text-base shadow ring-1 ring-brand-900 ring-opacity-5 focus:outline-none sm:text-sm">
                                  {labels.map((label) => (
                                    <Listbox.Option
                                      key={label.value}
                                      className={({ active }) =>
                                        clsx(
                                          active
                                            ? "bg-brand-100"
                                            : "bg-brand-50",
                                          "relative cursor-default select-none px-3 py-2"
                                        )
                                      }
                                      value={label}
                                    >
                                      <div className="flex items-center">
                                        <span className="block truncate font-medium">
                                          {label.name}
                                        </span>
                                      </div>
                                    </Listbox.Option>
                                  ))}
                                </Listbox.Options>
                              </Transition>
                            </div>
                          </>
                        )}
                      </Listbox>

                      <Listbox
                        as="div"
                        value={dated}
                        onChange={setDated}
                        className="flex-shrink-0"
                      >
                        {({ open }) => (
                          <>
                            <Listbox.Label className="sr-only">
                              {" "}
                              Add a due date{" "}
                            </Listbox.Label>
                            <div className="relative">
                              <Listbox.Button className="relative inline-flex items-center whitespace-nowrap rounded-full bg-brand-50 px-2 py-2 text-sm font-medium text-brand-500 hover:bg-brand-100 sm:px-3">
                                <CalendarIcon
                                  className={clsx(
                                    dated.value === null
                                      ? "text-brand-300"
                                      : "text-brand-500",
                                    "h-5 w-5 flex-shrink-0 sm:-ml-1"
                                  )}
                                  aria-hidden="true"
                                />
                                <span
                                  className={clsx(
                                    dated.value === null
                                      ? ""
                                      : "text-brand-900",
                                    "hidden truncate sm:ml-2 sm:block"
                                  )}
                                >
                                  {dated.value === null
                                    ? "Due date"
                                    : dated.name}
                                </span>
                              </Listbox.Button>

                              <Transition
                                show={open}
                                as={Fragment}
                                leave="transition ease-in duration-100"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                              >
                                <Listbox.Options className="absolute right-0 z-10 mt-1 max-h-56 w-52 overflow-auto rounded-lg bg-brand-50 py-3 text-base shadow ring-1 ring-brand-900 ring-opacity-5 focus:outline-none sm:text-sm">
                                  {dueDates.map((dueDate) => (
                                    <Listbox.Option
                                      key={dueDate.value}
                                      className={({ active }) =>
                                        clsx(
                                          active
                                            ? "bg-brand-100"
                                            : "bg-brand-50",
                                          "relative cursor-default select-none px-3 py-2"
                                        )
                                      }
                                      value={dueDate}
                                    >
                                      <div className="flex items-center">
                                        <span className="block truncate font-medium">
                                          {dueDate.name}
                                        </span>
                                      </div>
                                    </Listbox.Option>
                                  ))}
                                </Listbox.Options>
                              </Transition>
                            </div>
                          </>
                        )}
                      </Listbox>
                    </div>
                    <div className="flex items-center justify-between space-x-3 border-t border-brand-200 px-2 py-2 sm:px-3">
                      <div className="flex">
                        <button
                          type="button"
                          className="group -my-2 -ml-2 inline-flex items-center rounded-full px-3 py-2 text-left text-brand-400"
                        >
                          <PaperClipIcon
                            className="-ml-1 mr-2 h-5 w-5 group-hover:text-brand-500"
                            aria-hidden="true"
                          />
                          <span className="text-sm italic text-brand-500 group-hover:text-brand-600">
                            Attach a file
                          </span>
                        </button>
                      </div>
                      <div className="flex-shrink-0 space-x-1">
                        {post ? (
                          <>
                            <button
                              type="button"
                              onClick={handleOnClick}
                              className="inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold text-brand-600 shadow-sm hover:bg-brand-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                            >
                              Delete
                            </button>
                            <button
                              type="submit"
                              className="inline-flex items-center rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                            >
                              Save
                            </button>
                          </>
                        ) : (
                          <button
                            type="submit"
                            className="inline-flex items-center rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                          >
                            Create
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
                <div className="mt-5 sm:mt-6">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                    onClick={() => setOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

export default function Bookmark() {
  const [open, setOpen] = useState(false);
  const [post, setPost] = useState<Post | null>(null);
  const posts = trpc.posts.useQuery();
  if (!posts.data) {
    return <div>Loading...</div>;
  }
  console.log(posts.data);
  return (
    <>
      <Modal open={open} post={post} setOpen={setOpen} setPost={setPost} />
      <div className="pb-36">
        <Popover as="header">
          {({ open }) => (
            <>
              <div className="px-4 sm:px-6 lg:px-8 py-4">
                <div className="relative flex justify-between">
                  <div className="flex">
                    <div className="flex flex-shrink-0 items-center">
                      <SwatchIcon className="mx-auto h-8 w-8 text-brand-50" />
                    </div>
                  </div>
                  <div className="flex items-center md:absolute md:inset-y-0 md:right-0 lg:hidden">
                    {/* Mobile menu button */}
                    <Popover.Button className="-mx-2 inline-flex items-center justify-center rounded-md p-2 text-brand-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-50">
                      <span className="sr-only">Open menu</span>
                      {open ? (
                        <XMarkIcon
                          className="block h-6 w-6"
                          aria-hidden="true"
                        />
                      ) : (
                        <Bars3Icon
                          className="block h-6 w-6"
                          aria-hidden="true"
                        />
                      )}
                    </Popover.Button>
                  </div>
                  <div className="hidden lg:flex lg:items-center lg:justify-end xl:col-span-4">
                    <a
                      href="#"
                      className="text-sm font-medium text-brand-50 hover:underline"
                    >
                      Go Premium
                    </a>
                    <a
                      href="#"
                      className="ml-5 flex-shrink-0 rounded-full p-1 text-brand-50"
                    >
                      <span className="sr-only">View notifications</span>
                      <BellIcon className="h-6 w-6" aria-hidden="true" />
                    </a>

                    {/* Profile dropdown */}
                    <Menu as="div" className="relative ml-5 flex-shrink-0">
                      <div>
                        <Menu.Button className="flex rounded-full">
                          <span className="sr-only">Open user menu</span>
                          <img
                            className="h-8 w-8 rounded-full"
                            src={user.imageUrl}
                            alt=""
                          />
                        </Menu.Button>
                      </div>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-brand-50 py-1 shadow-lg ring-1 ring-brand-900 ring-opacity-5 focus:outline-none">
                          {userNavigation.map((item) => (
                            <Menu.Item key={item.name}>
                              {({ active }) => (
                                <Link
                                  href={item.href}
                                  className={clsx(
                                    active ? "bg-brand-100" : "",
                                    "block px-4 py-2 text-sm text-brand-700"
                                  )}
                                >
                                  {item.name}
                                </Link>
                              )}
                            </Menu.Item>
                          ))}
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </div>
                </div>
              </div>

              <Popover.Panel as="nav" className="lg:hidden" aria-label="Global">
                <div className="pt-4">
                  <div className="mx-auto flex max-w-3xl items-center px-4 sm:px-6">
                    <div className="flex-shrink-0">
                      <img
                        className="h-10 w-10 rounded-full"
                        src={user.imageUrl}
                        alt=""
                      />
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium text-brand-50">
                        {user.name}
                      </div>
                      <div className="text-sm font-medium text-brand-500">
                        {user.email}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="ml-auto flex-shrink-0 rounded-full p-1 text-brand-50"
                    >
                      <span className="sr-only">View notifications</span>
                      <BellIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="mx-auto mt-3 max-w-3xl space-y-1 px-2 sm:px-4">
                    {userNavigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="block rounded-md px-3 py-2 text-base font-medium text-brand-50 hover:bg-brand-800"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="mx-auto mt-6 max-w-3xl px-4 sm:px-6">
                  <a
                    href="#"
                    className="flex w-full items-center justify-center rounded-md border border-transparent bg-brand-600 px-4 py-2 text-base font-medium text-brand-50 shadow-sm hover:bg-brand-700"
                  >
                    Go premium
                  </a>
                </div>
              </Popover.Panel>
            </>
          )}
        </Popover>
        <div className="mt-12 mx-auto max-w-xl px-4 text-center">
          <p className="mt-2 text-3xl font-semibold text-brand-50">
            Organize and collect your favorite content in one place.
          </p>
          <div className="mt-8 flex flex-1 justify-center">
            <div className="w-full px-2 lg:px-6">
              <label htmlFor="search" className="sr-only">
                Search projects
              </label>
              <div className="relative flex items-center text-brand-50">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
                </div>
                <input
                  id="search"
                  name="search"
                  className="block w-full rounded-lg border-0 bg-brand-600 bg-opacity-25 px-10 py-3 text-brand-50 placeholder:text-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-50"
                  placeholder="Search"
                  type="search"
                />
                <button type="button" onClick={() => setOpen(true)}>
                  <PencilSquareIcon className="absolute right-3 top-3 h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 px-2 lg:px-8">
          <div className="flex items-center justify-center">
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 lg:w-auto w-full">
              {posts.data.map((item, index) => (
                <div key={index} className="relative w-full px-4 py-6">
                  <div className="relative rounded-2xl border border-brand-600 bg-brand-800 p-5 text-sm leading-6">
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(true);
                        setPost(item as unknown as Post);
                      }}
                      className="absolute inset-0 rounded-2xl"
                    ></button>
                    <div className="space-y-6">
                      <blockquote className="text-brand-50">
                        <p>{item.title}</p>
                      </blockquote>
                      <figcaption className="flex items-center gap-x-4">
                        <div>
                          <div className="font-semibold text-brand-50">
                            {item.author.name}
                          </div>
                          <div className="text-brand-50">{`@${item.author.username}`}</div>
                        </div>
                      </figcaption>
                      <div className="relative flex flex-col space-y-6">
                        <div className="flex space-x-6">
                          <span className="inline-flex items-center text-sm">
                            <button
                              type="button"
                              className="inline-flex space-x-2 text-brand-50"
                            >
                              <HandThumbUpIcon
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
                              <span className="font-medium text-brand-50">
                                {item.like}
                              </span>
                              <span className="sr-only">likes</span>
                            </button>
                          </span>
                          <span className="inline-flex items-center text-sm">
                            <button
                              type="button"
                              className="inline-flex space-x-2 text-brand-50"
                            >
                              <ChartBarIcon
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
                              <span className="font-medium text-brand-50">
                                {item.stat}
                              </span>
                              <span className="sr-only">replies</span>
                            </button>
                          </span>
                          <span className="inline-flex items-center text-sm">
                            <button
                              type="button"
                              className="inline-flex space-x-2 text-brand-50"
                            >
                              <BookmarkIcon
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
                              <span className="font-medium text-brand-50">
                                {item.bookmark}
                              </span>
                              <span className="sr-only">views</span>
                            </button>
                          </span>
                        </div>
                        {item.booksmarks.length > 0 ? (
                          <div className="flex text-sm">
                            <span className="inline-flex items-center text-sm">
                              <button
                                type="button"
                                className="inline-flex space-x-2 text-brand-50"
                              >
                                <CheckIcon
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />
                                <span className="font-medium text-brand-50">
                                  Bookmarked
                                </span>
                              </button>
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 sm:flex sm:justify-center sm:px-6 sm:pb-5 lg:px-8">
        <div className="pointer-events-auto flex items-center justify-between border border-brand-600 bg-brand-900 bg-opacity-90 p-6 backdrop-blur-md sm:gap-x-16 sm:rounded-xl">
          <Link href="/" className="border border-transparent p-2">
            <HomeIcon className="h-8 w-8 rounded-full text-brand-50/40" />
          </Link>
          <Link href="/community" className="border border-transparent p-2">
            <UserGroupIcon className="h-8 w-8 text-brand-50/40" />
          </Link>
          <Link
            href="/bookmark"
            className="rounded-full border border-brand-base bg-brand-800 p-2"
          >
            <BookmarkIcon className="h-8 w-8 text-brand-50/70" />
          </Link>
          <Link href="/inbox" className="border border-transparent p-2">
            <InboxStackIcon className="h-8 w-8 text-brand-50/40" />
          </Link>
        </div>
      </div>
    </>
  );
}
