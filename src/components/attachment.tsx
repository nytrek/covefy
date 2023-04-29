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

function Image({ src }: { src: string }) {
  return (
    <img className="h-full w-full rounded-lg" src={src} alt="attachment" />
  );
}

function Button({ handleOnClick }: { handleOnClick: () => void }) {
  return (
    <button
      type="button"
      className="absolute right-2 top-2 rounded-full bg-brand-50 bg-opacity-75 p-1.5 backdrop-blur-sm transition duration-300 hover:bg-opacity-100"
      onClick={handleOnClick}
    >
      <XMarkIcon className="h-5 w-5 text-brand-600" />
    </button>
  );
}

/**
 * @prop attachment is a local state that is used
 * to preview a file that a user has selected
 * locally
 *
 * @prop postAttachment is a reference to an object
 * containing meta details about a post which this
 * attachment is connected to. The object contains
 * an attachment which is a URL reference to
 * @link https://upload.io/ CDN and an attachmentPath
 * which is the folder path for where this attachment
 * is stored.
 */
export default function Attachment({
  attachment,
  setAttachment,
  postAttachment,
  handleUpdate,
}: Props) {
  /**
   * when a user initiates the @function handleOnDeleteAttachment
   * this mutation will run against the corresponding procedure
   * in the backend to delete the attachment from upload.io
   */
  const deleteAttachment = trpc.deleteAttachment.useMutation({});

  /**
   * event handler for relaying error message to user
   * @see handleOnDeleteAttachment
   */
  const handleOnError = (msg: string) => {
    toast.dismiss();
    toast.error(msg);
  };

  /**
   * event handler that will trigger a delete mutation
   * once the user clicks on the x mark button.
   */
  const handleOnDeleteAttachment = () => {
    /**
     * The logic here is that the only scenario for an attachment
     * to be deleted is if its already connected to a post. So we'll
     * only proceed if we have an attachmentPath inside the
     * postAttachment object. The attachmentPath will be used
     * along with the Upload.io's SDK to delete the attachment
     * from the CDN.
     */
    if (!postAttachment?.attachmentPath) return;
    toast.loading("Loading...");
    deleteAttachment.mutate(
      {
        attachmentPath: postAttachment.attachmentPath,
      },
      {
        onSuccess: () => handleUpdate(),
        onError: (err: any) => handleOnError(err.message ?? API_ERROR_MESSAGE),
      }
    );
  };

  const handleOnClick = () => {
    if (postAttachment?.attachmentPath) {
      handleOnDeleteAttachment();
    } else {
      setAttachment(null);
    }
  };
  return (
    <>
      {attachment ? (
        <div className="relative">
          <Image src={URL.createObjectURL(attachment)} />
          <Button handleOnClick={handleOnClick} />
        </div>
      ) : postAttachment?.attachment ? (
        <div className="relative">
          <Image src={postAttachment.attachment} />
          <Button handleOnClick={handleOnClick} />
        </div>
      ) : null}
    </>
  );
}
