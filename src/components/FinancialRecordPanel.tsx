import React from "react";
import { Database } from "lucide-react";
import type { FinancialRecord, RecordForm } from "../types";
import { formatWon } from "../utils";
import { Panel } from "./Panel";
import { YearMonthSelect } from "./YearMonthSelect";

export function FinancialRecordPanel({ recordForm, setRecordForm, saveFinancialRecord, financialRecords, notice }: { recordForm: RecordForm; setRecordForm: React.Dispatch<React.SetStateAction<RecordForm>>; saveFinancialRecord: () => Promise<void>; financialRecords: FinancialRecord[]; notice?: string | null }) {
  return (
    <Panel title="월별 금융 기록">
      <div className="form-row">
        <YearMonthSelect value={recordForm.month} onChange={(value) => setRecordForm({ ...recordForm, month: value })} yearsBehind={2} yearsAhead={0} />
        <input type="number" placeholder="카드 소비액" value={recordForm.spend} onChange={(event) => setRecordForm({ ...recordForm, spend: event.target.value })} />
      </div>
      <div className="form-row">
        <input type="number" placeholder="청구금액" value={recordForm.bill} onChange={(event) => setRecordForm({ ...recordForm, bill: event.target.value })} />
        <input type="number" placeholder="카드 잔액/부담" value={recordForm.balance} onChange={(event) => setRecordForm({ ...recordForm, balance: event.target.value })} />
      </div>
      <div className="form-row">
        <input type="number" placeholder="신용점수 선택" value={recordForm.credit_score} onChange={(event) => setRecordForm({ ...recordForm, credit_score: event.target.value })} />
        <input type="number" placeholder="해당월 수입 선택" value={recordForm.income} onChange={(event) => setRecordForm({ ...recordForm, income: event.target.value })} />
      </div>
      <button onClick={saveFinancialRecord}><Database size={16} />기록 저장</button>
      {notice && <p className="muted">{notice}</p>}
      <div className="item-list with-margin">
        {financialRecords.slice(-5).map((record) => (
          <div className="item" key={record.month}>
            <div>
              <strong>{record.month}</strong>
              <span>소비 {formatWon(record.spend)} · 청구 {formatWon(record.bill)}</span>
            </div>
            <b>{formatWon(record.balance)}</b>
          </div>
        ))}
      </div>
    </Panel>
  );
}
