import { useCallback, useState } from "react";

import { toAppError, type AppError } from "@/lib";

export interface AsyncActionState<TInput, TResult> {
  readonly isPending: boolean;
  readonly error: AppError | undefined;
  readonly result: TResult | undefined;
  /** Field-level messages from a `validation` error, ready for form fields. */
  readonly fieldErrors: Readonly<Record<string, string>> | undefined;
  run: (input: TInput) => Promise<TResult | undefined>;
  reset: () => void;
}

/**
 * Write-side counterpart to `useAsyncData`: runs one command, tracks pending and
 * error state, and surfaces field errors so forms can render them without
 * knowing about `AppError`.
 *
 * It resolves to `undefined` on failure rather than throwing, so callers can
 * write `const saved = await run(input); if (!saved) return;`.
 */
export function useAsyncAction<TInput, TResult>(
  action: (input: TInput) => Promise<TResult>,
  options: { onSuccess?: (result: TResult) => void } = {},
): AsyncActionState<TInput, TResult> {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<AppError>();
  const [result, setResult] = useState<TResult>();

  const { onSuccess } = options;

  const run = useCallback(
    async (input: TInput) => {
      setIsPending(true);
      setError(undefined);
      try {
        const value = await action(input);
        setResult(value);
        onSuccess?.(value);
        return value;
      } catch (cause) {
        setError(toAppError(cause));
        return undefined;
      } finally {
        setIsPending(false);
      }
    },
    [action, onSuccess],
  );

  const reset = useCallback(() => {
    setError(undefined);
    setResult(undefined);
  }, []);

  return { isPending, error, result, fieldErrors: error?.fieldErrors, run, reset };
}
