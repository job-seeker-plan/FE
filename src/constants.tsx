import { Briefcase, CalendarDays, Settings, ShieldCheck } from "lucide-react";
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

export const expenseCategoryLabels: Record<string, string> = {
  food: "식비",
  transport: "교통",
  housing: "주거",
  communication: "통신",
  shopping: "쇼핑",
  other: "기타"
};

export const incomeCategoryLabels: Record<string, string> = {
  salary: "급여",
  allowance: "용돈",
  support: "지원금",
  other: "기타"
};

export const regions = ["서울", "경기", "인천", "부산", "대구", "광주", "대전", "울산", "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];

export const navItems: Array<{ key: ViewKey; label: string; icon: React.ReactNode }> = [
  { key: "jobs", label: "채용 공고", icon: <Briefcase size={17} /> },
  { key: "calendar", label: "취업 캘린더", icon: <CalendarDays size={17} /> },
  { key: "policies", label: "정책 매칭", icon: <ShieldCheck size={17} /> },
  { key: "settings", label: "설정", icon: <Settings size={17} /> }
];

// 사람인 채용정보 API는 직무(job_cd)/업종(ind_cd)를 대분류-소분류 체계로 제공한다.
// API 키 연동 전이라 소분류 항목은 비워두고, 이중 선택 UI 틀만 구성해둔다.
export const jobCategoryTree: Record<string, string[]> = {
  "기획·전략": ["서비스기획", "사업기획", "상품기획", "전략기획", "경영기획"],
  "마케팅·홍보": ["마케팅", "콘텐츠마케팅", "디지털마케팅", "홍보", "광고기획"],
  "영업": ["영업관리", "일반영업", "기술영업", "해외영업", "영업기획"],
  "IT·개발·데이터": ["웹개발", "앱개발", "프론트엔드", "백엔드", "데이터엔지니어", "QA·테스터", "DevOps"],
  "디자인": ["웹디자인", "UI·UX디자인", "그래픽디자인", "제품디자인", "편집디자인"],
  "경영·사무": ["인사·노무", "회계·세무", "총무·법무", "구매·자재", "사무보조"],
  "생산·제조": ["생산관리", "품질관리", "기계·설비", "공정관리", "연구개발"]
};

export const careerLevels = [
  { value: "any", label: "경력무관" },
  { value: "junior", label: "신입" },
  { value: "1-3", label: "1~3년" },
  { value: "4-7", label: "4~7년" },
  { value: "8-plus", label: "8년 이상" }
];

export const educationLevels = [
  { value: "any", label: "학력무관" },
  { value: "college", label: "전문대졸" },
  { value: "bachelor", label: "대졸이상" },
  { value: "master", label: "석사이상" }
];

export const employmentTypes = [
  { value: "any", label: "전체" },
  { value: "NEW", label: "신입" },
  { value: "EXPERIENCED", label: "경력직" },
  { value: "CONTRACT", label: "계약직" },
  { value: "INTERN", label: "인턴" }
];

export const workTypes = [
  { value: "any", label: "전체" },
  { value: "office", label: "출근" },
  { value: "remote", label: "재택" },
  { value: "hybrid", label: "하이브리드" }
];
