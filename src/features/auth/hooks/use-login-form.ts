import { useRef, useState } from 'react';
import { useSession } from '../../../app/providers/SessionProvider';
import type { ApiError } from '../../../services/errors/api-error';
import {
  applyConfirmedErrorMessages,
  normalizeFormError,
  readFieldErrors,
} from './form-errors';

type LoginField = 'username' | 'password';
type LoginValues = Record<LoginField, string>;
type LoginFieldErrors = Partial<Record<LoginField, string>>;

const initialValues: LoginValues = {
  username: '',
  password: '',
};

function validate(values: LoginValues): LoginFieldErrors {
  const errors: LoginFieldErrors = {};

  if (!values.username.trim()) {
    errors.username = 'Informe seu e-mail ou usuário.';
  }

  if (!values.password) {
    errors.password = 'Informe sua senha.';
  }

  return errors;
}

function normalizeLoginError(error: ApiError): ApiError {
  if (error.status === 401 || error.code === 'INVALID_CREDENTIALS') {
    return {
      ...error,
      message: 'E-mail/usuário ou senha inválidos.',
    };
  }

  return applyConfirmedErrorMessages(error, {
    EMAIL_NOT_VERIFIED: 'Confirme seu e-mail antes de entrar.',
    USER_BLOCKED: 'Esta conta não está disponível para acesso.',
    USER_LOCKED: 'Esta conta está temporariamente bloqueada.',
  });
}

export function useLoginForm() {
  const { login } = useSession();
  const submissionLock = useRef(false);
  const [values, setValues] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function setValue(field: LoginField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setError(null);
  }

  async function submit(): Promise<boolean> {
    if (submissionLock.current) {
      return false;
    }

    const clientErrors = validate(values);
    setFieldErrors(clientErrors);
    setError(null);

    if (Object.keys(clientErrors).length > 0) {
      return false;
    }

    submissionLock.current = true;
    setIsLoading(true);

    try {
      await login({
        username: values.username.trim(),
        password: values.password,
      });
      return true;
    } catch (caughtError) {
      const normalizedError = normalizeLoginError(
        normalizeFormError(caughtError),
      );
      setError(normalizedError);
      setFieldErrors(
        readFieldErrors(normalizedError, ['username', 'password']),
      );
      return false;
    } finally {
      submissionLock.current = false;
      setIsLoading(false);
    }
  }

  return {
    error,
    fieldErrors,
    isLoading,
    setValue,
    submit,
    values,
  };
}
