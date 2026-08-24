import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  CalendarPlus,
  Database,
  KeyRound,
  LineChart,
  Settings,
  ShieldCheck,
  WalletCards
} from "lucide-react";
import { CartesianGrid, Line, LineChart as ReLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import "./styles.css";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";
let csrfToken: string | null = null;

type ViewKey = "dashboard" | "calendar" | "policies" | "records" | "settings";
type Status = "stable" | "caution" | "risk";

type AuthUser = {
  user_id: string;
  provider: string;
  email: string;
  name: string;
};

type AuthProvider = {
  key: string;
  label: string;
  configured: boolean;
};

type UserProfile = {
  user_id: string;
  available_cash: number;
  monthly_income: number;
  age: number;
  region: string;
  employment_status: "unemployed" | "employed" | "any";
  monthly_income_for_policy: number;
  target_job_month: string;
};

type JobEvent = {
  id: string;
  title: string;
  event_type: string;
  event_date: string;
  expected_cost: number;
  memo: string;
};

type FinancialRecord = {
  user_id: string;
  month: string;
  spend: number;
  bill: number;
  balance: number;
  credit_score: number | null;
  income: number;
};

type MatchedPolicy = {
  id: string;
  name: string;
  match_score: number;
  benefit_amount: number | null;
  description: string;
  application_period: string;
  matched_reasons: string[];
  missing_reasons: string[];
};

type MonthlyCashFlow = {
  month: string;
  opening_cash: number;
  income: number;
  policy_support: number;
  predicted_spend: number;
  job_event_cost: number;
  closing_cash: number;
};

type PlanAnalysis = {
  predicted_next_spend: number;
  recent_average_spend: number;
  spend_delta: number;
  spend_delta_rate: number;
  months_until_shortage: number | null;
  shortage_month: string | null;
  target_month_balance: number;
  target_shortage_amount: number;
  recommended_monthly_spend_limit: number;
  status: Status;
  monthly_cash_flows: MonthlyCashFlow[];
  guide: string;
};

type EventForm = {
  title: string;
  event_type: string;
  event_date: string;
  expected_cost: string;
};

const eventTypeLabels: Record<string, string> = {
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

const navItems: Array<{ key: ViewKey; label: string; icon: React.ReactNode }> = [
  { key: "dashboard", label: "대시보드", icon: <LineChart size={17} /> },
  { key: "calendar", label: "취업 캘린더", icon: <CalendarDays size={17} /> },
  { key: "policies", label: "정책 매칭", icon: <ShieldCheck size={17} /> },
  { key: "records", label: "금융 기록", icon: <Database size={17} /> },
  { key: "settings", label: "설정", icon: <Settings size={17} /> }
];

function formatWon(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function currentMonthValue() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const method = options?.method?.toUpperCase() ?? "GET";
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    await loadCsrfToken();
  }
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(csrfToken ? { "X-XSRF-TOKEN": csrfToken } : {}), ...options?.headers },
    credentials: "include",
    ...options
  });
  if (!response.ok) throw new Error(`${path} failed: ${response.status}`);
  if (response.status === 204) return undefined as T;
  return response.json();
}

async function loadCsrfToken() {
  if (csrfToken) return;
  const response = await fetch(`${API_BASE}/auth/csrf`, { credentials: "include" });
  if (!response.ok) throw new Error("CSRF token could not be loaded");
  const payload = await response.json() as { token: string };
  csrfToken = payload.token;
}

async function optionalRequest<T>(path: string): Promise<T | null> {
  const response = await fetch(`${API_BASE}${path}`, { credentials: "include" });
  if (!response.ok) return null;
  return response.json();
}

