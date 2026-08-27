import { API_BASE } from "../api";
import type { AuthProvider } from "../types";

export function LoginScreen({ providers }: { providers: AuthProvider[] }) {
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
