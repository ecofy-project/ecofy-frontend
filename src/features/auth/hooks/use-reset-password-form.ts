import { useRef, useState } from 'react';
import { useAppDependencies } from '../../../app/providers/AppDependenciesProvider';
import type { ApiError } from '../../../services/errors/api-error';
import {
  applyConfirmedErrorMessages,
  normalizeFormError,
  readFieldErrors,
} from './form-errors';

export function useResetPasswordForm(token: string | null) {
  const { authService } = useAppDependencies();
  const submissionLock = useRef(false);
  const [newPassword, setNewPasswordState] = useState('');
  const [fieldError, setFieldError] = useState<string>();
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  function setNewPassword(value: string) {
    setNewPasswordState(value);
    setFieldError(undefined);
    setError(null);
    setIsComplete(false);
  }

  async function submit(): Promise<boolean> {
    if (submissionLock.current || !token) {
      return false;
    }

    if (!newPassword) {
      setFieldError('Informe sua nova senha.');
      return false;
    }

    if (newPassword.length < 8 || newPassword.length > 100) {
      setFieldError('A senha deve ter entre 8 e 100 caracteres.');
      return false;
    }

    submissionLock.current = true;
    setFieldError(undefined);
    setError(null);
    setIsComplete(false);
    setIsLoading(true);

    try {
      await authService.confirmPasswordReset({ token, newPassword });
      setNewPasswordState('');
      setIsComplete(true);
      return true;
    } catch (caughtError) {
      const normalizedError = applyConfirmedErrorMessages(
        normalizeFormError(caughtError),
        {
          PASSWORD_POLICY_VIOLATION:
            'A nova senha não atende aos requisitos de segurança.',
          PASSWORD_RESET_TOKEN_ALREADY_USED:
            'Este link de redefinição já foi utilizado.',
          PASSWORD_RESET_TOKEN_EXPIRED:
            'Este link de redefinição expirou. Solicite um novo link.',
          PASSWORD_RESET_TOKEN_INVALID:
            'Este link de redefinição é inválido ou expirou.',
        },
      );
      setError(normalizedError);
      const backendFieldError = readFieldErrors(normalizedError, [
        'newPassword',
      ]).newPassword;
      setFieldError(
        normalizedError.code === 'PASSWORD_POLICY_VIOLATION'
          ? 'Escolha outra senha e tente novamente.'
          : backendFieldError,
      );
      return false;
    } finally {
      submissionLock.current = false;
      setIsLoading(false);
    }
  }

  return {
    error,
    fieldError,
    isComplete,
    isLoading,
    newPassword,
    setNewPassword,
    submit,
  };
}
