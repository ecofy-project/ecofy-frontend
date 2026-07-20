import { useRef, useState } from 'react';
import { useAppDependencies } from '../../../app/providers/AppDependenciesProvider';
import type { ApiError } from '../../../services/errors/api-error';
import {
  applyConfirmedErrorMessages,
  normalizeFormError,
  readFieldErrors,
} from './form-errors';

type RegisterField = 'firstName' | 'lastName' | 'email' | 'password';
type RegisterValues = Record<RegisterField, string>;
type RegisterFieldErrors = Partial<Record<RegisterField, string>>;

const initialValues: RegisterValues = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values: RegisterValues): RegisterFieldErrors {
  const errors: RegisterFieldErrors = {};

  if (!values.firstName.trim()) {
    errors.firstName = 'Informe seu nome.';
  }

  if (!values.lastName.trim()) {
    errors.lastName = 'Informe seu sobrenome.';
  }

  if (!values.email.trim()) {
    errors.email = 'Informe seu e-mail.';
  } else if (!emailPattern.test(values.email.trim())) {
    errors.email = 'Informe um e-mail válido.';
  }

  if (!values.password) {
    errors.password = 'Crie uma senha.';
  } else if (values.password.length < 8 || values.password.length > 100) {
    errors.password = 'A senha deve ter entre 8 e 100 caracteres.';
  }

  return errors;
}

export function useRegisterForm() {
  const { authService } = useAppDependencies();
  const submissionLock = useRef(false);
  const [values, setValues] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  function setValue(field: RegisterField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setError(null);
    setIsComplete(false);
  }

  async function submit(): Promise<boolean> {
    if (submissionLock.current) {
      return false;
    }

    const clientErrors = validate(values);
    setFieldErrors(clientErrors);
    setError(null);
    setIsComplete(false);

    if (Object.keys(clientErrors).length > 0) {
      return false;
    }

    submissionLock.current = true;
    setIsLoading(true);

    try {
      await authService.register({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      setValues((current) => ({ ...current, password: '' }));
      setIsComplete(true);
      return true;
    } catch (caughtError) {
      const normalizedError = applyConfirmedErrorMessages(
        normalizeFormError(caughtError),
        {
          EMAIL_ALREADY_REGISTERED:
            'Já existe uma conta associada a este e-mail.',
        },
      );
      setError(normalizedError);
      const backendFieldErrors = readFieldErrors(normalizedError, [
          'firstName',
          'lastName',
          'email',
          'password',
        ]);
      setFieldErrors({
        ...backendFieldErrors,
        ...(normalizedError.code === 'EMAIL_ALREADY_REGISTERED'
          ? { email: 'Use outro e-mail ou volte para entrar.' }
          : {}),
      });
      return false;
    } finally {
      submissionLock.current = false;
      setIsLoading(false);
    }
  }

  return {
    error,
    fieldErrors,
    isComplete,
    isLoading,
    setValue,
    submit,
    values,
  };
}
