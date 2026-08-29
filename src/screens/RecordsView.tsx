import React from "react";
import type { FinancialRecord, RecordForm } from "../types";
import { formatWon } from "../utils";
import { CompactList } from "../components/CompactList";
import { FinancialRecordPanel } from "../components/FinancialRecordPanel";

export function RecordsView({ recordForm, setRecordForm, saveFinancialRecord, financialRecords, recordNotice }: { recordForm: RecordForm; setRecordForm: React.Dispatch<React.SetStateAction<RecordForm>>; saveFinancialRecord: () => Promise<void>; financialRecords: FinancialRecord[]; recordNotice?: string | null }) {
  return (
    <section className="dashboard-grid">
      <FinancialRecordPanel recordForm={recordForm} setRecordForm={setRecordForm} saveFinancialRecord={saveFinancialRecord} financialRecords={financialRecords} notice={recordNotice} />
      <CompactList title="최근 금융 기록" items={financialRecords.slice(-8).reverse().map((record) => ({ key: record.month, title: record.month, meta: `소비 ${formatWon(record.spend)} · 청구 ${formatWon(record.bill)}`, value: formatWon(record.balance) }))} />
    </section>
  );
}
