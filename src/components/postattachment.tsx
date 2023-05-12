import { XMarkIcon } from "@heroicons/react/24/outline";

interface Props {
  attachment: File | string | null;
  setAttachment: (attachment: File | string | null) => void;
}

export default function PostAttachment({ attachment, setAttachment }: Props) {
  return (
    <>
      {attachment && typeof attachment !== "string" ? (
        <div className="relative">
          {attachment.name.includes(".mp4") ? (
            <video className="w-full rounded-lg" controls>
              <source src={URL.createObjectURL(attachment)} type="video/mp4" />
            </video>
          ) : attachment.name.includes(".mp3") ? (
            <audio className="w-3/4 rounded-lg" controls>
              <source src={URL.createObjectURL(attachment)} type="audio/mp3" />
            </audio>
          ) : (
            <img
              className="h-full w-full rounded-lg"
              src={URL.createObjectURL(attachment)}
              alt="attachment"
            />
          )}
          <button
            type="button"
            className="absolute right-2 top-2 rounded-full bg-brand-50 bg-opacity-75 p-1.5 backdrop-blur-sm transition duration-300 hover:bg-opacity-100"
            onClick={() => setAttachment(null)}
          >
            <XMarkIcon className="h-5 w-5 text-brand-600" />
          </button>
        </div>
      ) : attachment && typeof attachment === "string" ? (
        <div className="relative">
          {attachment.includes(".mp4") ? (
            <video className="w-full rounded-lg" controls>
              <source src={attachment} type="video/mp4" />
            </video>
          ) : attachment.includes(".mp3") ? (
            <audio className="w-3/4 rounded-lg" controls>
              <source src={attachment} type="audio/mp3" />
            </audio>
          ) : (
            <img
              className="h-full w-full rounded-lg"
              src={attachment}
              alt="attachment"
            />
          )}
          <button
            type="button"
            className="absolute right-2 top-2 rounded-full bg-brand-50 bg-opacity-75 p-1.5 backdrop-blur-sm transition duration-300 hover:bg-opacity-100"
            onClick={() => setAttachment(null)}
          >
            <XMarkIcon className="h-5 w-5 text-brand-600" />
          </button>
        </div>
      ) : null}
    </>
  );
}
