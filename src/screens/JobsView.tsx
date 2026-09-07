import { useEffect, useRef, useState } from "react";
import { ChevronDown, RotateCcw, Search, TrendingUp } from "lucide-react";
import type { CompanySuggestion, HiringSeason, JobFilter, LinkareerRecruitmentResult } from "../types";
import { employmentTypes, jobCategoryTree } from "../constants";
import { Panel } from "../components/Panel";
import { Select } from "../components/Select";
import { request } from "../api";
import { pageNumbers } from "../utils";

const emptyFilter: JobFilter = {
  keyword: "", jobMajorCategory: "", regions: [], employmentType: "any", experience: "any", deadlineWithinDays: "any"
};

const linkareerJobCategory: Record<string, string> = {
  "기획·전략": "100001",
  "마케팅·홍보": "100002",
  "영업": "100005",
  "IT·개발·데이터": "100003",
  "디자인": "100004",
  "경영·사무": "100001",
  "생산·제조": "100006"
};

const linkareerRegion: Record<string, string> = {
  "서울": "2", "부산": "3", "대구": "4", "인천": "5", "광주": "6", "대전": "7", "울산": "8", "경기": "9", "강원": "10",
  "충청": "11", "전라": "25", "경상": "26", "제주": "27", "세종": "28", "해외": "29"
};

const jobRegionOptions = [
  "서울", "부산", "대구", "인천", "광주", "대전", "울산", "경기", "강원", "충청", "전라", "경상", "제주", "세종", "해외"
];

