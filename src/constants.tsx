import { CalendarDays, Database, LineChart, Settings, ShieldCheck } from "lucide-react";
import type { ViewKey } from "./types";

export const eventTypeLabels: Record<string, string> = {
  document_deadline: "서류 마감",
  coding_test: "코딩테스트",
  aptitude_test: "인적성",
  interview: "면접",
  language_test: "어학시험",
  certificate: "자격증",
  education: "교육",
  lecture: "강의",
  other: "기타"
};

export const navItems: Array<{ key: ViewKey; label: string; icon: React.ReactNode }> = [
  { key: "dashboard", label: "대시보드", icon: <LineChart size={17} /> },
  { key: "calendar", label: "취업 캘린더", icon: <CalendarDays size={17} /> },
  { key: "policies", label: "정책 매칭", icon: <ShieldCheck size={17} /> },
  { key: "records", label: "금융 기록", icon: <Database size={17} /> },
  { key: "settings", label: "설정", icon: <Settings size={17} /> }
];
