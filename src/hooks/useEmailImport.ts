import { useState } from "react";
import { request } from "../api";
import type { EmailPreviewEvent } from "../types";

export function useEmailImport(onImported: (events: EmailPreviewEvent[]) => Promise<void>) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<EmailPreviewEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  async function openImport() {
    setIsOpen(true);
    setCandidates([]);
    setError(null);
    setImportNotice(null);
    setLoading(true);
    try {
      const result = await request<EmailPreviewEvent[]>("/email/preview");
      setCandidates(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "이메일을 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  }

  function close() {
    setIsOpen(false);
    setCandidates([]);
    setError(null);
    setImportNotice(null);
  }

  async function importSelected(selected: EmailPreviewEvent[]) {
    if (selected.length === 0) return;
    setImporting(true);
    try {
      await onImported(selected);
      setImportNotice(`${selected.length}개 일정을 캘린더에 추가했습니다.`);
      const importedIds = new Set(selected.map((event) => event.message_id));
      setCandidates((current) => current.filter((event) => !importedIds.has(event.message_id)));
    } catch {
      setImportNotice("일정 추가 중 오류가 발생했어요.");
    } finally {
      setImporting(false);
    }
  }

  return { isOpen, loading, candidates, error, importing, importNotice, openImport, close, importSelected };
}