export function JobsView() {
  const [filter, setFilter] = useState<JobFilter>(emptyFilter);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [result, setResult] = useState<LinkareerRecruitmentResult | null>(null);

  // 채용 시즌 정보 - 실시간 공고 검색(위 필터)이랑은 별개로, 회사 하나를 골라서
  // "이 회사는 보통 언제 채용이 몰리는지" 과거 이력을 보여주는 부분.
  const [seasonCompany, setSeasonCompany] = useState("");
  const [seasonJobFamily, setSeasonJobFamily] = useState("");
  const [seasonResult, setSeasonResult] = useState<HiringSeason | null>(null);
  const [seasonLoading, setSeasonLoading] = useState(false);
  const [seasonError, setSeasonError] = useState<string | null>(null);
  const [seasonDetailOpen, setSeasonDetailOpen] = useState(false);
  const [jdDetailOpen, setJdDetailOpen] = useState(false);

  // 회사명 자동완성 - 등록된 관심기업(COMPANY_INDUSTRY) 목록 중 부분일치하는 것만
  // 후보로 보여줌. 등록 안 된 회사명은 애초에 선택할 수 없으니, 오타/미매핑 회사로
  // 조회를 시도해서 나던 에러도 이 UI로 자연스럽게 막힌다.
  const [companySuggestions, setCompanySuggestions] = useState<CompanySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (suggestionDebounce.current) clearTimeout(suggestionDebounce.current);
    if (!seasonCompany.trim()) {
      setCompanySuggestions([]);
      return;
    }
    suggestionDebounce.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: seasonCompany });
        const result = await request<CompanySuggestion[]>(`/hiring/companies?${params.toString()}`);
        setCompanySuggestions(result);
      } catch {
        setCompanySuggestions([]);
      }
    }, 200);
    return () => {
      if (suggestionDebounce.current) clearTimeout(suggestionDebounce.current);
    };
  }, [seasonCompany]);

  function selectCompany(company: string) {
    setSeasonCompany(company);
    setShowSuggestions(false);
  }

  async function lookupSeason() {
    if (!seasonCompany || !seasonJobFamily) return;
    setSeasonLoading(true);
    setSeasonError(null);
    try {
      const params = new URLSearchParams({ company: seasonCompany, jobFamily: seasonJobFamily });
      const result = await request<HiringSeason>(`/hiring/season?${params.toString()}`);
      setSeasonResult(result);
    } catch (error) {
      setSeasonError(error instanceof Error ? error.message : String(error));
      setSeasonResult(null);
    } finally {
      setSeasonLoading(false);
    }
  }

  function updateFilter<K extends keyof JobFilter>(key: K, value: JobFilter[K]) {
    setFilter((current) => ({ ...current, [key]: value }));
  }
  function reset() {
    setFilter(emptyFilter);
    setSearched(false);
    setSearchError(null);
    setResult(null);
  }

  const visibleJobs = result?.jobs.filter((job) => {
    const searchable = [job.title, job.company, ...job.categories, ...job.locations, job.employment_type].join(" ").toLowerCase();
    const experienceMatches = filter.experience === "any"
      || (filter.experience === "entry" && searchable.includes("신입"))
      || (filter.experience === "experienced" && searchable.includes("경력"))
      || (filter.experience === "intern" && searchable.includes("인턴"))
      || (filter.experience === "contract" && searchable.includes("계약"));
    const deadline = /^\d{4}-\d{2}-\d{2}$/.test(job.deadline) ? new Date(`${job.deadline}T23:59:59`) : null;
    const daysUntilDeadline = deadline ? Math.ceil((deadline.getTime() - Date.now()) / 86_400_000) : null;
    const deadlineMatches = filter.deadlineWithinDays === "any"
      || (daysUntilDeadline !== null && daysUntilDeadline >= 0 && daysUntilDeadline <= Number(filter.deadlineWithinDays));
    return experienceMatches && deadlineMatches;
  }) ?? [];
  async function searchJobs(page = 1) {
    try {
      setSearching(true);
      setSearchError(null);
      setSearched(true);
      setResult(await request<LinkareerRecruitmentResult>("/jobs/search", {
        method: "POST",
        body: JSON.stringify({
          keyword: filter.keyword,
          category_id: linkareerJobCategory[filter.jobMajorCategory] || null,
          region_id: linkareerRegion[filter.regions[0] ?? ""] || null,
          job_type: filter.employmentType === "any" ? null : filter.employmentType,
          page,
          region_name: filter.regions[0] ?? null,
          experience: filter.experience === "any" ? null : filter.experience,
          deadline_within_days: filter.deadlineWithinDays === "any" ? null : Number(filter.deadlineWithinDays)
        })
      }));
    } catch {
      setResult(null);
      setSearchError("채용공고를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSearching(false);
    }
  }

  const totalPages = result ? Math.ceil(result.total_count / result.page_size) : 0;
  const resultPageNumbers = result ? pageNumbers(result.page, totalPages) : [];
  const rangeStart = result ? (result.page - 1) * result.page_size + 1 : 0;
  const rangeEnd = result ? rangeStart + result.jobs.length - 1 : 0;

  return (
    <section className="jobs-page">
      <Panel title="채용공고 찾기">
        <div className="jobs-filter-header">
          <div><span className="eyebrow">JOB SEARCH</span><h2>원하는 조건의 공고를 찾아보세요</h2></div>
          <button className="secondary" type="button" onClick={reset}><RotateCcw size={15} />초기화</button>
        </div>
        <div className="job-primary-filters">
          <label className="job-primary-field"><span>검색어</span><input placeholder="예: 백엔드, 마케팅, 인턴" value={filter.keyword} onChange={(event) => updateFilter("keyword", event.target.value)} /></label>
          <label className="job-primary-field"><span>지역</span><Select value={filter.regions[0] ?? ""} onChange={(value) => updateFilter("regions", value ? [value] : [])} options={[{ value: "", label: "전체 지역" }, ...jobRegionOptions.map((region) => ({ value: region, label: region }))]} /></label>
          <label className="job-primary-field"><span>직무</span><Select value={filter.jobMajorCategory} onChange={(value) => updateFilter("jobMajorCategory", value)} options={[{ value: "", label: "전체 직무" }, ...Object.keys(jobCategoryTree).map((category) => ({ value: category, label: category }))]} /></label>
        </div>
        <div className="job-filter-row">
          <label><span>고용 형태</span><Select value={filter.employmentType} onChange={(value) => updateFilter("employmentType", value)} options={employmentTypes} /></label>
          <label><span>경력 조건</span><Select value={filter.experience} onChange={(value) => updateFilter("experience", value as JobFilter["experience"])} options={[{ value: "any", label: "전체 경력" }, { value: "entry", label: "신입 가능" }, { value: "experienced", label: "경력직" }, { value: "intern", label: "인턴" }, { value: "contract", label: "계약직" }]} /></label>
          <label><span>마감 조건</span><Select value={filter.deadlineWithinDays} onChange={(value) => updateFilter("deadlineWithinDays", value as JobFilter["deadlineWithinDays"])} options={[{ value: "any", label: "전체 마감" }, { value: "7", label: "7일 이내 마감" }, { value: "30", label: "30일 이내 마감" }]} /></label>
        </div>
        <button className="job-search-button" type="button" disabled={searching} onClick={() => void searchJobs()}><Search size={17} />{searching ? "채용공고를 불러오는 중" : "조건에 맞는 공고 검색"}</button>
      </Panel>
      <Panel title="검색 결과">
        {searchError && <p className="jobs-search-error">{searchError}</p>}
        {!searchError && result && visibleJobs.length > 0 && <div className="job-result-list">
          <p className="jobs-result-note">공개 채용공고 {result.total_count.toLocaleString()}건 중 {rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()}번째 · 현재 페이지 필터 결과 {visibleJobs.length}건{result.cached ? " · 최근 검색 결과" : ""}</p>
          {visibleJobs.map((job) => <article className="job-result-card" key={job.id}>
            <div><strong>{job.title}</strong><span>{job.company}</span></div>
            <div className="job-result-meta"><span>{job.locations.join(" · ") || "근무지 원문 확인"}</span><span>{job.categories.join(" · ") || job.employment_type}</span><span>{job.employment_type} · {job.deadline}</span></div>
          </article>)}
          {totalPages > 1 && <nav className="job-pagination" aria-label="공고 검색 결과 페이지">
            <button type="button" className="secondary" disabled={searching || result.page === 1} onClick={() => void searchJobs(result.page - 1)}>이전</button>
            {resultPageNumbers.map((page) => <button type="button" key={page} className={page === result.page ? "active" : "secondary"} disabled={searching || page === result.page} onClick={() => void searchJobs(page)}>{page}</button>)}
            <button type="button" className="secondary" disabled={searching || result.page === totalPages} onClick={() => void searchJobs(result.page + 1)}>다음</button>
          </nav>}
        </div>}
        {!searchError && result && visibleJobs.length === 0 && <div className="jobs-empty-state"><Search size={30} /><strong>현재 페이지에 맞는 공고가 없어요</strong><span>경력·마감 조건을 바꾸거나 다음 페이지를 확인해 주세요.</span></div>}
        {!searchError && !result && <div className="jobs-empty-state"><Search size={30} /><strong>{searched ? "표시할 공고가 없어요" : "조건을 설정해보세요"}</strong><span>{searched ? "검색어·직무·지역을 바꿔 다시 시도해 주세요." : "검색어·직무·지역을 설정하면 공개 채용공고를 불러옵니다."}</span></div>}
      </Panel>
      <Panel title="채용 시즌 정보">
        <div className="job-primary-filters">
          <label className="job-primary-field" style={{ position: "relative" }}>
            <span>회사명</span>
            <input
              placeholder="예: CJ (등록된 관심기업 중에서 골라주세요)"
              value={seasonCompany}
              onChange={(event) => setSeasonCompany(event.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            />
            {showSuggestions && companySuggestions.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, marginTop: "4px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", overflow: "hidden" }}>
                {companySuggestions.map((item) => (
                  <button
                    type="button"
                    key={item.company}
                    onMouseDown={() => selectCompany(item.company)}
                    style={{ display: "flex", justifyContent: "space-between", width: "100%", padding: "8px 12px", background: "none", border: "none", textAlign: "left", cursor: "pointer", fontSize: "0.9em", color: "#1f2937" }}
                  >
                    <span>{item.company}</span>
                    <span style={{ color: "#9ca3af" }}>{item.industry}</span>
                  </button>
                ))}
              </div>
            )}
          </label>
          <label className="job-primary-field"><span>직무</span><input placeholder="예: 데이터, IT컨설팅, 서비스기획, 금융IT, 콘텐츠, 물류, 생산관리, MD" value={seasonJobFamily} onChange={(event) => setSeasonJobFamily(event.target.value)} /></label>
        </div>
        <button className="job-search-button" type="button" onClick={lookupSeason} disabled={seasonLoading || !seasonCompany || !seasonJobFamily}>
          <TrendingUp size={17} />{seasonLoading ? "조회 중..." : "채용 시즌 조회"}
        </button>
        {seasonError && <p style={{ color: "#dc2626" }}>{seasonError}</p>}
        {seasonResult && (
          <div style={{ marginTop: "16px", padding: "20px 22px", background: "linear-gradient(135deg, #eff6ff, #f5f3ff)", border: "1px solid #dbeafe", borderRadius: "14px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "12px" }}>
              <strong style={{ fontSize: "1.15em", color: "#1e3a8a" }}>{seasonResult.company}</strong>
              <span style={{ color: "#6b7280", fontSize: "0.95em" }}>· {seasonResult.job_family}</span>
            </div>
            {seasonResult.observed_windows.length > 0 && (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
                {seasonResult.observed_windows.map((window) => (
                  <span key={window} style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#2563eb", color: "#fff", padding: "5px 14px", borderRadius: "999px", fontSize: "0.85em", fontWeight: 600 }}>
                    <TrendingUp size={13} />{window}
                  </span>
                ))}
              </div>
            )}
            <p style={{ fontSize: "1.02em", lineHeight: 1.65, color: "#1f2937", margin: "0 0 12px" }}>{seasonResult.basis}</p>
            {seasonResult.skill_trend.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
                {seasonResult.skill_trend.map((item) => (
                  <span key={item.skill} style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#fff", border: "1px solid #c7d2fe", color: "#4338ca", padding: "4px 10px", borderRadius: "8px", fontSize: "0.85em", fontWeight: 600 }}>
                    {item.skill} <span style={{ color: "#9ca3af", fontWeight: 400 }}>{item.count}/{item.n_postings}건</span>
                  </span>
                ))}
              </div>
            )}
            <p style={{ fontSize: "0.78em", color: "#9ca3af", margin: "0 0 10px" }}>{seasonResult.caveat}</p>
            {seasonResult.observed_dates.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setSeasonDetailOpen((current) => !current)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "none", border: "none", padding: 0, color: "#2563eb", fontSize: "0.85em", fontWeight: 600, cursor: "pointer" }}
                >
                  <ChevronDown size={14} style={{ transform: seasonDetailOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                  {seasonDetailOpen ? "실제 게시일 접기" : `실제 게시일 ${seasonResult.observed_dates.length}건 보기`}
                </button>
                {seasonDetailOpen && (
                  <div style={{ marginTop: "8px", padding: "10px 12px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {seasonResult.observed_dates.map((date) => (
                      <span key={date} style={{ fontSize: "0.82em", color: "#374151", background: "#f3f4f6", padding: "3px 8px", borderRadius: "6px" }}>{date}</span>
                    ))}
                  </div>
                )}
              </>
            )}
            {seasonResult.jd_evidence.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setJdDetailOpen((current) => !current)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "none", border: "none", padding: 0, marginTop: "10px", color: "#2563eb", fontSize: "0.85em", fontWeight: 600, cursor: "pointer" }}
                >
                  <ChevronDown size={14} style={{ transform: jdDetailOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                  {jdDetailOpen ? "관련 공고 내용 접기" : `관련 공고 내용 ${seasonResult.jd_evidence.length}건 보기`}
                </button>
                {jdDetailOpen && (
                  <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    {seasonResult.jd_evidence.map((item, index) => (
                      <div key={index} style={{ padding: "10px 12px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
                        <p style={{ margin: "0 0 4px", fontSize: "0.88em", color: "#1f2937" }}>{item.chunk_text}</p>
                        <span style={{ fontSize: "0.75em", color: "#9ca3af" }}>{item.posted_date}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Panel>
    </section>
  );
}
