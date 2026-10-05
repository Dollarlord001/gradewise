"use client";

import { useEffect, useState } from "react";
import { formatTimer } from "@/lib/format";
import { cn } from "@/lib/cn";

export function CbtTimer({
  endsAt,
  onExpire,
}: {
  endsAt: string;
  onExpire?: () => void;
}) {
  const [remaining, setRemaining] = useState(() => {
    const end = new Date(endsAt).getTime();
    return Math.max(0, Math.floor((end - Date.now()) / 1000));
  });

  useEffect(() => {
    const id = setInterval(() => {
      const end = new Date(endsAt).getTime();
      const next = Math.max(0, Math.floor((end - Date.now()) / 1000));
      setRemaining(next);
      if (next <= 0) {
        clearInterval(id);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [endsAt, onExpire]);

  const urgent = remaining > 0 && remaining < 300;

  return (
    <div
      className={cn(
        "rounded-xl px-3 py-2 font-mono text-sm font-semibold tabular-nums",
        urgent ? "bg-red-50 text-red-700" : "bg-navy-50 text-navy-900"
      )}
      role="timer"
      aria-live="polite"
      aria-label={`Time remaining ${formatTimer(remaining)}`}
    >
      {formatTimer(remaining)}
    </div>
  );
}
