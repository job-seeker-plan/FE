import { useEffect, useRef, useState } from "react";
import { ChevronDown, RotateCcw, Search, SlidersHorizontal, TrendingUp } from "lucide-react";
import type { CompanySuggestion, HiringSeason, JobFilter } from "../types";
import { careerLevels, educationLevels, employmentTypes, jobCategoryTree, regions, workTypes } from "../constants";
import { Panel } from "../components/Panel";
import { request } from "../api";

const emptyFilter: JobFilter = {
  jobMajorCategory: "", jobMinorCategory: "", regions: [], career: "any", workType: "any",
  education: "any", employmentType: "fulltime", minSalary: "", maxSalary: "", salaryPublic: false,
  quick: { entryLevel: false, remote: false, salaryVisible: false, recent: false, closingSoon: false },
  companySize: "", industry: "", techStack: ""
};

const quickFilters: Array<[keyof JobFilter["quick"], string]> = [
  ["entryLevel", "신입 가능"], ["remote", "재택 가능"], ["salaryVisible", "급여 공개"],
  ["recent", "최근 등록"], ["closingSoon", "마감 임박"]
];

export function JobsView() {
  const [filter, setFilter] = useState<JobFilter>(emptyFilter);
  const [showDetails, setShowDetails] = useState(false);
  const [searched, setSearched] = useState(false);
  const jobMinorOptions = filter.jobMajorCategory ? jobCategoryTree[filter.jobMajorCategory] ?? [] : [];

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
  function toggleQuick(key: keyof JobFilter["quick"]) {
    setFilter((current) => ({ ...current, quick: { ...current.quick, [key]: !current.quick[key] } }));
  }
  function reset() {
    setFilter(emptyFilter);
    setSearched(false);
  }
  const activeQuickCount = Object.values(filter.quick).filter(Boolean).length;

  return (
    <section className="jobs-page">
      <Panel title="채용공고 찾기">
        <div className="jobs-filter-header">
          <div><span className="eyebrow">JOB SEARCH</span><h2>원하는 조건의 공고를 찾아보세요</h2></div>
          <button className="secondary" type="button" onClick={reset}><RotateCcw size={15} />초기화</button>
        </div>
        <div className="job-primary-filters">
          <label className="job-primary-field"><span>지역</span><select value={filter.regions[0] ?? ""} onChange={(event) => updateFilter("regions", event.target.value ? [event.target.value] : [])}><option value="">전체 지역</option>{regions.map((region) => <option key={region}>{region}</option>)}</select></label>
          <label className="job-primary-field"><span>직무</span><select value={filter.jobMajorCategory} onChange={(event) => setFilter({ ...filter, jobMajorCategory: event.target.value, jobMinorCategory: "" })}><option value="">전체 직무</option>{Object.keys(jobCategoryTree).map((category) => <option key={category}>{category}</option>)}</select></label>
          <label className="job-primary-field"><span>경력</span><select value={filter.career} onChange={(event) => updateFilter("career", event.target.value)}>{careerLevels.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}</select></label>
        </div>
        <div className="job-filter-row">
          <label><span>근무 형태</span><select value={filter.workType} onChange={(event) => updateFilter("workType", event.target.value)}>{workTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label>
          <label><span>고용 형태</span><select value={filter.employmentType} onChange={(event) => updateFilter("employmentType", event.target.value)}>{employmentTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label>
          <div className="job-salary-field"><span>연봉</span><div className="salary-range"><input type="number" min="0" placeholder="최소" value={filter.minSalary} onChange={(event) => updateFilter("minSalary", event.target.value)} /><b>~</b><input type="number" min="0" placeholder="최대" value={filter.maxSalary} onChange={(event) => updateFilter("maxSalary", event.target.value)} /><em>만원</em></div></div>
        </div>
        <label className="inline-check"><input type="checkbox" checked={filter.salaryPublic} onChange={(event) => updateFilter("salaryPublic", event.target.checked)} />급여 공개 공고만</label>
        <div className="quick-filter-section">
          <div className="section-label"><span>빠른 조건</span>{activeQuickCount > 0 && <small>{activeQuickCount}개 선택</small>}</div>
          <div className="quick-filter-row">{quickFilters.map(([key, label]) => <button type="button" key={key} className={"quick-filter " + (filter.quick[key] ? "active" : "")} onClick={() => toggleQuick(key)}>{label}</button>)}</div>
        </div>
        <button className={"detail-toggle " + (showDetails ? "open" : "")} type="button" onClick={() => setShowDetails((current) => !current)}><SlidersHorizontal size={16} />상세조건<ChevronDown size={16} /></button>
        {showDetails && <div className="job-detail-filters">
          <label><span>세부 직무</span><select value={filter.jobMinorCategory} disabled={jobMinorOptions.length === 0} onChange={(event) => updateFilter("jobMinorCategory", event.target.value)}><option value="">{jobMinorOptions.length === 0 ? "직무 대분류를 먼저 선택" : "전체 세부 직무"}</option>{jobMinorOptions.map((minor) => <option key={minor}>{minor}</option>)}</select></label>
          <label><span>학력</span><select value={filter.education} onChange={(event) => updateFilter("education", event.target.value)}>{educationLevels.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}</select></label>
          <label><span>회사 규모</span><select value={filter.companySize} onChange={(event) => updateFilter("companySize", event.target.value)}><option value="">전체</option><option>스타트업</option><option>중소기업</option><option>중견기업</option><option>대기업</option></select></label>
          <label><span>산업 분야</span><select value={filter.industry} onChange={(event) => updateFilter("industry", event.target.value)}><option value="">전체</option><option>IT·플랫폼</option><option>금융</option><option>제조</option><option>커머스</option><option>교육</option></select></label>
          <label className="detail-wide"><span>기술 스택</span><input placeholder="예: Java, React, Python" value={filter.techStack} onChange={(event) => updateFilter("techStack", event.target.value)} /></label>
        </div>}
        <button className="job-search-button" type="button" onClick={() => setSearched(true)}><Search size={17} />조건에 맞는 공고 검색</button>
      </Panel>
      <Panel title="검색 결과">
        <div className="jobs-empty-state"><Search size={30} /><strong>{searched ? "공고 검색을 준비했어요" : "조건을 설정해보세요"}</strong><span>{searched ? "사람인 API 연동 후 설정한 조건에 맞는 채용공고가 여기에 표시됩니다." : "지역·직무·경력부터 선택하면 더 빠르게 공고를 찾을 수 있습니다."}</span></div>
      </Panel>
      <Panel title="채용 시즌 정보 (프로토타입)">
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
          <label className="job-primary-field"><span>직무</span><input placeholder="예: 데이터 (목데이터 확인용, 삼성전자+데이터 또는 CJ ENM+콘텐츠)" value={seasonJobFamily} onChange={(event) => setSeasonJobFamily(event.target.value)} /></label>
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
                  {jdDetailOpen ? "관련 공고 내용 접기" : `관련 공고 내용 ${seasonResult.jd_evidence.length}건 보기 (RAG 근거)`}
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
