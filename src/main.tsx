import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { AlertTriangle } from "lucide-react";
import "./styles.css";

import { clearAuthToken, optionalRequest, request } from "./api";
import { currentMonthValue, toWon } from "./utils";
import { viewTitle } from "./viewTitle";
import type {
  AuthProvider,
  AuthUser,
  EventForm,
  FinancialRecord,
  JobEvent,
  MatchedPolicy,
  PlanAnalysis,
  ProfileForm,
  RecordForm,
  UserProfile,
  ViewKey
} from "./types";

import { AppFrame } from "./components/AppFrame";
import { FinancialRecordPanel } from "./components/FinancialRecordPanel";
import { Panel } from "./components/Panel";
import { ProfilePanel } from "./components/ProfilePanel";
import { LoginScreen } from "./screens/LoginScreen";
import { Onboarding } from "./screens/Onboarding";
import { DashboardView } from "./screens/DashboardView";
import { CalendarView } from "./screens/CalendarView";
import { PoliciesView } from "./screens/PoliciesView";
import { RecordsView } from "./screens/RecordsView";
import { SettingsView } from "./screens/SettingsView";

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
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    user_id: "",
    available_cash: "",
    monthly_income: "",
    age: "",
    region: "",
    monthly_income_for_policy: "",
    target_job_month: ""
  });
  const [recordForm, setRecordForm] = useState<RecordForm>({
    month: "",
    spend: "",
    bill: "",
    balance: "",
    income: ""
  });
  const [selectedPolicyIds, setSelectedPolicyIds] = useState<string[]>([]);
  const [confirmedSupport, setConfirmedSupport] = useState({ month: "", amount: "" });
  const [scenario, setScenario] = useState<PlanAnalysis | null>(null);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);
  const [settingsNotice, setSettingsNotice] = useState<string | null>(null);
  const [eventNotice, setEventNotice] = useState<string | null>(null);
  const [recordNotice, setRecordNotice] = useState<string | null>(null);

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

  async function addEvent(): Promise<boolean> {
    if (!eventForm.title.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(eventForm.event_date) || !eventForm.expected_cost) {
      setEventNotice("일정명, 날짜(YYYY-MM-DD), 예상비용을 모두 입력해 주세요.");
      return false;
    }
    try {
      setEventNotice(null);
      await request<JobEvent>("/events", {
        method: "POST",
        body: JSON.stringify({ title: eventForm.title.trim(), event_type: eventForm.event_type, event_date: eventForm.event_date, expected_cost: toWon(eventForm.expected_cost), memo: "" })
      });
      setEventForm({ title: "", event_type: "interview", event_date: "", expected_cost: "" });
      await loadDashboard();
      return true;
    } catch {
      setEventNotice("일정을 저장하지 못했어요. 입력값을 다시 확인해 주세요.");
      return false;
    }
  }

  async function updateEvent(eventId: string): Promise<boolean> {
    if (!eventForm.title.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(eventForm.event_date) || !eventForm.expected_cost) {
      setEventNotice("일정명, 날짜(YYYY-MM-DD), 예상비용을 모두 입력해 주세요.");
      return false;
    }
    try {
      setEventNotice(null);
      await request<JobEvent>(`/events/${eventId}`, { method: "PUT", body: JSON.stringify({ title: eventForm.title.trim(), event_type: eventForm.event_type, event_date: eventForm.event_date, expected_cost: toWon(eventForm.expected_cost), memo: "" }) });
      setEventForm({ title: "", event_type: "interview", event_date: "", expected_cost: "" });
      await loadDashboard();
      return true;
    } catch {
      setEventNotice("일정을 수정하지 못했어요. 입력값을 다시 확인해 주세요.");
      return false;
    }
  }

  async function deleteEvent(eventId: string): Promise<boolean> {
    try {
      setEventNotice(null);
      await request<void>(`/events/${eventId}`, { method: "DELETE" });
      setEventForm({ title: "", event_type: "interview", event_date: "", expected_cost: "" });
      await loadDashboard();
      return true;
    } catch {
      setEventNotice("일정을 삭제하지 못했어요. 다시 시도해 주세요.");
      return false;
    }
  }

  async function saveFinancialRecord() {
    if (!recordForm.month || !recordForm.spend || !recordForm.bill || !recordForm.balance) return;
    try {
      setRecordNotice(null);
      await request<FinancialRecord>("/financial-records", {
        method: "POST",
        body: JSON.stringify({
          month: recordForm.month,
          spend: toWon(recordForm.spend),
          bill: toWon(recordForm.bill),
          balance: toWon(recordForm.balance),
          income: toWon(recordForm.income)
        })
      });
      setRecordForm({ month: "", spend: "", bill: "", balance: "", income: "" });
      await loadDashboard();
    } catch {
      setRecordNotice("기록을 저장하지 못했어요. 값을 다시 확인해 주세요.");
    }
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
        extra_cost: toWon(eventForm.expected_cost),
        policy_ids: selectedPolicyIds,
        confirmed_support_month: confirmedSupport.month || null,
        confirmed_support_amount: toWon(confirmedSupport.amount)
      })
    });
    setScenario(nextScenario);
  }

  async function submitProfile(form: ProfileForm) {
    await request<UserProfile>("/profile", {
      method: "PUT",
      body: JSON.stringify({
        user_id: authUser?.user_id ?? form.user_id,
        available_cash: toWon(form.available_cash),
        monthly_income: toWon(form.monthly_income),
        age: Number(form.age),
        region: form.region,
        employment_status: profile?.employment_status ?? "unemployed",
        monthly_income_for_policy: toWon(form.monthly_income_for_policy),
        target_job_month: form.target_job_month
      })
    });
  }

  async function saveProfile() {
    try {
      setProfileNotice(null);
      await submitProfile(profileForm);
      setActiveView("calendar");
      await loadDashboard();
    } catch {
      setProfileNotice("입력값을 다시 확인해 주세요.");
    }
  }

  async function updateProfile(form: ProfileForm) {
    try {
      setSettingsNotice(null);
      await submitProfile(form);
      setSettingsNotice("저장되었습니다.");
      await loadDashboard();
    } catch {
      setSettingsNotice("입력값을 다시 확인해 주세요.");
    }
  }

  async function logout() {
    await request<void>("/auth/logout", { method: "POST" });
    clearAuthToken();
    window.location.assign(window.location.origin);
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
    return <Onboarding authUser={authUser} profileForm={profileForm} setProfileForm={setProfileForm} saveProfile={saveProfile} submitNotice={profileNotice} />;
  }

  const shared = {
    profile,
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
    updateEvent,
    deleteEvent,
    runScenario,
    scenario,
    recordForm,
    setRecordForm,
    saveFinancialRecord,
    monthlyEventCost,
    calendarMonth,
    setCalendarMonth,
    eventNotice,
    recordNotice
  };

  return (
    <AppFrame activeView={activeView} setActiveView={setActiveView} title={viewTitle(activeView)} status={plan?.status ?? null}>
      {activeView === "dashboard" && (
        plan ? (
          <DashboardView {...shared} plan={plan} />
        ) : (
          <>
            <section className="dashboard-grid">
              <Panel title="금융 Feature 파일">
                <div className="requirement">
                  <span><code>Data/processed/user_month_features.csv</code> 또는 아래 월별 실제 금융 기록이 필요합니다. AI 서비스도 실행되어야 합니다.</span>
                </div>
              </Panel>
              <Panel title="정책 API 키">
                <div className="requirement">
                  <span>백엔드 실행 환경에 <code>GOV_API</code>를 설정해야 실제 정책 매칭이 동작합니다.</span>
                </div>
              </Panel>
            </section>
            <section className="dashboard-grid">
              <FinancialRecordPanel recordForm={recordForm} setRecordForm={setRecordForm} saveFinancialRecord={saveFinancialRecord} financialRecords={financialRecords} notice={recordNotice} />
              <ProfilePanel profile={profile} />
            </section>
          </>
        )
      )}
      {activeView === "calendar" && <CalendarView {...shared} />}
      {activeView === "policies" && <PoliciesView {...shared} />}
      {activeView === "records" && <RecordsView {...shared} />}
      {activeView === "settings" && <SettingsView profile={profile} onLogout={logout} updateProfile={updateProfile} updateNotice={settingsNotice} />}
    </AppFrame>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
