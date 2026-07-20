import { useRef, useState } from 'react';
import { useAppDependencies } from '../../../app/providers/AppDependenciesProvider';
import type { ApiError } from '../../../services/errors/api-error';
import { normalizeFormError, readFieldErrors } from './form-errors';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useForgotPasswordForm() {
  const { authService } = useAppDependencies();
  const submissionLock = useRef(false);
  const [email, setEmailState] = useState('');
  const [fieldError, setFieldError] = useState<string>();
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  function setEmail(value: string) {
    setEmailState(value);
    setFieldError(undefined);
    setError(null);
    setIsComplete(false);
  }

  async function submit(): Promise<boolean> {
    if (submissionLock.current) {
      return false;
    }

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setFieldError('Informe seu e-mail.');
      return false;
    }

    if (!emailPattern.test(normalizedEmail)) {
      setFieldError('Informe um e-mail válido.');
      return false;
    }

    submissionLock.current = true;
    setFieldError(undefined);
    setError(null);
    setIsComplete(false);
    setIsLoading(true);

    try {
      await authService.requestPasswordReset({ email: normalizedEmail });
      setIsComplete(true);
      return true;
    } catch (caughtError) {
      const normalizedError = normalizeFormError(caughtError);
      setError(normalizedError);
      setFieldError(readFieldErrors(normalizedError, ['email']).email);
      return false;
    } finally {
      submissionLock.current = false;
      setIsLoading(false);
    }
  }

  return {
    email,
    error,
    fieldError,
    isComplete,
    isLoading,
    setEmail,
    submit,
  };
}
