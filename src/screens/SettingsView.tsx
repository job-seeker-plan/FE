import type { UserProfile } from "../types";
import { Panel } from "../components/Panel";
import { ProfilePanel } from "../components/ProfilePanel";

export function SettingsView({ profile, onLogout }: { profile: UserProfile; onLogout: () => Promise<void> }) {
  return (
    <section className="dashboard-grid">
      <ProfilePanel profile={profile} />
      <Panel title="계정">
        <p className="muted">이 기기의 로그인 세션을 종료합니다.</p>
        <button className="secondary" onClick={() => void onLogout()}>로그아웃</button>
      </Panel>
    </section>
  );
}
