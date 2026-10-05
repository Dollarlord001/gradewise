type Props = {
  value?: number;
  mastery?: number;
  label?: string;
};

export function MasteryBadge({ value, mastery: masteryProp, label }: Props) {
  const mastery = Math.max(0, Math.min(100, Math.round(value ?? masteryProp ?? 0)));

  return (
    <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium">
      {label ?? `${mastery}% mastery`}
    </span>
  );
}
