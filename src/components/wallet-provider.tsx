import { useState, type ReactNode } from "react";
import { NetworkId, WalletId, WalletManager, WalletProvider } from "@txnlab/use-wallet-react";

/**
 * Algorand wallet context. The manager is created lazily inside the component
 * so nothing wallet-related is constructed during SSR.
 *
 * @param props - Component props.
 * @param props.children - Subtree that may use wallet hooks.
 * @returns The wallet provider tree.
 */
export function AlgorandWalletProvider({ children }: { children: ReactNode }) {
  const [manager] = useState(
    () =>
      new WalletManager({
        wallets: [WalletId.PERA, WalletId.DEFLY, WalletId.LUTE],
        defaultNetwork: NetworkId.TESTNET,
      }),
  );

  return <WalletProvider manager={manager}>{children}</WalletProvider>;
}