function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authProviders, setAuthProviders] = useState<AuthProvider[]>([]);
  const [authReady, setAuthReady] = useState(false);
  const [activeView, setActiveView] = useState<ViewKey>("dashboard");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [plan, setPlan] = useState<PlanAnalysis | null>(null);
  const [events, setEvents] = useState<JobEvent[]>([]);
  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>([]);
  const [policies, setPolicies] = useState<MatchedPolicy[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(currentMonthValue());
  const [eventForm, setEventForm] = useState<EventForm>({ title: "", event_type: "interview", event_date: "", expected_cost: "" });
  const [profileForm, setProfileForm] = useState({
    user_id: "",
    available_cash: "",
    monthly_income: "",
    age: "",
    region: "",
    monthly_income_for_policy: "",
    target_job_month: ""
  });
  const [recordForm, setRecordForm] = useState({
    month: "",
    spend: "",
    bill: "",
    balance: "",
    credit_score: "",
    income: ""
  });
  const [selectedPolicyIds, setSelectedPolicyIds] = useState<string[]>([]);
  const [confirmedSupport, setConfirmedSupport] = useState({ month: "", amount: "" });
  const [scenario, setScenario] = useState<PlanAnalysis | null>(null);

  async function loadDashboard() {
    try {
      setError(null);
      const nextProfile = await optionalRequest<UserProfile>("/profile");
      setProfile(nextProfile);
      if (!nextProfile) {
        setPlan(null);
        setEvents([]);
        setFinancialRecords([]);
        setPolicies([]);
        return;
      }
      const [nextPlan, nextEvents, nextRecords, nextPolicies] = await Promise.all([
        optionalRequest<PlanAnalysis>("/plan"),
        optionalRequest<JobEvent[]>("/events"),
        optionalRequest<FinancialRecord[]>("/financial-records"),
        optionalRequest<MatchedPolicy[]>("/policies/matches")
      ]);
      setPlan(nextPlan);
      setEvents(nextEvents ?? []);
      setFinancialRecords(nextRecords ?? []);
      setPolicies(nextPolicies ?? []);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "알 수 없는 오류가 발생했습니다.");
    }
  }

  useEffect(() => {
    void loadAuth();
  }, []);

  useEffect(() => {
    if (authUser) void loadDashboard();
  }, [authUser]);

  async function loadAuth() {
    const [providers, user] = await Promise.all([
      optionalRequest<AuthProvider[]>("/auth/providers"),
      optionalRequest<AuthUser>("/auth/me")
    ]);
    setAuthProviders(providers ?? []);
    setAuthUser(user);
    setAuthReady(true);
  }

  const monthlyEventCost = useMemo(() => {
    const costs = new Map<string, number>();
    events.forEach((event) => {
      const month = event.event_date.slice(0, 7);
      costs.set(month, (costs.get(month) ?? 0) + event.expected_cost);
    });
    return [...costs.entries()].sort();
  }, [events]);

  async function addEvent() {
    if (!eventForm.title || !eventForm.event_date || !eventForm.expected_cost) return;
    await request<JobEvent>("/events", {
      method: "POST",
      body: JSON.stringify({ ...eventForm, expected_cost: Number(eventForm.expected_cost), memo: "" })
    });
    setEventForm({ title: "", event_type: "interview", event_date: "", expected_cost: "" });
    await loadDashboard();
  }

  async function saveFinancialRecord() {
    if (!recordForm.month || !recordForm.spend || !recordForm.bill || !recordForm.balance) return;
    await request<FinancialRecord>("/financial-records", {
      method: "POST",
      body: JSON.stringify({
        month: recordForm.month,
        spend: Number(recordForm.spend),
        bill: Number(recordForm.bill),
        balance: Number(recordForm.balance),
        credit_score: recordForm.credit_score ? Number(recordForm.credit_score) : null,
        income: recordForm.income ? Number(recordForm.income) : 0
      })
    });
    setRecordForm({ month: "", spend: "", bill: "", balance: "", credit_score: "", income: "" });
    await loadDashboard();
  }

  async function runScenario() {
    if (confirmedSupport.amount && (!confirmedSupport.month || selectedPolicyIds.length === 0)) {
      setError("확정 정책 지원금을 계산하려면 정책을 하나 이상 선택하고 지급월을 입력하세요.");
      return;
    }
    const nextScenario = await request<PlanAnalysis>("/scenario", {
      method: "POST",
      body: JSON.stringify({
        extra_month: eventForm.event_date ? eventForm.event_date.slice(0, 7) : null,
        extra_cost: Number(eventForm.expected_cost) || 0,
        policy_ids: selectedPolicyIds,
        confirmed_support_month: confirmedSupport.month || null,
        confirmed_support_amount: Number(confirmedSupport.amount) || 0
      })
    });
    setScenario(nextScenario);
  }

  async function saveProfile() {
    await request<UserProfile>("/profile", {
      method: "PUT",
      body: JSON.stringify({
        user_id: authUser?.user_id ?? profileForm.user_id,
        available_cash: Number(profileForm.available_cash),
        monthly_income: Number(profileForm.monthly_income),
        age: Number(profileForm.age),
        region: profileForm.region,
        employment_status: "unemployed",
        monthly_income_for_policy: Number(profileForm.monthly_income_for_policy),
        target_job_month: profileForm.target_job_month
      })
    });
    setActiveView("calendar");
    await loadDashboard();
  }

  if (error) {
    return (
      <main className="shell">
        <section className="notice">
          <AlertTriangle size={20} />
          <span>{error}</span>
        </section>
      </main>
    );
  }

  if (!authReady) {
    return <main className="shell">로그인 상태를 확인하는 중입니다.</main>;
  }

  if (!authUser) {
    return <LoginScreen providers={authProviders} />;
  }

  if (!profile) {
    return <Onboarding authUser={authUser} profileForm={profileForm} setProfileForm={setProfileForm} saveProfile={saveProfile} />;
  }

  if (!plan) {
    return (
      <AppFrame activeView="records" setActiveView={setActiveView} title="데이터 연결 필요" status={null}>
        <section className="dashboard-grid">
          <Panel title="금융 Feature 파일">
            <div className="requirement"><Database size={20} /><span><code>Data/processed/user_month_features.csv</code> 또는 아래 월별 실제 금융 기록이 필요합니다. AI 서비스도 실행되어야 합니다.</span></div>
          </Panel>
          <Panel title="정책 API 키">
            <div className="requirement"><KeyRound size={20} /><span>백엔드 실행 환경에 <code>GOV_API</code>를 설정해야 실제 정책 매칭이 동작합니다.</span></div>
          </Panel>
        </section>
        <section className="dashboard-grid">
          <FinancialRecordPanel recordForm={recordForm} setRecordForm={setRecordForm} saveFinancialRecord={saveFinancialRecord} financialRecords={financialRecords} />
          <ProfilePanel profile={profile} />
        </section>
      </AppFrame>
    );
  }

  const shared = {
    profile,
    plan,
    events,
    financialRecords,
    policies,
    selectedPolicyIds,
    setSelectedPolicyIds,
    confirmedSupport,
    setConfirmedSupport,
    eventForm,
    setEventForm,
    addEvent,
    runScenario,
    scenario,
    recordForm,
    setRecordForm,
    saveFinancialRecord,
    monthlyEventCost,
    calendarMonth,
    setCalendarMonth
  };

  return (
    <AppFrame activeView={activeView} setActiveView={setActiveView} title={viewTitle(activeView)} status={plan.status}>
      {activeView === "dashboard" && <DashboardView {...shared} />}
      {activeView === "calendar" && <CalendarView {...shared} />}
      {activeView === "policies" && <PoliciesView {...shared} />}
      {activeView === "records" && <RecordsView {...shared} />}
      {activeView === "settings" && <SettingsView profile={profile} onLogout={logout} />}
    </AppFrame>
  );
}

