interface EmptyStateProps {
  title: string;
  text?: string;
}

export function EmptyState({ title, text }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      {text ? <span>{text}</span> : null}
    </div>
  );
}
