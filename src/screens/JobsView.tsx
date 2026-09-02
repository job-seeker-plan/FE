import { useState } from "react";
import { ChevronDown, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import type { JobFilter } from "../types";
import { careerLevels, educationLevels, employmentTypes, jobCategoryTree, regions, workTypes } from "../constants";
import { Panel } from "../components/Panel";

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
    </section>
  );
}
