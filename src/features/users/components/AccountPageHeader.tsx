import type { ReactNode } from 'react';

type AccountPageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
};

export function AccountPageHeader({
  action,
  description,
  eyebrow,
  title,
}: AccountPageHeaderProps) {
  return (
    <header className="account-page__header">
      <div className="account-page__heading-copy">
        <span className="account-page__eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action ? <div className="account-page__header-action">{action}</div> : null}
    </header>
  );
}
