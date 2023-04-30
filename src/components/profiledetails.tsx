import { Profile } from "@prisma/client";
import { CheckBadgeIcon } from "@heroicons/react/20/solid";

export default function ProfileDetails({ profile }: { profile: Profile }) {
  return (
    <div>
      <div className="flex items-center space-x-2">
        <h1 className="text-2xl font-bold text-brand-50">{profile.name}</h1>
        {profile.premium ? (
          <CheckBadgeIcon className="mt-1 h-6 w-6 text-brand-50" />
        ) : null}
      </div>
      <p className="text-sm font-medium text-brand-500">@{profile.username}</p>
    </div>
  );
}
