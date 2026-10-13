import { createContext } from "react";

export type ActionCounts = Readonly<Record<string, number>>;

export const ActionCountsContext = createContext<ActionCounts>({});
