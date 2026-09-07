import React from "react";
import type { Status, ViewKey } from "../types";
import { navItems } from "../constants";
import logo from "../assets/j2w-logo.png";

const statusLabels: Record<Status, string> = {
  stable: "안정",
  caution: "주의",
  risk: "위험",
};

export function AppFrame({ activeView, setActiveView, title, status, children }: { activeView: ViewKey; setActiveView: (view: ViewKey) => void; title: string; status: Status | null; children: React.ReactNode }) {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src={logo} alt="J2W" />
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
            <h1>{title}</h1>
          </div>
          {status && <div className={`status ${status}`}>잔고 상태: {statusLabels[status]}</div>}
        </header>
        <div className="workspace-content">{children}</div>
      </section>
    </main>
  );
}
