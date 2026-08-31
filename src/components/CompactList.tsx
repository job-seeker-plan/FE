import { Panel } from "./Panel";

export function CompactList({ title, items, onItemClick }: { title: string; items: Array<{ key: string; title: string; meta: string; value: string }>; onItemClick?: (key: string) => void }) {
  return (
    <Panel title={title}>
      <div className="item-list">
        {items.length === 0 && <p className="muted">등록된 항목이 없습니다.</p>}
        {items.map((item) => (
          <div className={`item ${onItemClick ? "clickable-item" : ""}`} key={item.key} onClick={() => onItemClick?.(item.key)}>
            <div>
              <strong>{item.title}</strong>
              <span>{item.meta}</span>
            </div>
            <b>{item.value}</b>
          </div>
        ))}
      </div>
    </Panel>
  );
}
