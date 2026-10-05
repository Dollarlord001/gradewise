type Props = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ title, description, action, className }: Props) {
  return (
    <div className={`rounded-xl border p-6 text-center ${className ?? ""}`}>
      <h3 className="font-semibold">{title}</h3>
      {description ? (
        <p className="mt-1 text-sm opacity-70">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
