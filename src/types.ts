export type ViewKey = "dashboard" | "calendar" | "policies" | "records" | "settings";
export type Status = "stable" | "caution" | "risk";

export type AuthUser = {
  user_id: string;
  provider: string;
  email: string;
  name: string;
};

export type AuthProvider = {
  key: string;
  label: string;
  configured: boolean;
};

export type UserProfile = {
  user_id: string;
  available_cash: number;
  monthly_income: number;
  age: number;
  region: string;
  employment_status: "unemployed" | "employed" | "any";
  monthly_income_for_policy: number;
  target_job_month: string;
};

export type JobEvent = {
  id: string;
  title: string;
  event_type: string;
  event_date: string;
  expected_cost: number;
  memo: string;
};

export type FinancialRecord = {
  user_id: string;
  month: string;
  spend: number;
  bill: number;
  balance: number;
  income: number;
};

export type MatchedPolicy = {
  id: string;
  name: string;
  match_score: number;
  benefit_amount: number | null;
  description: string;
  application_period: string;
  matched_reasons: string[];
  missing_reasons: string[];
};

export type MonthlyCashFlow = {
  month: string;
  opening_cash: number;
  income: number;
  policy_support: number;
  predicted_spend: number;
  job_event_cost: number;
  closing_cash: number;
};

export type PlanAnalysis = {
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

export type EventForm = {
  id?: string;
  title: string;
  event_type: string;
  event_date: string;
  expected_cost: string;
};

export type ProfileForm = {
  user_id: string;
  available_cash: string;
  monthly_income: string;
  age: string;
  region: string;
  monthly_income_for_policy: string;
  target_job_month: string;
};

export type RecordForm = {
  month: string;
  spend: string;
  bill: string;
  balance: string;
  income: string;
};
