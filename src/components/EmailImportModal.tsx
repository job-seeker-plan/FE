import { useState } from "react";
import { Mail, X } from "lucide-react";
import type { EmailPreviewEvent } from "../types";
import { eventTypeLabels } from "../constants";

type Props = {
  loading: boolean;
  candidates: EmailPreviewEvent[];
  error: string | null;
  importing: boolean;
  importNotice: string | null;
  onImport: (selected: EmailPreviewEvent[]) => Promise<void>;
  onClose: () => void;
};

export function EmailImportModal({ loading, candidates, error, importing, importNotice, onImport, onClose }: Props) {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  function toggleAll() {
    if (checkedIds.size === candidates.length) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(candidates.map((c) => c.message_id)));
    }
  }

  function toggle(messageId: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(messageId) ? next.delete(messageId) : next.add(messageId);
      return next;
    });
  }

  async function handleImport() {
    const selected = candidates.filter((c) => checkedIds.has(c.message_id));
    await onImport(selected);
    setCheckedIds(new Set());
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="form-modal email-import-modal">
        <div className="modal-header">
          <span className="modal-title"><Mail size={16} /> Gmail 채용 일정 가져오기</span>
          <button className="icon-button" aria-label="닫기" onClick={onClose}><X size={18} /></button>
        </div>

        {loading && <p className="muted email-import-status">이메일을 검색하는 중입니다…</p>}

        {error && <p className="error-text email-import-status">{error}</p>}

        {!loading && !error && candidates.length === 0 && (
          <p className="muted email-import-status">가져올 채용 관련 이메일이 없습니다.</p>
        )}

        {candidates.length > 0 && (
          <>
            <div className="email-import-toolbar">
              <label className="checkbox-label">
                <input type="checkbox" checked={checkedIds.size === candidates.length} onChange={toggleAll} />
                전체 선택 ({candidates.length}개)
              </label>
            </div>
            <ul className="email-import-list">
              {candidates.map((c) => (
                <li key={c.message_id} className={`email-import-item ${checkedIds.has(c.message_id) ? "checked" : ""}`}>
                  <label className="checkbox-label">
                    <input type="checkbox" checked={checkedIds.has(c.message_id)} onChange={() => toggle(c.message_id)} />
                    <div className="email-import-info">
                      <span className="email-import-title">{c.title}</span>
                      <span className="email-import-meta">
                        <span className="event-type-badge">{eventTypeLabels[c.event_type] ?? c.event_type}</span>
                        {c.event_date && <span>{c.event_date}</span>}
                        {c.memo && <span className="muted">{c.memo}</span>}
                      </span>
                    </div>
                  </label>
                </li>
              ))}
            </ul>
            <div className="button-row">
              <button onClick={() => void handleImport()} disabled={checkedIds.size === 0 || importing}>
                {importing ? "추가 중…" : `선택한 ${checkedIds.size}개 추가`}
              </button>
              <button className="secondary" onClick={onClose}>닫기</button>
            </div>
          </>
        )}

        {importNotice && <p className="success-text">{importNotice}</p>}
      </div>
    </div>
  );
}
