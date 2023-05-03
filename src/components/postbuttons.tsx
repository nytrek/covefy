import { TicketIcon } from "@heroicons/react/24/outline";
import { trpc } from "@src/utils/trpc";
import { Dispatch, MutableRefObject, SetStateAction } from "react";
import { toast } from "react-hot-toast";

const API_ERROR_MESSAGE =
  "API request failed, please refresh the page and try again.";

interface Props {
  edit: boolean;
  setLength: Dispatch<SetStateAction<number>>;
  descriptionRef: MutableRefObject<HTMLTextAreaElement | null>;
}

export default function PostButtons({
  edit,
  setLength,
  descriptionRef,
}: Props) {
  const utils = trpc.useContext();
  const profile = trpc.getProfile.useQuery();

  const handleOnSuccess = (data: string | undefined) => {
    utils.getProfile.invalidate();
    setLength((length) => data?.length ?? length);
    toast.success("Updated your post with AI generated text!");
    descriptionRef.current
      ? (descriptionRef.current.value = (data ?? "").trim())
      : null;
  };

  const handleOnError = (msg: string) => {
    toast.error(msg);
  };

  const generateAI = trpc.generateAIResponse.useMutation({
    onSuccess: (data) => handleOnSuccess(data),
    onError: (err: any) => handleOnError(err.message ?? API_ERROR_MESSAGE),
  });

  const handleOnGenerateAI = (prompt: string | undefined) => {
    if (!prompt || !profile.data) return;
    if (profile.data.credits < 10)
      return toast.error("You don't have enough credits");
    generateAI.mutate({
      prompt,
      credits: profile.data.credits - 10,
    });
  };
  return (
    <div className="mt-5 space-y-2 sm:mt-6">
      <button
        type="button"
        onClick={() => handleOnGenerateAI(descriptionRef.current?.value)}
        className="inline-flex w-full justify-center space-x-2 rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        {generateAI.isLoading ? (
          <svg
            className="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
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
