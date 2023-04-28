import { useUser } from "@clerk/nextjs";

export default function Avatar() {
  const { user } = useUser();
  return (
    <div className="flex-shrink-0">
      <div className="relative">
        {user?.profileImageUrl ? (
          <img
            className="h-16 w-16 rounded-full"
            src={user.profileImageUrl}
            alt="avatar"
          />
        ) : (
          <span className="block h-16 w-16 rounded-full bg-brand-700"></span>
        )}
        <span
          className="absolute inset-0 rounded-full shadow-inner"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
