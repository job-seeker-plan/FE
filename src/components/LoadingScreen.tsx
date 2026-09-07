import { BriefcaseBusiness, CalendarDays, Check, Sparkles } from "lucide-react";

type Props = { title?: string; description?: string; fullScreen?: boolean };

export function LoadingScreen({
  title = "당신의 다음 걸음을 준비하고 있어요",
  description = "일정과 계획을 한곳에 모으는 중이에요. 잠시만 기다려 주세요.",
  fullScreen = false
}: Props) {
  return (
    <section className={`loading-screen${fullScreen ? " loading-screen-full" : ""}`} role="status" aria-live="polite" aria-atomic="true">
      <div className="loading-content">
        <span className="loading-brand" aria-hidden="true">J2W<span>YOUR NEXT STEP</span></span>
        <div className="loading-art" aria-hidden="true">
          <div className="loading-orbit" />
          <span className="loading-spark"><Sparkles size={22} /></span>
          <div className="loading-float loading-float-calendar"><CalendarDays size={25} /></div>
          <div className="loading-plan">
            <div className="loading-plan-heading"><span><BriefcaseBusiness size={22} /></span><span className="loading-plan-label">MY NEXT STEP<i /></span></div>
            <div className="loading-plan-row"><span><Check size={13} /></span><i /></div>
            <div className="loading-plan-row"><span><Check size={13} /></span><i /></div>
            <div className="loading-plan-row"><span /><i /></div>
          </div>
          <div className="loading-float loading-float-check"><Check size={23} strokeWidth={3} /></div>
          <span className="loading-dot loading-dot-one" /><span className="loading-dot loading-dot-two" />
        </div>
        <h2>{title}</h2>
        <p>{description}</p>
        <div className="loading-track" aria-hidden="true"><span /></div>
        <span className="loading-caption" aria-hidden="true">조금씩, 더 가까워지는 내일</span>
      </div>
    </section>
  );
}
