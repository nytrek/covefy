export default function ProfileStats({
  stats,
  header,
}: {
  stats: { name: string; value: number }[];
  header?: string;
}) {
  return (
    <div>
      <h3 className="text-base font-semibold leading-6 text-brand-50">
        {header ?? "Your stats"}
      </h3>
      <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="overflow-hidden rounded-lg border border-brand-600 bg-brand-800 px-4 py-5 shadow sm:p-6"
          >
            <dt className="truncate text-sm font-medium text-brand-500">
              {stat.name}
            </dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-brand-50">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
