import { EmptyState, Icon, type IconName } from '../../../components/ui';
import { formatInstant } from '../../insights/utils/insight-format';
import type {
  DashboardActivityItem,
  DashboardActivityKind,
} from '../utils/dashboard-activity';

const activityIcons: Record<DashboardActivityKind, IconName> = {
  insight: 'insights',
  goal: 'goal',
};

/**
 * Atividade recente montada apenas com as fontes efetivamente disponíveis no
 * bundle: análises geradas e metas atualizadas.
 */
export function RecentActivity({
  items,
}: {
  items: readonly DashboardActivityItem[];
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        description="Assim que houver análises ou metas atualizadas, elas aparecerão aqui."
        title="Sem atividade recente"
      />
    );
  }

  return (
    <ol className="activity-list">
      {items.map((item) => (
        <li key={item.id}>
          <span aria-hidden="true" className="activity-list__icon">
            <Icon name={activityIcons[item.kind]} size={17} />
          </span>
          <div>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <time dateTime={item.createdAt}>
              {formatInstant(item.createdAt)}
            </time>
          </div>
        </li>
      ))}
    </ol>
  );
}
