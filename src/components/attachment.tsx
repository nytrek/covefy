import { XMarkIcon } from "@heroicons/react/24/outline";
import { trpc } from "@src/utils/trpc";
import { Dispatch, SetStateAction } from "react";
import { toast } from "react-hot-toast";

const API_ERROR_MESSAGE =
  "API request failed, please refresh the page and try again.";

interface Props {
  attachment: File | null;
  setAttachment: Dispatch<SetStateAction<File | null>>;
  postAttachment?: {
    attachment: string | null | undefined;
    attachmentPath: string | null | undefined;
  };
  handleUpdate: () => void;
}

export default function Attachment({
  attachment,
  setAttachment,
  postAttachment,
  handleUpdate,
}: Props) {
  const deleteAttachment = trpc.deleteAttachment.useMutation({
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });
  const handleOnDeleteAttachment = () => {
    if (!postAttachment?.attachmentPath) return;
    toast.loading("Loading...");
    deleteAttachment.mutate(
      {
        attachmentPath: postAttachment.attachmentPath,
      },
      {
        onSuccess: () => {
          handleUpdate();
        },
      }
    );
  };
  return (
    <>
      {attachment ? (
        <div className="relative">
          <img
            className="h-full w-full rounded-lg"
            src={URL.createObjectURL(attachment)}
            alt="attachment"
          />
          <button
            type="button"
            className="absolute right-2 top-2 rounded-full bg-brand-50 bg-opacity-75 p-1.5 backdrop-blur-sm transition duration-300 hover:bg-opacity-100"
            onClick={() => setAttachment(null)}
          >
            <XMarkIcon className="h-5 w-5 text-brand-600" />
          </button>
        </div>
      ) : postAttachment?.attachment ? (
        <div className="relative">
          <img
            className="h-full w-full rounded-lg"
            src={postAttachment.attachment}
            alt="attachment"
          />
          <button
            type="button"
            className="absolute right-2 top-2 rounded-full bg-brand-50 bg-opacity-75 p-1.5 backdrop-blur-sm transition duration-300 hover:bg-opacity-100"
            onClick={handleOnDeleteAttachment}
          >
            <XMarkIcon className="h-5 w-5 text-brand-600" />
          </button>
        </div>
      ) : null}
    </>
  );
}
