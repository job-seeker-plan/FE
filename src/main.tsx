import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { AlertTriangle } from "lucide-react";
import "./styles.css";

import { clearAuthToken, optionalRequest, request } from "./api";
import { currentMonthValue, extractPolicyDeadline, toWon } from "./utils";
import { viewTitle } from "./viewTitle";
import type {
  AuthProvider,
  AuthUser,
  EventForm,
  FinancialContextForm,
  FinanceTransaction,
  JobEvent,
  MatchedPolicy,
  PlanAnalysis,
  ProfileForm,
  TransactionForm,
  UserProfile,
  ViewKey
} from "./types";

import { AppFrame } from "./components/AppFrame";
import { LoginScreen } from "./screens/LoginScreen";
import { Onboarding } from "./screens/Onboarding";
import { JobsView } from "./screens/JobsView";
import { CalendarView } from "./screens/CalendarView";
import { PoliciesView } from "./screens/PoliciesView";
import { SettingsView } from "./screens/SettingsView";

function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authProviders, setAuthProviders] = useState<AuthProvider[]>([]);
  const [authReady, setAuthReady] = useState(false);
  const [activeView, setActiveView] = useState<ViewKey>("jobs");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [plan, setPlan] = useState<PlanAnalysis | null>(null);
  const [events, setEvents] = useState<JobEvent[]>([]);
  const [financeTransactions, setFinanceTransactions] = useState<FinanceTransaction[]>([]);
  const [policies, setPolicies] = useState<MatchedPolicy[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(currentMonthValue());
  const [eventForm, setEventForm] = useState<EventForm>({ title: "", event_type: "interview", event_date: "", expected_cost: "" });
  const [transactionForm, setTransactionForm] = useState<TransactionForm>({ occurred_on: "", type: "expense", category: "food", amount: "", memo: "" });
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    user_id: "",
    available_cash: "",
    monthly_income: "",
    age: "",
    region: "",
    monthly_income_for_policy: "",
    target_job_month: ""
  });
  const [financialContextForm, setFinancialContextForm] = useState<FinancialContextForm>({ goal: "", burden: "", pledge: "", first_question: "" });
  const [selectedPolicyIds, setSelectedPolicyIds] = useState<string[]>([]);
  const [confirmedPolicyIds, setConfirmedPolicyIds] = useState<string[]>([]);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);
  const [settingsNotice, setSettingsNotice] = useState<string | null>(null);
  const [eventNotice, setEventNotice] = useState<string | null>(null);
  const [transactionNotice, setTransactionNotice] = useState<string | null>(null);
  const [policyNotice, setPolicyNotice] = useState<string | null>(null);

  async function loadDashboard() {
    try {
      setError(null);
      const nextProfile = await optionalRequest<UserProfile>("/profile");
      setProfile(nextProfile);
      if (!nextProfile) {
        setPlan(null);
        setEvents([]);
        setFinanceTransactions([]);
        setPolicies([]);
        return;
      }
      const [nextPlan, nextEvents, nextTransactions, nextPolicies] = await Promise.all([
        optionalRequest<PlanAnalysis>("/plan"),
        optionalRequest<JobEvent[]>("/events"),
        optionalRequest<FinanceTransaction[]>("/transactions"),
        optionalRequest<MatchedPolicy[]>("/policies/matches")
      ]);
      setPlan(nextPlan);
      setEvents(nextEvents ?? []);
      setFinanceTransactions(nextTransactions ?? []);
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
    if (!eventForm.title || !eventForm.event_date) return;
    try {
      setEventNotice(null);
      const savedEvent = await request<JobEvent>("/events", {
        method: "POST",
        body: JSON.stringify({ ...eventForm, expected_cost: toWon(eventForm.expected_cost), memo: "" })
      });
      setEvents((current) => [...current, savedEvent].sort((left, right) => left.event_date.localeCompare(right.event_date)));
      setEventForm({ title: "", event_type: "interview", event_date: "", expected_cost: "" });
      void refreshPlan();
    } catch {
      setEventNotice("일정을 저장하지 못했어요. 입력값을 다시 확인해 주세요.");
    }
  }

  async function updateEvent() {
    if (!eventForm.id || !eventForm.title || !eventForm.event_date) return;
    try {
      setEventNotice(null);
      const updatedEvent = await request<JobEvent>(`/events/${eventForm.id}`, {
        method: "PUT",
        body: JSON.stringify({ title: eventForm.title, event_type: eventForm.event_type, event_date: eventForm.event_date, expected_cost: toWon(eventForm.expected_cost), memo: "" })
      });
      setEvents((current) => current.map((event) => event.id === updatedEvent.id ? updatedEvent : event).sort((left, right) => left.event_date.localeCompare(right.event_date)));
      setEventForm({ title: "", event_type: "interview", event_date: "", expected_cost: "" });
      void refreshPlan();
    } catch {
      setEventNotice("일정을 수정하지 못했어요. 입력값을 다시 확인해 주세요.");
    }
  }

  async function deleteEvent(eventId = eventForm.id) {
    if (!eventId || !window.confirm("이 일정을 삭제할까요?")) return;
    try {
      setEventNotice(null);
      await request<void>(`/events/${eventId}`, { method: "DELETE" });
      // The DELETE has succeeded, so update the calendar immediately instead
      // of waiting for the slower dashboard-wide refresh to finish.
      setEvents((current) => current.filter((event) => event.id !== eventId));
      setEventForm({ title: "", event_type: "interview", event_date: "", expected_cost: "" });
      void refreshPlan();
    } catch {
      setEventNotice("일정을 삭제하지 못했어요.");
    }
  }

  async function refreshPlan() {
    const nextPlan = await optionalRequest<PlanAnalysis>("/plan");
    if (nextPlan) setPlan(nextPlan);
  }

  function cancelEdit() {
    setEventForm({ title: "", event_type: "interview", event_date: "", expected_cost: "" });
    setEventNotice(null);
  }

  async function confirmSelectedPolicies() {
    const selectedPolicies = policies.filter((policy) => selectedPolicyIds.includes(policy.id));
    if (selectedPolicies.length === 0) {
      setPolicyNotice("먼저 확정할 정책을 선택해 주세요.");
      return;
    }

    const existingPolicyIds = new Set(
      events.map((event) => event.memo.match(/^policy:(.+)$/)?.[1]).filter(Boolean)
    );
    const datedPolicies = selectedPolicies.filter((policy) => extractPolicyDeadline(policy.application_period));
    const undatedPolicies = selectedPolicies.filter((policy) => !extractPolicyDeadline(policy.application_period));
    const newPolicies = datedPolicies.filter((policy) => !existingPolicyIds.has(policy.id));

    try {
      const createdEvents = await Promise.all(newPolicies.map((policy) => request<JobEvent>("/events", {
        method: "POST",
        body: JSON.stringify({
          title: policy.name + " 마감",
          event_type: "document_deadline",
          event_date: extractPolicyDeadline(policy.application_period),
          expected_cost: 0,
          memo: "policy:" + policy.id
        })
      })));
      if (createdEvents.length > 0) {
        setEvents((current) => [...current, ...createdEvents].sort((left, right) => left.event_date.localeCompare(right.event_date)));
      }
      setConfirmedPolicyIds((current) => [...new Set([...current, ...selectedPolicies.map((policy) => policy.id)])]);
      setPolicyNotice(selectedPolicies.length + "개 정책을 확정했습니다. " + createdEvents.length + "개 마감일을 캘린더에 추가했습니다.");
      if (undatedPolicies.length > 0 && window.confirm("마감일이 확인되지 않은 정책 " + undatedPolicies.length + "개가 있습니다. 직접 캘린더에 등록하시겠습니까?")) {
        setEventForm({ title: "", event_type: "document_deadline", event_date: "", expected_cost: "" });
        setActiveView("calendar");
      }
    } catch {
      setPolicyNotice("정책 마감일을 캘린더에 등록하지 못했어요.");
    }
  }

  async function addTransaction() {
    if (!transactionForm.occurred_on || !transactionForm.category || !transactionForm.amount) return;
    try {
      setTransactionNotice(null);
      const saved = await request<FinanceTransaction>("/transactions", {
        method: "POST",
        body: JSON.stringify({ ...transactionForm, amount: toWon(transactionForm.amount), memo: transactionForm.memo || "" })
      });
      setFinanceTransactions((current) => [...current, saved].sort((left, right) => left.occurred_on.localeCompare(right.occurred_on)));
      setTransactionForm({ occurred_on: "", type: "expense", category: "food", amount: "", memo: "" });
    } catch {
      setTransactionNotice("가계부 내역을 저장하지 못했어요. 입력값을 다시 확인해 주세요.");
    }
  }

  async function updateTransaction() {
    if (!transactionForm.id || !transactionForm.occurred_on || !transactionForm.category || !transactionForm.amount) return;
    try {
      setTransactionNotice(null);
      const updated = await request<FinanceTransaction>(`/transactions/${transactionForm.id}`, {
        method: "PUT",
        body: JSON.stringify({ occurred_on: transactionForm.occurred_on, type: transactionForm.type, category: transactionForm.category, amount: toWon(transactionForm.amount), memo: transactionForm.memo || "" })
      });
      setFinanceTransactions((current) => current.map((transaction) => transaction.id === updated.id ? updated : transaction).sort((left, right) => left.occurred_on.localeCompare(right.occurred_on)));
      setTransactionForm({ occurred_on: "", type: "expense", category: "food", amount: "", memo: "" });
    } catch {
      setTransactionNotice("가계부 내역을 수정하지 못했어요. 입력값을 다시 확인해 주세요.");
    }
  }

  async function deleteTransaction(transactionId = transactionForm.id) {
    if (!transactionId || !window.confirm("이 가계부 내역을 삭제할까요?")) return;
    try {
      setTransactionNotice(null);
      await request<void>(`/transactions/${transactionId}`, { method: "DELETE" });
      setFinanceTransactions((current) => current.filter((transaction) => transaction.id !== transactionId));
      setTransactionForm({ occurred_on: "", type: "expense", category: "food", amount: "", memo: "" });
    } catch {
      setTransactionNotice("가계부 내역을 삭제하지 못했어요.");
    }
  }

  function cancelTransactionEdit() {
    setTransactionForm({ occurred_on: "", type: "expense", category: "food", amount: "", memo: "" });
    setTransactionNotice(null);
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

  async function saveFinancialContexts(context: FinancialContextForm) {
    const contexts = [
      context.goal && { text: `취업 준비 목표: ${context.goal}`, data_type: "goal", related_category: "cashflow", urgency_level: "normal" },
      context.burden && { text: `부담을 느끼는 지출: ${context.burden}`, data_type: "spending_concern", related_category: "cashflow", urgency_level: "high" },
      context.pledge.trim() && { text: `사용자 다짐: ${context.pledge.trim()}`, data_type: "pledge", related_category: "cashflow", urgency_level: "normal" },
      context.first_question && { text: `처음 받고 싶은 금융 도움: ${context.first_question}`, data_type: "assistant_question", related_category: "cashflow", urgency_level: "normal" }
    ].filter(Boolean);
    if (contexts.length > 0) {
      await request("/financial-contexts", { method: "POST", body: JSON.stringify({ contexts }) });
    }
  }

  async function saveProfile() {
    try {
      setProfileNotice(null);
      await submitProfile(profileForm);
      await saveFinancialContexts(financialContextForm);
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
    return <Onboarding authUser={authUser} profileForm={profileForm} setProfileForm={setProfileForm} contextForm={financialContextForm} setContextForm={setFinancialContextForm} saveProfile={saveProfile} submitNotice={profileNotice} />;
  }

  const shared = {
    profile,
    plan,
    events,
    financeTransactions,
    policies,
    selectedPolicyIds,
    setSelectedPolicyIds,
    confirmedPolicyIds,
    confirmSelectedPolicies,
    policyNotice,
    eventForm,
    setEventForm,
    addEvent,
    updateEvent,
    deleteEvent,
    cancelEdit,
    editingEventId: eventForm.id ?? null,
    transactionForm,
    setTransactionForm,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    cancelTransactionEdit,
    editingTransactionId: transactionForm.id ?? null,
    transactionNotice,
    monthlyEventCost,
    calendarMonth,
    setCalendarMonth,
    eventNotice
  };

  return (
    <AppFrame activeView={activeView} setActiveView={setActiveView} title={viewTitle(activeView)} status={plan?.status ?? null}>
      {activeView === "jobs" && <JobsView />}
      {activeView === "calendar" && <CalendarView {...shared} />}
      {activeView === "policies" && <PoliciesView {...shared} />}
      {activeView === "settings" && <SettingsView profile={profile} onLogout={logout} updateProfile={updateProfile} updateNotice={settingsNotice} />}
    </AppFrame>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
