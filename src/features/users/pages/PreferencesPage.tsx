import { useEffect, useState, type FormEvent } from 'react';
import { useSession } from '../../../app/providers/SessionProvider';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  useToast,
} from '../../../components/ui';
import { AccountPageHeader } from '../components/AccountPageHeader';
import { PreferenceField } from '../components/PreferenceField';
import {
  AccountPageSkeleton,
  AccountResourceError,
  AccountSessionUnavailable,
} from '../components/AccountResourceState';
import { usePreferences } from '../hooks/use-preferences';
import type { UserPreferences } from '../types/user';

function preferencesAreEqual(
  left: UserPreferences,
  right: UserPreferences,
) {
  const leftEntries = Object.entries(left);
  const rightEntries = Object.entries(right);

  return (
    leftEntries.length === rightEntries.length &&
    leftEntries.every(([key, value]) => right[key] === value)
  );
}

export function PreferencesPage() {
  const { currentUser } = useSession();
  const preferences = usePreferences(currentUser?.id);
  const { showToast } = useToast();
  const [values, setValues] = useState<UserPreferences>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (preferences.data) {
      setValues({ ...preferences.data });
    }
  }, [preferences.data]);

  if (!currentUser) {
    return <AccountSessionUnavailable />;
  }

  if (preferences.isLoading && !preferences.data) {
    return <AccountPageSkeleton cards={2} />;
  }

  if (preferences.error && !preferences.data) {
    return <AccountResourceError error={preferences.error} onRetry={preferences.reload} />;
  }

  if (!preferences.data) {
    return <AccountResourceError error={{ message: 'As preferências não puderam ser carregadas.' }} onRetry={preferences.reload} />;
  }

  const entries = Object.entries(preferences.data);
  const isDirty = !preferencesAreEqual(values, preferences.data);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    const result = await preferences.updatePreferences(values);

    if (!result.ok) {
      setSubmitError(result.error.message);
      return;
    }

    showToast({
      title: 'Preferências atualizadas',
      message: 'As configurações da sua conta foram salvas.',
      tone: 'success',
    });
  };

  return (
    <div className="account-page">
      <AccountPageHeader
        description="Edite somente as preferências já disponibilizadas para sua conta."
        eyebrow="Experiência pessoal"
        title="Preferências"
      />

      {entries.length === 0 ? (
        <Card as="section" className="account-state-card">
          <EmptyState
            description="O serviço ainda não disponibilizou preferências para esta conta. Nenhuma configuração foi presumida."
            title="Nenhuma preferência disponível"
          />
        </Card>
      ) : (
        <form className="preferences-form" onSubmit={handleSubmit}>
          {submitError ? (
            <Alert title="Não foi possível salvar" tone="danger">
              {submitError}
            </Alert>
          ) : null}
          <div className="preferences-grid">
            {entries.map(([key]) => (
              <PreferenceField
                key={key}
                onChange={(value) =>
                    setValues((current) => ({
                      ...current,
                      [key]: value,
                    }))
                }
                preferenceKey={key}
                value={values[key] ?? ''}
              />
            ))}
          </div>
          <div className="preferences-form__actions">
            <Button
              disabled={!isDirty || preferences.isSaving}
              onClick={() => {
                setValues({ ...preferences.data });
                setSubmitError(null);
              }}
              variant="ghost"
            >
              Descartar alterações
            </Button>
            <Button disabled={!isDirty} loading={preferences.isSaving} type="submit">
              Salvar preferências
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
