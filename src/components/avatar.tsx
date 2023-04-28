interface Props {
  imageUrl: string | undefined;
}

export default function Avatar({ imageUrl }: Props) {
  return (
    <div className="flex-shrink-0">
      <div className="relative">
        {imageUrl ? (
          <img className="h-16 w-16 rounded-full" src={imageUrl} alt="avatar" />
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
