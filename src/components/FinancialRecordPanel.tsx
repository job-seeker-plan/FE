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
        <label className="money-field"><span>카드 소비액</span><div className="money-input"><input type="number" min="0" value={recordForm.spend} onChange={(event) => setRecordForm({ ...recordForm, spend: event.target.value })} /><span>만원</span></div></label>
      </div>
      <div className="form-row">
        <label className="money-field"><span>청구금액</span><div className="money-input"><input type="number" min="0" value={recordForm.bill} onChange={(event) => setRecordForm({ ...recordForm, bill: event.target.value })} /><span>만원</span></div></label>
        <label className="money-field"><span>카드 잔액/부담</span><div className="money-input"><input type="number" min="0" value={recordForm.balance} onChange={(event) => setRecordForm({ ...recordForm, balance: event.target.value })} /><span>만원</span></div></label>
      </div>
      <div className="form-row">
        <label className="money-field"><span>해당월 수입</span><div className="money-input"><input type="number" min="0" value={recordForm.income} onChange={(event) => setRecordForm({ ...recordForm, income: event.target.value })} /><span>만원</span></div></label>
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
