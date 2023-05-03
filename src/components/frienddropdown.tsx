import { Listbox, Transition } from "@headlessui/react";
import { UserCircleIcon } from "@heroicons/react/20/solid";
import { Profile } from "@prisma/client";
import { trpc } from "@src/utils/trpc";
import clsx from "clsx";
import { Dispatch, Fragment, SetStateAction } from "react";

interface Props {
  friend: Profile | null;
  setFriend: Dispatch<SetStateAction<Profile | null>>;
}

export default function FriendDropdown({ friend, setFriend }: Props) {
  const friends = trpc.getFriends.useQuery();
  return (
    <Listbox
      as="div"
      value={friend}
      onChange={setFriend}
      className="flex-shrink-0"
    >
      {({ open }) => (
        <>
          <Listbox.Label className="sr-only"> Send to </Listbox.Label>
          <div className="relative">
            <Listbox.Button className="relative inline-flex items-center whitespace-nowrap rounded-full border border-brand-800 bg-brand-50 px-2 py-2 text-sm font-medium text-brand-500 hover:bg-brand-100 sm:px-3">
              {friend === null ? (
                <UserCircleIcon
                  className="h-5 w-5 flex-shrink-0 text-brand-300"
                  aria-hidden="true"
                />
              ) : (
                <img
                  src={friend.imageUrl}
                  alt="avatar"
                  className="h-5 w-5 flex-shrink-0 rounded-full"
                />
              )}
            </Listbox.Button>

            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute right-0 z-10 mt-1 h-32 max-h-56 w-52 overflow-auto overflow-y-auto rounded-lg bg-brand-50 py-3 text-base shadow ring-1 ring-brand-900 ring-opacity-5 focus:outline-none sm:text-sm">
                <Listbox.Option
                  key={null}
                  className={({ active }) =>
                    clsx(
                      active ? "bg-brand-100" : "bg-brand-50",
                      "relative cursor-default select-none px-3 py-2"
                    )
                  }
                  value={null}
                >
                  <div className="flex items-center">
                    <UserCircleIcon
                      className="h-5 w-5 flex-shrink-0 text-brand-400"
                      aria-hidden="true"
                    />
                    <span className="ml-3 block truncate text-sm font-bold text-brand-500">
                      Unassigned
                    </span>
                  </div>
                </Listbox.Option>
                {friends.data?.map((friend) => (
                  <Listbox.Option
                    key={friend.friend.id}
                    className={({ active }) =>
                      clsx(
                        active ? "bg-brand-100" : "bg-brand-50",
                        "relative cursor-default select-none px-3 py-2"
                      )
                    }
                    value={friend.friend}
                  >
                    <div className="flex items-center">
                      {friend.friend.imageUrl ? (
                        <img
                          src={friend.friend.imageUrl}
                          alt="avatar"
                          className="h-5 w-5 flex-shrink-0 rounded-full"
                        />
                      ) : (
                        <UserCircleIcon
                          className="h-5 w-5 flex-shrink-0 text-brand-400"
                          aria-hidden="true"
                        />
                      )}

                      <span className="ml-3 block truncate text-sm font-bold text-brand-500">
                        {friend.friend.name}
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
  );
}
