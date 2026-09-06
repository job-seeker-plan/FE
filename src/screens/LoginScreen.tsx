import { Briefcase, CalendarDays, ShieldCheck, WalletCards } from "lucide-react";
import { API_BASE } from "../api";
import type { AuthProvider } from "../types";
import logo from "../assets/j2w-logo.png";

const highlights = [
  { icon: <WalletCards size={20} />, title: "현금흐름 예측", body: "목표 취업월까지 예상 잔액을 한눈에 확인해요" },
  { icon: <CalendarDays size={20} />, title: "취업 일정 관리", body: "면접·시험 일정을 등록하고, Gmail에서 자동으로 가져와요" },
  { icon: <ShieldCheck size={20} />, title: "청년정책 매칭", body: "내 조건에 맞는 지원금을 실시간으로 찾아드려요" },
  { icon: <Briefcase size={20} />, title: "채용공고 검색", body: "조건에 맞는 채용공고를 바로 검색해요" }
];

export function LoginScreen({ providers }: { providers: AuthProvider[] }) {
  return (
    <main className="landing-page">
      <div className="landing-layout">
        <section className="landing-hero">
          <img src={logo} alt="J2W" className="landing-logo" />
          <span className="landing-badge">취업준비생을 위한 AI 금융 플래너</span>
          <h1>취업 준비 기간,<br /><span className="accent">돈 걱정</span>은 저희가 계산할게요</h1>
          <p className="landing-subtitle">
            목표 취업월까지 자금이 얼마나 버틸지 미리 확인하고, 면접 일정부터 청년정책·채용공고까지 한 곳에서 관리하세요.
          </p>
          <ul className="landing-features">
            {highlights.map((item) => (
              <li key={item.title}>
                <span className="landing-feature-icon">{item.icon}</span>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.body}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="login-card">
          <div>
            <h2>지금 시작하기</h2>
            <p>로그인하면 금융 기록·취업 캘린더·정책 매칭 결과가 내 계정으로 안전하게 분리돼요.</p>
          </div>
          <div className="oauth-list">
            {providers.filter((provider) => provider.configured).map((provider) => (
              <button
                className={`oauth-button ${provider.key}`}
                key={provider.key}
                onClick={() => {
                  window.location.href = `${API_BASE}/oauth2/authorization/${provider.key}`;
                }}
              >
                {provider.label}로 계속하기
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
