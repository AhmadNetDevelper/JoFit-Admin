import { createContext, useContext } from "react";

export interface NoticeApi {
  success(message: string): void;
  error(message: string): void;
}

export const NoticeContext = createContext<NoticeApi | null>(null);

/** Short confirmations — "Saved", "Deleted" — shown by `NoticeProvider`. */
export function useNotice(): NoticeApi {
  const api = useContext(NoticeContext);
  if (!api) throw new Error("useNotice must be used inside <NoticeProvider>.");
  return api;
}
