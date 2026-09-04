import React from "react";
import type { FinancialContextForm } from "../types";

export const contextGoals = ["빠르게 취업하기", "교육·자격증 투자", "면접 준비비 확보", "생활비 안정"];
export const contextBurdens = ["고정 생활비", "교육·자격증", "면접·교통비", "카드 결제"];
export const contextFirstQuestions = ["이번 달 줄일 지출은?", "면접비는 얼마나 남겨둘까?"];

export function FinancialContextFields({ contextForm, setContextForm }: { contextForm: FinancialContextForm; setContextForm: React.Dispatch<React.SetStateAction<FinancialContextForm>> }) {
  return (
    <>
      <ContextChoice label="취업 준비 목표" options={contextGoals} value={contextForm.goal} onChange={(goal) => setContextForm({ ...contextForm, goal })} />
      <ContextChoice label="부담되는 지출" options={contextBurdens} value={contextForm.burden} onChange={(burden) => setContextForm({ ...contextForm, burden })} />
      <label className="context-pledge"><span>나만의 다짐 한 줄 <em>선택</em></span><input maxLength={180} placeholder="예: 면접이 있는 달에도 생활비 예산은 지킬래요" value={contextForm.pledge} onChange={(event) => setContextForm({ ...contextForm, pledge: event.target.value })} /></label>
      <ContextChoice label="AI에게 처음 받고 싶은 도움" options={contextFirstQuestions} value={contextForm.first_question} onChange={(first_question) => setContextForm({ ...contextForm, first_question })} />
    </>
  );
}

function ContextChoice({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (value: string) => void }) {
  return <div className="context-choice"><span>{label}</span><div>{options.map((option) => <button type="button" key={option} className={value === option ? "active" : ""} onClick={() => onChange(value === option ? "" : option)}>{option}</button>)}</div></div>;
}
