import { API_BASE } from "../api";
import type { AuthProvider } from "../types";

export function LoginScreen({ providers }: { providers: AuthProvider[] }) {
  return (
    <main className="shell login-shell">
      <section className="login-card">
        <div>
          <h1>내 취업 준비 현금흐름을 개인 계정으로 관리하세요</h1>
          <p>로그인 후 금융 기록, 취업 캘린더, 정책 매칭 결과가 사용자별로 분리됩니다.</p>
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
    </main>
  );
}
