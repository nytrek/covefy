import { TicketIcon } from "@heroicons/react/24/outline";

interface Props {
  edit: boolean;
  isLoading: boolean;
  handleOnGenerateAI: () => void;
}

export default function PostButtons({
  edit,
  isLoading,
  handleOnGenerateAI,
}: Props) {
  return (
    <div className="mt-5 space-y-2 sm:mt-6">
      <button
        type="button"
        onClick={handleOnGenerateAI}
        className="inline-flex w-full justify-center space-x-2 rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        {isLoading ? (
          <svg
            className="h-5 w-5 animate-spin text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        ) : (
          <>
            <span>Use AI</span>
            <span className="flex items-center space-x-1">
              <span>(10</span>
              <TicketIcon className="h-5 w-5" />)
            </span>
          </>
        )}
      </button>
      <button
        type="submit"
        className="inline-flex w-full justify-center space-x-2 rounded-md px-3 py-2 text-sm font-semibold text-brand-600 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        disabled={isLoading}
      >
        {edit ? (
          <span>Save</span>
        ) : (
          <>
            <span>Create</span>
            <span className="flex items-center space-x-1">
              <span>(5</span>
              <TicketIcon className="h-5 w-5" />)
            </span>
          </>
        )}
      </button>
    </div>
  );
}
