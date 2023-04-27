import { Listbox, Transition } from "@headlessui/react";
import { TagIcon } from "@heroicons/react/20/solid";
import { Label } from "@prisma/client";
import clsx from "clsx";
import { Dispatch, Fragment, SetStateAction } from "react";

interface Props {
  label: Label | null;
  setLabel: Dispatch<SetStateAction<Label | null>>;
}

export default function LabelDropdown({ label, setLabel }: Props) {
  return (
    <Listbox
      as="div"
      value={label}
      onChange={setLabel}
      className="flex-shrink-0"
    >
      {({ open }) => (
        <>
          <Listbox.Label className="sr-only"> Set label </Listbox.Label>
          <div className="relative">
            <Listbox.Button className="relative inline-flex items-center whitespace-nowrap rounded-full bg-brand-50 px-2 py-2 text-sm font-medium text-brand-500 hover:bg-brand-100 sm:px-3">
              <TagIcon
                className="h-5 w-5 flex-shrink-0 text-brand-500 sm:-ml-1"
                aria-hidden="true"
              />
              <span className="mx-1 w-16 cursor-pointer truncate bg-transparent text-sm font-bold text-brand-500">
                {label ?? "Set label"}
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
                <Listbox.Option
                  key="PUBLIC"
                  className={({ active }) =>
                    clsx(
                      active ? "bg-brand-100" : "bg-brand-50",
                      "relative cursor-default select-none px-3 py-2"
                    )
                  }
                  value="PUBLIC"
                >
                  <div className="flex items-center">
                    <span className="block truncate text-sm font-bold text-brand-500">
                      PUBLIC
                    </span>
                  </div>
                </Listbox.Option>
                <Listbox.Option
                  key="PRIVATE"
                  className={({ active }) =>
                    clsx(
                      active ? "bg-brand-100" : "bg-brand-50",
                      "relative cursor-default select-none px-3 py-2"
                    )
                  }
                  value="PRIVATE"
                >
                  <div className="flex items-center">
                    <span className="block truncate text-sm font-bold text-brand-500">
                      PRIVATE
                    </span>
                  </div>
                </Listbox.Option>
              </Listbox.Options>
            </Transition>
          </div>
        </>
      )}
    </Listbox>
  );
}
