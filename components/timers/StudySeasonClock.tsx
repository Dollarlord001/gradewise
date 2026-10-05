"use client";

import { useEffect, useState } from "react";
import { getStudySeasonStatus, STUDY_SEASON } from "@/lib/timers/study-season";

export function StudySeasonClock() {
  const [status, setStatus] = useState(() => getStudySeasonStatus(STUDY_SEASON));
  useEffect(() => {
    const timer = window.setInterval(() => setStatus(getStudySeasonStatus(STUDY_SEASON)), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return <section className="season-clock" aria-label={status.label}><strong>{status.label}</strong><b>{status.isPast ? "Preparation window ended" : `${status.daysRemaining} days left`}</b><p>{status.message}</p><small>{status.disclaimer}</small></section>;
}
