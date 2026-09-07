import React, { useEffect, useRef, useState } from "react";
import { ChevronRight, House, Menu, X } from "lucide-react";
import type { Status, ViewKey } from "../types";
import { navItems } from "../constants";
import logo from "../assets/j2w-logo.png";

const statusLabels: Record<Status, string> = {
  stable: "안정",
  caution: "주의",
  risk: "위험",
};

export function AppFrame({ activeView, setActiveView, title, status, children }: { activeView: ViewKey; setActiveView: (view: ViewKey) => void; title: string; status: Status | null; children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const dialog = menuRef.current;
    dialog?.showModal();
    const previousOverflow = document.documentElement.style.overflowY;
    document.documentElement.style.overflowY = "hidden";
    return () => {
      dialog?.close();
      document.documentElement.style.overflowY = previousOverflow;
    };
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
    triggerRef.current?.focus();
  }

  function navigate(view: ViewKey) {
    closeMenu();
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  return (
    <main className="app-shell mobile-app-shell">
      <header className="app-header">
        <button ref={triggerRef} className="app-icon-button" type="button" aria-label="메뉴 열기" aria-haspopup="dialog" aria-expanded={menuOpen} aria-controls="app-navigation" onClick={() => setMenuOpen(true)}><Menu size={23} /></button>
        <h1>{title}</h1>
        <button className={`app-icon-button${activeView === "overview" ? " is-current" : ""}`} type="button" aria-label="메인 화면으로 이동" aria-current={activeView === "overview" ? "page" : undefined} onClick={() => navigate("overview")}><House size={22} /></button>
      </header>

      <dialog ref={menuRef} id="app-navigation" className="app-drawer" aria-labelledby="app-menu-title" onCancel={(event) => { event.preventDefault(); closeMenu(); }} onClick={(event) => { if (event.target === event.currentTarget) closeMenu(); }}>
        <div className="app-drawer-panel">
          <div className="app-drawer-heading">
            <img src={logo} alt="J2W" />
            <button className="app-icon-button" type="button" aria-label="메뉴 닫기" onClick={closeMenu}><X size={22} /></button>
          </div>
          <h2 id="app-menu-title">메뉴</h2>
          <p className="app-drawer-description">취업 준비의 모든 순간을 함께해요.</p>
          <nav aria-label="주요 메뉴">
            {navItems.map((item) => (
              <button type="button" className={`app-drawer-link${activeView === item.key ? " is-current" : ""}`} aria-current={activeView === item.key ? "page" : undefined} key={item.key} onClick={() => navigate(item.key)}>
                <span className="app-drawer-icon">{item.icon}</span>
                <span>{item.label}</span>
                <ChevronRight size={17} />
              </button>
            ))}
          </nav>
        </div>
      </dialog>

      <section className="workspace">
        {status && <div className="app-status-row"><div className={`status ${status}`}>잔고 상태: {statusLabels[status]}</div></div>}
        {children}
      </section>
    </main>
  );
}