async function logout() {
  await request<void>("/auth/logout", { method: "POST" });
  csrfToken = null;
  window.location.assign(window.location.origin);
}

function viewTitle(view: ViewKey) {
  if (view === "calendar") return "취업 캘린더";
  if (view === "policies") return "정책 매칭";
  if (view === "records") return "금융 기록";
  if (view === "settings") return "설정";
  return "금융 대시보드";
}

function AppFrame({ activeView, setActiveView, title, status, children }: { activeView: ViewKey; setActiveView: (view: ViewKey) => void; title: string; status: Status | null; children: React.ReactNode }) {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">FP</div>
          <div>
            <strong>Job Planner</strong>
            <span>Financial OS</span>
          </div>
        </div>
        <nav>
          {navItems.map((item) => (
            <button className={activeView === item.key ? "active" : ""} key={item.key} onClick={() => setActiveView(item.key)}>
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">AI Financial Planner</p>
            <h1>{title}</h1>
          </div>
          {status && <div className={`status ${status}`}>{status.toUpperCase()}</div>}
        </header>
        {children}
      </section>
    </main>
  );
}

function LoginScreen({ providers }: { providers: AuthProvider[] }) {
  return (
    <main className="shell login-shell">
      <section className="login-card">
        <div>
          <p className="eyebrow">AI Financial Planner</p>
          <h1>내 취업 준비 현금흐름을 개인 계정으로 관리하세요</h1>
          <p>로그인 후 금융 기록, 취업 캘린더, 정책 매칭 결과가 사용자별로 분리됩니다.</p>
        </div>
        <div className="oauth-list">
          {providers.map((provider) => (
            <button
              className={`oauth-button ${provider.key}`}
              disabled={!provider.configured}
              key={provider.key}
              onClick={() => {
                window.location.href = `${API_BASE}/oauth2/authorization/${provider.key}`;
              }}
            >
              {provider.label}로 계속하기
              {!provider.configured && <span>환경변수 필요</span>}
            </button>
          ))}
        </div>
        <p className="login-note">OAuth client id와 secret은 백엔드 실행 환경변수에만 설정합니다.</p>
      </section>
    </main>
  );
}

function Onboarding({ authUser, profileForm, setProfileForm, saveProfile }: { authUser: AuthUser; profileForm: { user_id: string; available_cash: string; monthly_income: string; age: string; region: string; monthly_income_for_policy: string; target_job_month: string }; setProfileForm: React.Dispatch<React.SetStateAction<{ user_id: string; available_cash: string; monthly_income: string; age: string; region: string; monthly_income_for_policy: string; target_job_month: string }>>; saveProfile: () => Promise<void> }) {
  const canSubmit = authUser.user_id && profileForm.available_cash && profileForm.monthly_income && profileForm.age && profileForm.region && profileForm.target_job_month;
  const cashPresets = [1_000_000, 2_000_000, 3_000_000, 5_000_000];
  const incomePresets = [0, 300_000, 500_000, 1_000_000];
  const regions = ["서울", "경기", "인천", "부산", "대구", "광주", "대전", "울산", "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];

  return (
    <main className="shell setup-shell">
      <header className="setup-header">
        <p className="eyebrow">AI Financial Planner</p>
        <h1>취업 준비가 몇 달 버틸 수 있는지 먼저 계산합니다</h1>
        <p>최소 정보만 입력하고, 다음 화면에서 면접·시험·강의 일정을 캘린더에 추가합니다.</p>
      </header>
      <section className="onboarding-layout">
        <aside className="onboarding-steps">
          <div className="step-item active"><span>1</span><strong>자금</strong><small>가용자금과 월 수입</small></div>
          <div className="step-item active"><span>2</span><strong>목표</strong><small>취업 목표월과 기본 정보</small></div>
          <div className="step-item"><span>3</span><strong>정책</strong><small>지역·소득 조건</small></div>
        </aside>

        <section className="panel setup-panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">Required Setup</span>
              <h2>기본 플랜 만들기</h2>
            </div>
            <ShieldCheck size={22} />
          </div>

          <div className="field-group">
            <label>
              <span>사용자 ID</span>
          <input readOnly value={authUser.email || authUser.name || authUser.user_id} />
            </label>
          </div>

          <div className="field-group">
            <label>
              <span>현재 바로 쓸 수 있는 돈</span>
              <input inputMode="numeric" placeholder="예: 3000000" value={profileForm.available_cash} onChange={(event) => setProfileForm({ ...profileForm, available_cash: event.target.value })} />
            </label>
            <div className="preset-row">
              {cashPresets.map((value) => <button className="preset" key={value} onClick={() => setProfileForm({ ...profileForm, available_cash: String(value) })}>{formatWon(value)}</button>)}
            </div>
          </div>

          <div className="field-group">
            <label>
              <span>매달 들어오는 예상 수입</span>
              <input inputMode="numeric" placeholder="없으면 0" value={profileForm.monthly_income} onChange={(event) => setProfileForm({ ...profileForm, monthly_income: event.target.value })} />
            </label>
            <div className="preset-row">
              {incomePresets.map((value) => <button className="preset" key={value} onClick={() => setProfileForm({ ...profileForm, monthly_income: String(value) })}>{formatWon(value)}</button>)}
            </div>
          </div>

          <div className="form-row">
            <label>
              <span>목표 취업월</span>
              <input type="month" value={profileForm.target_job_month} onChange={(event) => setProfileForm({ ...profileForm, target_job_month: event.target.value })} />
            </label>
            <label>
              <span>나이</span>
              <input inputMode="numeric" placeholder="예: 27" value={profileForm.age} onChange={(event) => setProfileForm({ ...profileForm, age: event.target.value })} />
            </label>
          </div>

          <div className="form-row">
            <label>
              <span>거주지역</span>
              <select value={profileForm.region} onChange={(event) => setProfileForm({ ...profileForm, region: event.target.value })}>
                <option value="">선택</option>
                {regions.map((region) => <option key={region} value={region}>{region}</option>)}
              </select>
            </label>
            <label>
              <span>정책 매칭용 월소득</span>
              <input inputMode="numeric" placeholder="없으면 0" value={profileForm.monthly_income_for_policy} onChange={(event) => setProfileForm({ ...profileForm, monthly_income_for_policy: event.target.value })} />
            </label>
          </div>

          <div className="setup-actions">
            <div>
              <strong>{canSubmit ? "캘린더 준비 완료" : "필수 정보를 입력하세요"}</strong>
              <span>저장하면 취업 캘린더로 이동합니다.</span>
            </div>
            <button disabled={!canSubmit} onClick={saveProfile}><BadgeCheck size={16} />캘린더로 이동</button>
          </div>
        </section>
      </section>
    </main>
  );
}

function DashboardView({ profile, plan, events, policies, selectedPolicyIds, setSelectedPolicyIds, scenario, monthlyEventCost }: { profile: UserProfile; plan: PlanAnalysis; events: JobEvent[]; policies: MatchedPolicy[]; selectedPolicyIds: string[]; setSelectedPolicyIds: React.Dispatch<React.SetStateAction<string[]>>; scenario: PlanAnalysis | null; monthlyEventCost: Array<[string, number]> }) {
  const chartData = plan.monthly_cash_flows.map((flow) => ({ month: flow.month, balance: flow.closing_cash }));
  return (
    <>
      <section className="summary-strip">
        <Metric icon={<WalletCards />} label="현재 가용자금" value={formatWon(profile.available_cash)} />
        <Metric icon={<LineChart />} label="다음 달 예상지출" value={formatWon(plan.predicted_next_spend)} sub={`${plan.spend_delta_rate}%`} />
        <Metric icon={<CalendarPlus />} label="자금 유지기간" value={`${plan.months_until_shortage ?? 0}개월`} sub={plan.shortage_month ?? "부족월 없음"} />
        <Metric icon={<BadgeCheck />} label="권장 월 지출한도" value={formatWon(plan.recommended_monthly_spend_limit)} />
      </section>
      <section className="dashboard-grid">
        <Panel title="월별 예상 잔액">
          <div className="chart">
            <ResponsiveContainer>
              <ReLineChart data={chartData} margin={{ top: 8, right: 18, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d7dee8" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 10000)}만`} width={54} />
                <Tooltip formatter={(value) => formatWon(Number(value))} />
                <Line type="monotone" dataKey="balance" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
              </ReLineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="AI 행동 가이드">
          <p className="guide">{plan.guide}</p>
          <div className="flow-list">
            {plan.monthly_cash_flows.slice(0, 4).map((flow) => (
              <div className="flow-row" key={flow.month}>
                <span>{flow.month}</span>
                <strong>{formatWon(flow.closing_cash)}</strong>
              </div>
            ))}
          </div>
        </Panel>
      </section>
      <section className="dashboard-grid three">
        <CompactList title="다가오는 일정" items={events.slice(0, 5).map((event) => ({ key: event.id, title: event.title, meta: `${event.event_date} · ${eventTypeLabels[event.event_type]}`, value: formatWon(event.expected_cost) }))} />
        <PolicyPanel policies={policies} selectedPolicyIds={selectedPolicyIds} setSelectedPolicyIds={setSelectedPolicyIds} />
        <Panel title="월별 취준 비용">
          <div className="flow-list">
            {monthlyEventCost.map(([month, cost]) => (
              <div className="flow-row" key={month}>
                <span>{month}</span>
                <strong>{formatWon(cost)}</strong>
              </div>
            ))}
          </div>
          {scenario && <p className="scenario-note">시나리오 예상잔액 {formatWon(scenario.target_month_balance)}</p>}
        </Panel>
      </section>
    </>
  );
}

function CalendarView({ events, eventForm, setEventForm, addEvent, runScenario, calendarMonth, setCalendarMonth, monthlyEventCost }: { events: JobEvent[]; eventForm: EventForm; setEventForm: React.Dispatch<React.SetStateAction<EventForm>>; addEvent: () => Promise<void>; runScenario: () => Promise<void>; calendarMonth: string; setCalendarMonth: React.Dispatch<React.SetStateAction<string>>; monthlyEventCost: Array<[string, number]> }) {
  const calendarDays = buildCalendarDays(calendarMonth, events);
  const monthCost = monthlyEventCost.find(([month]) => month === calendarMonth)?.[1] ?? 0;
  return (
    <section className="calendar-layout">
      <Panel title="월간 취업 일정">
        <div className="calendar-toolbar">
          <input type="month" value={calendarMonth} onChange={(event) => setCalendarMonth(event.target.value)} />
          <strong>{calendarMonth} 예상 취준비 {formatWon(monthCost)}</strong>
        </div>
        <div className="weekday-row">
          {["일", "월", "화", "수", "목", "금", "토"].map((day) => <span key={day}>{day}</span>)}
        </div>
        <div className="calendar-grid">
          {calendarDays.map((day) => (
            <div className={`calendar-cell ${day.inMonth ? "" : "muted-cell"}`} key={day.key}>
              <span className="day-number">{day.day}</span>
              <div className="calendar-events">
                {day.events.slice(0, 3).map((event) => (
                  <button className="event-chip" key={event.id} onClick={() => setEventForm({ title: event.title, event_type: event.event_type, event_date: event.event_date, expected_cost: String(event.expected_cost) })}>
                    {event.title}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <section className="side-stack">
        <EventFormPanel eventForm={eventForm} setEventForm={setEventForm} addEvent={addEvent} runScenario={runScenario} />
        <CompactList title="일정 목록" items={events.map((event) => ({ key: event.id, title: event.title, meta: `${event.event_date} · ${eventTypeLabels[event.event_type]}`, value: formatWon(event.expected_cost) }))} />
      </section>
    </section>
  );
}

function PoliciesView({ policies, selectedPolicyIds, setSelectedPolicyIds, confirmedSupport, setConfirmedSupport, scenario }: { policies: MatchedPolicy[]; selectedPolicyIds: string[]; setSelectedPolicyIds: React.Dispatch<React.SetStateAction<string[]>>; confirmedSupport: { month: string; amount: string }; setConfirmedSupport: React.Dispatch<React.SetStateAction<{ month: string; amount: string }>>; scenario: PlanAnalysis | null }) {
  return (
    <section className="dashboard-grid">
      <PolicyPanel policies={policies} selectedPolicyIds={selectedPolicyIds} setSelectedPolicyIds={setSelectedPolicyIds} />
      <Panel title="정책 적용 효과">
        <p className="muted">정책 공고의 지원 내용을 자동으로 금액으로 추정하지 않습니다. 지급이 확정된 금액만 입력하세요.</p>
        <div className="form-row">
          <input type="month" value={confirmedSupport.month} onChange={(event) => setConfirmedSupport({ ...confirmedSupport, month: event.target.value })} />
          <input type="number" min="0" placeholder="확정 지원금" value={confirmedSupport.amount} onChange={(event) => setConfirmedSupport({ ...confirmedSupport, amount: event.target.value })} />
        </div>
        {scenario ? <div className="compare"><div><span>시나리오 예상잔액</span><strong>{formatWon(scenario.target_month_balance)}</strong></div></div> : <p className="muted">정책을 선택하고, 취업 캘린더에서 What-if를 실행하면 확정 지원금을 반영합니다.</p>}
      </Panel>
    </section>
  );
}

function RecordsView({ recordForm, setRecordForm, saveFinancialRecord, financialRecords }: { recordForm: { month: string; spend: string; bill: string; balance: string; credit_score: string; income: string }; setRecordForm: React.Dispatch<React.SetStateAction<{ month: string; spend: string; bill: string; balance: string; credit_score: string; income: string }>>; saveFinancialRecord: () => Promise<void>; financialRecords: FinancialRecord[] }) {
  return (
    <section className="dashboard-grid">
      <FinancialRecordPanel recordForm={recordForm} setRecordForm={setRecordForm} saveFinancialRecord={saveFinancialRecord} financialRecords={financialRecords} />
      <CompactList title="최근 금융 기록" items={financialRecords.slice(-8).reverse().map((record) => ({ key: record.month, title: record.month, meta: `소비 ${formatWon(record.spend)} · 청구 ${formatWon(record.bill)}`, value: formatWon(record.balance) }))} />
    </section>
  );
}

function SettingsView({ profile, onLogout }: { profile: UserProfile; onLogout: () => Promise<void> }) {
  return <section className="dashboard-grid"><ProfilePanel profile={profile} /><Panel title="계정"><p className="muted">이 기기의 로그인 세션을 종료합니다.</p><button className="secondary" onClick={() => void onLogout()}>로그아웃</button></Panel></section>;
}

function EventFormPanel({ eventForm, setEventForm, addEvent, runScenario }: { eventForm: EventForm; setEventForm: React.Dispatch<React.SetStateAction<EventForm>>; addEvent: () => Promise<void>; runScenario: () => Promise<void> }) {
  return (
    <Panel title="일정 등록">
      <div className="form-row">
        <input placeholder="일정명" value={eventForm.title} onChange={(event) => setEventForm({ ...eventForm, title: event.target.value })} />
        <select value={eventForm.event_type} onChange={(event) => setEventForm({ ...eventForm, event_type: event.target.value })}>
          {Object.entries(eventTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      <div className="form-row">
        <input type="date" value={eventForm.event_date} onChange={(event) => setEventForm({ ...eventForm, event_date: event.target.value })} />
        <input type="number" placeholder="예상비용" value={eventForm.expected_cost} onChange={(event) => setEventForm({ ...eventForm, expected_cost: event.target.value })} />
      </div>
      <div className="button-row">
        <button onClick={addEvent}><CalendarPlus size={16} />일정 저장</button>
        <button className="secondary" onClick={runScenario}>What-if 실행</button>
      </div>
    </Panel>
  );
}

function Metric({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <article className="metric">
      <div className="metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      {sub && <small>{sub}</small>}
    </article>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function CompactList({ title, items }: { title: string; items: Array<{ key: string; title: string; meta: string; value: string }> }) {
  return (
    <Panel title={title}>
      <div className="item-list">
        {items.length === 0 && <p className="muted">등록된 항목이 없습니다.</p>}
        {items.map((item) => (
          <div className="item" key={item.key}>
            <div>
              <strong>{item.title}</strong>
              <span>{item.meta}</span>
            </div>
            <b>{item.value}</b>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function PolicyPanel({ policies, selectedPolicyIds, setSelectedPolicyIds }: { policies: MatchedPolicy[]; selectedPolicyIds: string[]; setSelectedPolicyIds: React.Dispatch<React.SetStateAction<string[]>> }) {
  return (
    <Panel title="추천 정책">
      <div className="item-list">
        {policies.length === 0 && <p className="muted">정책 API 키를 설정하면 추천 정책이 표시됩니다.</p>}
        {policies.slice(0, 8).map((policy) => (
          <label className="policy" key={policy.id}>
            <input
              type="checkbox"
              checked={selectedPolicyIds.includes(policy.id)}
              onChange={(event) => setSelectedPolicyIds((current) => event.target.checked ? [...current, policy.id] : current.filter((id) => id !== policy.id))}
            />
            <div>
              <strong>{policy.name}</strong>
              <span>{policy.match_score}점 · {policy.benefit_amount == null ? "지원금 공고 확인" : formatWon(policy.benefit_amount)} · {policy.application_period}</span>
              <p>{policy.description}</p>
            </div>
          </label>
        ))}
      </div>
    </Panel>
  );
}

function ProfilePanel({ profile }: { profile: UserProfile }) {
  return (
    <Panel title="현재 프로필">
      <div className="flow-list">
        <div className="flow-row"><span>사용자</span><strong>{profile.user_id}</strong></div>
        <div className="flow-row"><span>가용자금</span><strong>{formatWon(profile.available_cash)}</strong></div>
        <div className="flow-row"><span>월 예상수입</span><strong>{formatWon(profile.monthly_income)}</strong></div>
        <div className="flow-row"><span>거주지역</span><strong>{profile.region}</strong></div>
        <div className="flow-row"><span>목표 취업월</span><strong>{profile.target_job_month}</strong></div>
      </div>
    </Panel>
  );
}

function FinancialRecordPanel({ recordForm, setRecordForm, saveFinancialRecord, financialRecords }: { recordForm: { month: string; spend: string; bill: string; balance: string; credit_score: string; income: string }; setRecordForm: React.Dispatch<React.SetStateAction<{ month: string; spend: string; bill: string; balance: string; credit_score: string; income: string }>>; saveFinancialRecord: () => Promise<void>; financialRecords: FinancialRecord[] }) {
  return (
    <Panel title="월별 금융 기록">
      <div className="form-row">
        <input type="month" value={recordForm.month} onChange={(event) => setRecordForm({ ...recordForm, month: event.target.value })} />
        <input type="number" placeholder="카드 소비액" value={recordForm.spend} onChange={(event) => setRecordForm({ ...recordForm, spend: event.target.value })} />
      </div>
      <div className="form-row">
        <input type="number" placeholder="청구금액" value={recordForm.bill} onChange={(event) => setRecordForm({ ...recordForm, bill: event.target.value })} />
        <input type="number" placeholder="카드 잔액/부담" value={recordForm.balance} onChange={(event) => setRecordForm({ ...recordForm, balance: event.target.value })} />
      </div>
      <div className="form-row">
        <input type="number" placeholder="신용점수 선택" value={recordForm.credit_score} onChange={(event) => setRecordForm({ ...recordForm, credit_score: event.target.value })} />
        <input type="number" placeholder="해당월 수입 선택" value={recordForm.income} onChange={(event) => setRecordForm({ ...recordForm, income: event.target.value })} />
      </div>
      <button onClick={saveFinancialRecord}><Database size={16} />기록 저장</button>
      <div className="item-list with-margin">
        {financialRecords.slice(-5).map((record) => (
          <div className="item" key={record.month}>
            <div>
              <strong>{record.month}</strong>
              <span>소비 {formatWon(record.spend)} · 청구 {formatWon(record.bill)}</span>
            </div>
            <b>{formatWon(record.balance)}</b>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function buildCalendarDays(monthValue: string, events: JobEvent[]) {
  const [year, month] = monthValue.split("-").map(Number);
  const first = new Date(year, month - 1, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return {
      key: iso,
      day: date.getDate(),
      inMonth: date.getMonth() === month - 1,
      events: events.filter((event) => event.event_date === iso)
    };
  });
}

createRoot(document.getElementById("root")!).render(<App />);
