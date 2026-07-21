import { useEffect, useState, type FormEvent } from 'react';
import { useSession } from '../../../app/providers/SessionProvider';
import {
  Alert,
  Button,
  Card,
  Icon,
  Input,
  useToast,
} from '../../../components/ui';
import { AccountPageHeader } from '../components/AccountPageHeader';
import {
  AccountPageSkeleton,
  AccountResourceError,
  AccountSessionUnavailable,
} from '../components/AccountResourceState';
import { readUserFieldErrors } from '../hooks/user-errors';
import { useProfile } from '../hooks/use-profile';
import type { UserProfile } from '../types/user';

type ProfileField = 'fullName' | 'email' | 'phone';
type ProfileFieldErrors = Partial<Record<ProfileField, string>>;

const profileFields: readonly ProfileField[] = [
  'fullName',
  'email',
  'phone',
];

function getInitials(name: string, email: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length) {
    return words
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join('');
  }

  return email.slice(0, 2).toUpperCase() || 'EF';
}

function validateProfile(profile: UserProfile): ProfileFieldErrors {
  const errors: ProfileFieldErrors = {};

  if (!profile.fullName.trim()) {
    errors.fullName = 'Informe seu nome completo.';
  }

  if (!profile.email.trim()) {
    errors.email = 'Informe seu e-mail.';
  } else if (!/^\S+@\S+\.\S+$/.test(profile.email)) {
    errors.email = 'Informe um e-mail válido.';
  }

  return errors;
}

export function ProfilePage() {
  const { currentUser, updateCurrentUserDetails } = useSession();
  const profile = useProfile(currentUser?.id);
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [values, setValues] = useState<UserProfile>({
    fullName: '',
    email: '',
    phone: '',
  });
  const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (profile.data && !isEditing) {
      setValues(profile.data);
    }
  }, [isEditing, profile.data]);

  if (!currentUser) {
    return <AccountSessionUnavailable />;
  }

  if (profile.isLoading && !profile.data) {
    return <AccountPageSkeleton />;
  }

  if (profile.error && !profile.data) {
    return <AccountResourceError error={profile.error} onRetry={profile.reload} />;
  }

  if (!profile.data) {
    return <AccountResourceError error={{ message: 'O perfil não pôde ser carregado.' }} onRetry={profile.reload} />;
  }

  const beginEditing = () => {
    setValues(profile.data ?? values);
    setFieldErrors({});
    setSubmitError(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setValues(profile.data ?? values);
    setFieldErrors({});
    setSubmitError(null);
    setIsEditing(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedValues: UserProfile = {
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
    };
    const validationErrors = validateProfile(normalizedValues);

    if (Object.keys(validationErrors).length) {
      setFieldErrors(validationErrors);
      setSubmitError('Revise os campos indicados antes de salvar.');
      return;
    }

    setFieldErrors({});
    setSubmitError(null);
    const result = await profile.updateProfile(normalizedValues);

    if (!result.ok) {
      setFieldErrors(readUserFieldErrors(result.error, profileFields));
      setSubmitError(result.error.message);
      return;
    }

    updateCurrentUserDetails(result.data);
    setIsEditing(false);
    showToast({
      title: 'Perfil atualizado',
      message: 'Seus dados foram salvos com sucesso.',
      tone: 'success',
    });
  };

  return (
    <div className="account-page">
      <AccountPageHeader
        action={
          !isEditing ? (
            <Button leadingIcon="profile" onClick={beginEditing} variant="outline">
              Editar perfil
            </Button>
          ) : null
        }
        description="Mantenha seus dados de contato atualizados para uma experiência consistente na sua conta."
        eyebrow="Identidade da conta"
        title="Seu perfil"
      />

      <Card as="section" className="profile-card">
        <div className="profile-card__identity">
          <span aria-hidden="true" className="profile-card__avatar">
            {getInitials(profile.data.fullName, profile.data.email)}
          </span>
          <div>
            <span className="text-caption">CONTA ECOFY</span>
            <h2>{profile.data.fullName || 'Nome não informado'}</h2>
            <p>{profile.data.email || 'E-mail não informado'}</p>
          </div>
        </div>

        {isEditing ? (
          <form className="account-form" noValidate onSubmit={handleSubmit}>
            {submitError ? (
              <Alert title="Não foi possível salvar" tone="danger">
                {submitError}
              </Alert>
            ) : null}
            <Input
              autoComplete="name"
              error={fieldErrors.fullName}
              label="Nome completo"
              onChange={(event) => {
                const fullName = event.currentTarget.value;
                setValues((current) => ({
                  ...current,
                  fullName,
                }));
              }}
              value={values.fullName}
            />
            <Input
              autoComplete="email"
              error={fieldErrors.email}
              label="E-mail"
              onChange={(event) => {
                const email = event.currentTarget.value;
                setValues((current) => ({
                  ...current,
                  email,
                }));
              }}
              type="email"
              value={values.email}
            />
            <Input
              autoComplete="tel"
              error={fieldErrors.phone}
              label="Telefone"
              onChange={(event) => {
                const phone = event.currentTarget.value;
                setValues((current) => ({
                  ...current,
                  phone,
                }));
              }}
              optional
              type="tel"
              value={values.phone}
            />
            <div className="account-form__actions">
              <Button disabled={profile.isSaving} onClick={cancelEditing} variant="ghost">
                Cancelar
              </Button>
              <Button loading={profile.isSaving} type="submit">
                Salvar alterações
              </Button>
            </div>
          </form>
        ) : (
          <dl className="profile-details">
            <div>
              <dt><Icon name="profile" size={17} />Nome completo</dt>
              <dd>{profile.data.fullName || 'Não informado'}</dd>
            </div>
            <div>
              <dt><Icon name="notifications" size={17} />E-mail</dt>
              <dd>{profile.data.email || 'Não informado'}</dd>
            </div>
            <div>
              <dt><Icon name="connections" size={17} />Telefone</dt>
              <dd>{profile.data.phone || 'Não informado'}</dd>
            </div>
          </dl>
        )}
      </Card>
    </div>
  );
}
