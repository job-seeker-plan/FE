import type { ViewKey } from "./types";

export function viewTitle(view: ViewKey) {
  if (view === "calendar") return "취업 캘린더";
  if (view === "policies") return "정책 매칭";
  if (view === "records") return "금융 기록";
  if (view === "settings") return "설정";
  return "금융 대시보드";
}
