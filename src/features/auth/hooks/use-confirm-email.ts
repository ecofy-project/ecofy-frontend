import { useRef, useState } from 'react';
import { useAppDependencies } from '../../../app/providers/AppDependenciesProvider';
import type { ApiError } from '../../../services/errors/api-error';
import {
  applyConfirmedErrorMessages,
  normalizeFormError,
} from './form-errors';

export function useConfirmEmail(token: string | null) {
  const { authService } = useAppDependencies();
  const submissionLock = useRef(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  async function submit(): Promise<boolean> {
    if (submissionLock.current || !token) {
      return false;
    }

    submissionLock.current = true;
    setError(null);
    setIsLoading(true);

    try {
      await authService.confirmEmail({ token });
      setIsComplete(true);
      return true;
    } catch (caughtError) {
      setError(
        applyConfirmedErrorMessages(normalizeFormError(caughtError), {
          EMAIL_ALREADY_CONFIRMED: 'Este e-mail já foi confirmado.',
          EMAIL_CONFIRMATION_TOKEN_EXPIRED:
            'Este link de confirmação expirou. Solicite um novo link.',
          EMAIL_CONFIRMATION_TOKEN_INVALID:
            'Este link de confirmação é inválido ou expirou.',
        }),
      );
      return false;
    } finally {
      submissionLock.current = false;
      setIsLoading(false);
    }
  }

  return {
    error,
    isComplete,
    isLoading,
    submit,
  };
}
