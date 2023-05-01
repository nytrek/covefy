import { SignedIn, useUser } from "@clerk/nextjs";
import { TicketIcon } from "@heroicons/react/24/outline";
import { Prisma } from "@prisma/client";
import { FormEvent, useState } from "react";

const MAX_TOKENS = 720;

type Post = Prisma.PostGetPayload<{
  include: {
    _count: true;
    author: true;
    friend: true;
    likes: {
      include: {
        profile: {
          select: {
            id: true;
          };
        };
      };
    };
    comments: {
      include: {
        author: {
          select: {
            id: true;
          };
        };
      };
    };
    bookmarks: {
      include: {
        profile: {
          select: {
            id: true;
          };
        };
      };
    };
  };
}>;

interface Props {
  item: Post;
  handleOnCreateComment: (e: FormEvent<HTMLFormElement>) => void;
}

export default function CommentBox({ item, handleOnCreateComment }: Props) {
  const { user } = useUser();
  const [length, setLength] = useState(0);
  const progress = `
    radial-gradient(closest-side, #242427 85%, transparent 80% 100%),
    conic-gradient(white ${Math.round((length / MAX_TOKENS) * 100)}%, #242427 0)
  `;
  return (
    <SignedIn>
      <div className="mt-6 flex gap-x-3">
        {user?.profileImageUrl ? (
          <img
            src={user.profileImageUrl}
            alt=""
            className="h-6 w-6 flex-none rounded-full bg-brand-700"
          />
        ) : (
          <span className="block h-6 w-6 flex-none rounded-full bg-brand-700"></span>
        )}
        <form className="relative flex-auto" onSubmit={handleOnCreateComment}>
          <div className="overflow-hidden rounded-lg pb-12 shadow-sm ring-1 ring-inset ring-brand-300 focus-within:ring-2">
            <label htmlFor="comment" className="sr-only">
              Add your comment
            </label>
            <textarea
              id={String(item.id)}
              rows={2}
              name="comment"
              className="block w-full resize-none border-0 bg-transparent py-1.5 text-sm leading-6 text-brand-50 placeholder:text-brand-50 focus:ring-0"
              placeholder="Add your comment..."
              maxLength={MAX_TOKENS}
              onChange={(e) => setLength(e.target.value.length)}
              required
            />
          </div>

          <div className="absolute inset-x-0 bottom-0 flex items-center justify-end py-2 pl-3 pr-2">
            <div
              className="h-4 w-4 rounded-full"
              style={{ background: progress }}
            ></div>
            <button
              type="submit"
              className="flex items-center space-x-1 rounded-md px-2.5 py-1.5 text-sm font-semibold text-brand-50 shadow-sm"
            >
              <span>Comment (1</span>
              <TicketIcon className="h-5 w-5" />)
            </button>
          </div>
        </form>
      </div>
    </SignedIn>
  );
}
