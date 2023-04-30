import { XMarkIcon } from "@heroicons/react/24/outline";
import { Dispatch, SetStateAction } from "react";

interface Props {
  attachment: File | string | null;
  setAttachment: Dispatch<SetStateAction<File | string | null>>;
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

export default function Attachment({ attachment, setAttachment }: Props) {
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
            <Image src={URL.createObjectURL(attachment)} />
          )}
          <Button handleOnClick={() => setAttachment(null)} />
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
            <Image src={attachment} />
          )}
          <Button handleOnClick={() => setAttachment(null)} />
        </div>
      ) : null}
    </>
  );
}
