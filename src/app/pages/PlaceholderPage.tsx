import { Card, StatePanel } from '../../components/ui';

type PlaceholderPageProps = {
  title: string;
  description: string;
};

export function PlaceholderPage({
  description,
  title,
}: PlaceholderPageProps) {
  return (
    <div className="placeholder-page">
      <Card as="section" className="placeholder-card">
        <StatePanel
          description={description}
          icon="settings"
          title={`${title} está preparado`}
        />
      </Card>
    </div>
  );
}
