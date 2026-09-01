import { useState } from "react";
import { Search } from "lucide-react";
import type { JobFilter } from "../types";
import { careerLevels, educationLevels, employmentTypes, jobCategoryTree, regions } from "../constants";
import { Panel } from "../components/Panel";

const emptyFilter: JobFilter = {
  jobMajorCategory: "",
  jobMinorCategory: "",
  regions: [],
  career: "any",
  education: "any",
  employmentType: "fulltime",
  minSalary: ""
};

export function JobsView() {
  const [filter, setFilter] = useState<JobFilter>(emptyFilter);
  const jobMinorOptions = filter.jobMajorCategory ? jobCategoryTree[filter.jobMajorCategory] ?? [] : [];

  function toggleRegion(region: string) {
    setFilter((current) => ({
      ...current,
      regions: current.regions.includes(region) ? current.regions.filter((item) => item !== region) : [...current.regions, region]
    }));
  }

  return (
    <section className="dashboard-grid">
      <Panel title="채용 공고 필터">
        <div className="form-row">
          <label>
            <span>희망 직종</span>
            <select
              value={filter.jobMajorCategory}
              onChange={(event) => setFilter({ ...filter, jobMajorCategory: event.target.value, jobMinorCategory: "" })}
            >
              <option value="">전체</option>
              {Object.keys(jobCategoryTree).map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
          <label>
            <span>세부 직무</span>
            <select
              value={filter.jobMinorCategory}
              disabled={jobMinorOptions.length === 0}
              onChange={(event) => setFilter({ ...filter, jobMinorCategory: event.target.value })}
            >
              <option value="">{jobMinorOptions.length === 0 ? "추후 업데이트 예정" : "전체"}</option>
              {jobMinorOptions.map((minor) => <option key={minor} value={minor}>{minor}</option>)}
            </select>
          </label>
        </div>

        <div className="field-group">
          <span>근무 지역</span>
          <div className="preset-row">
            {regions.map((region) => (
              <button
                type="button"
                key={region}
                className={`preset ${filter.regions.includes(region) ? "active" : ""}`}
                onClick={() => toggleRegion(region)}
              >
                {region}
              </button>
            ))}
          </div>
        </div>

        <div className="form-row triple">
          <label>
            <span>경력</span>
            <select value={filter.career} onChange={(event) => setFilter({ ...filter, career: event.target.value })}>
              {careerLevels.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}
            </select>
          </label>
          <label>
            <span>학력</span>
            <select value={filter.education} onChange={(event) => setFilter({ ...filter, education: event.target.value })}>
              {educationLevels.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}
            </select>
          </label>
          <label>
            <span>고용형태</span>
            <select value={filter.employmentType} onChange={(event) => setFilter({ ...filter, employmentType: event.target.value })}>
              {employmentTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
          </label>
        </div>

        <div className="form-row single">
          <label className="money-field">
            <span>희망 연봉</span>
            <div className="money-input">
              <input
                type="number"
                min="0"
                placeholder="0"
                value={filter.minSalary}
                onChange={(event) => setFilter({ ...filter, minSalary: event.target.value })}
              />
              <span>만원 이상</span>
            </div>
          </label>
        </div>

        <button type="button" disabled><Search size={16} />조건에 맞는 공고 검색</button>
      </Panel>

      <Panel title="검색 결과">
        <div className="requirement">
          <span>사람인 API 키가 아직 연동되지 않아 채용 공고를 불러올 수 없습니다. API 키 연동 후 위에서 설정한 조건에 맞는 채용 공고가 여기에 표시됩니다.</span>
        </div>
      </Panel>
    </section>
  );
}
