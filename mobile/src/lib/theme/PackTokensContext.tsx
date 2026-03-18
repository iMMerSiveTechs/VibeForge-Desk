import React, { useContext } from 'react';
import useDeskStore from '../state/store';
import { getPackTokens, DEFAULT_PACK_TOKENS, type PackTokens } from './designPacks';

const PackTokensContext = React.createContext<PackTokens>(DEFAULT_PACK_TOKENS);

export function PackTokensProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const packId = useDeskStore((s) => s.currentColorPack);
  const tokens = getPackTokens(packId);
  return <PackTokensContext.Provider value={tokens}>{children}</PackTokensContext.Provider>;
}

/**
 * Returns the resolved UI tokens for the currently active design pack.
 * Components use these to drive card radius, shadow, border, overlays, etc.
 */
export function usePackTokens(): PackTokens {
  return useContext(PackTokensContext);
}
