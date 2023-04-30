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

/**
 *
 * @prop edit signifies if there's an active post
 */
export default function PostButtons({
  edit,
  setLength,
  descriptionRef,
}: Props) {
  const utils = trpc.useContext();
  const profile = trpc.getProfile.useQuery();

  const handleOnSuccess = (data: string | undefined) => {
    toast.dismiss();
    utils.getProfile.invalidate();
    setLength((length) => data?.length ?? length);
    toast.success("Updated your post with AI generated text!");
    descriptionRef.current
      ? (descriptionRef.current.value = (data ?? "").trim())
      : null;
  };

  /**
   * event handler for relaying error message to user
   * @see handleOnDeleteAttachment
   */
  const handleOnError = (msg: string) => {
    toast.dismiss();
    toast.error(msg);
  };

  const generateAI = trpc.generateAIResponse.useMutation({
    onSuccess: (data) => handleOnSuccess(data),
    onError: (err: any) => handleOnError(err.message ?? API_ERROR_MESSAGE),
  });

  const handleOnGenerateAI = (prompt: string | undefined) => {
    if (!prompt || !profile.data) return;
    if (profile.data.credits < 10) {
      toast.dismiss();
      return toast.error("You don't have enough credits");
    }
    toast.loading("Loading...");
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
        <span>Use AI</span>
        <span className="flex items-center space-x-1">
          <span>(5</span>
          <TicketIcon className="h-5 w-5" />)
        </span>
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
              <span>(1</span>
              <TicketIcon className="h-5 w-5" />)
            </span>
          </>
        )}
      </button>
    </div>
  );
}
