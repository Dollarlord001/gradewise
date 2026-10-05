export interface StudySeasonConfig { label: string; targetDate: string; urgencyMessage: string; closedMessage: string }
export const STUDY_SEASON: StudySeasonConfig = {
  label: "JAMB 2027 PREPARATION",
  targetDate: process.env.NEXT_PUBLIC_JAMB_PREPARATION_TARGET ?? "2027-04-15",
  urgencyMessage: "Your preparation window is closing. Keep studying. Every day counts.",
  closedMessage: "This preparation window has ended. Stay consistent with daily practice.",
};
export function getStudySeasonStatus(config: StudySeasonConfig = STUDY_SEASON, now = new Date()) {
  const target = new Date(`${config.targetDate}T00:00:00`);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const days = Math.ceil((targetDay.getTime() - today.getTime()) / 86_400_000);
  const isPast = days < 0;
  return { label: config.label, daysRemaining: isPast ? null : days, isPast, message: isPast ? config.closedMessage : config.urgencyMessage,
    disclaimer: "Preparation target only; this is not an official examination date." };
}
