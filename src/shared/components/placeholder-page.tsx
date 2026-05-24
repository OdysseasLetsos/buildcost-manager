type PlaceholderPageProps = {
  title: string;
  description: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-sm font-medium text-blue-700">BuildCost Manager</p>
      <h2 className="mt-3 text-2xl font-semibold text-slate-950">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
        {description}
      </p>
    </section>
  );
}
