import { useState } from 'react';
import { Alert, Button, Card } from '../../../components/ui';
import { useInsightsRebuild } from '../hooks/use-insights-rebuild';

/**
 * Ação avançada de reconstrução.
 *
 * Só é renderizada quando a origem de dados publica reconstrução. Oferece
 * exclusivamente o modo `MISSING` — `FORCE` não é suportado pelo backend — e
 * exige confirmação explícita antes do envio, porque o processamento pode
 * ocorrer em segundo plano.
 */
export function InsightsRebuildPanel({ onFinished }: { onFinished: () => void }) {
  const rebuild = useInsightsRebuild(onFinished);
  const [isConfirming, setIsConfirming] = useState(false);

  async function handleConfirm() {
    setIsConfirming(false);
    await rebuild.requestRebuild();
  }

  return (
    <Card as="section" className="insights-rebuild-card">
      <div>
        <span className="insight-eyebrow">MAIS OPÇÕES</span>
        <h2>Reconstruir análises ausentes</h2>
        <p>
          Solicita ao serviço o reprocessamento apenas dos períodos que ainda não
          possuem análises registradas.
        </p>
      </div>

      {rebuild.error ? (
        <Alert title="Não foi possível solicitar a reconstrução" tone="danger">
          {rebuild.error.message}
        </Alert>
      ) : null}

      {rebuild.isProcessing ? (
        <Alert title="Reconstrução em andamento" tone="info">
          O processamento acontece em segundo plano. Esta página é atualizada
          automaticamente quando ele termina.
        </Alert>
      ) : null}

      {rebuild.run && !rebuild.isProcessing ? (
        <Alert
          onDismiss={rebuild.dismiss}
          title="Reconstrução concluída"
          tone="success"
        >
          As análises ausentes foram reprocessadas.
        </Alert>
      ) : null}

      {rebuild.pollingExhausted ? (
        <Alert title="Acompanhamento encerrado" tone="info">
          O processamento continua no serviço. Recarregue a página mais tarde
          para consultar o resultado.
        </Alert>
      ) : null}

      {isConfirming ? (
        <div className="insights-rebuild-card__confirm" role="group">
          <p>
            A reconstrução pode ser processada em segundo plano e levar alguns
            minutos. Deseja continuar?
          </p>
          <div className="insights-rebuild-card__actions">
            <Button onClick={() => setIsConfirming(false)} variant="ghost">
              Cancelar
            </Button>
            <Button loading={rebuild.isRequesting} onClick={handleConfirm}>
              Confirmar reconstrução
            </Button>
          </div>
        </div>
      ) : (
        <div className="insights-rebuild-card__actions">
          <Button
            disabled={rebuild.isProcessing}
            onClick={() => setIsConfirming(true)}
            variant="outline"
          >
            Reconstruir análises ausentes
          </Button>
        </div>
      )}
    </Card>
  );
}
