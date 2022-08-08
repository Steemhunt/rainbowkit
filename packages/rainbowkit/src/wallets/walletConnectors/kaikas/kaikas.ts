/* eslint-disable sort-keys-fix/sort-keys-fix */
// import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { Chain } from '../../../components/RainbowKitProvider/RainbowKitChainContext';
import { KaikasConnector } from '../../../connectors/KaikasConnector';
import { Wallet } from '../../Wallet';

export interface KaikasOptions {
  chains: Chain[];
  shimDisconnect?: boolean;
}

export function isKaikas(klaytn: NonNullable<typeof window['klaytn']>) {
  // Logic borrowed from wagmi's MetaMaskConnector
  // https://github.com/tmm/wagmi/blob/main/packages/core/src/connectors/metaMask.ts
  const isKaikas = Boolean(klaytn.isKaikas);

  if (!isKaikas) {
    return false;
  }

  return true;
}

export const kaikas = ({ chains, shimDisconnect }: KaikasOptions): Wallet => {
  const isKaikasInjected =
    typeof window !== 'undefined' &&
    typeof window.klaytn !== 'undefined' &&
    isKaikas(window.klaytn);

  return {
    id: 'kaikas',
    name: 'Kaikas',
    iconUrl: async () => (await import('./kaikas.svg')).default,
    iconBackground: '#000',
    installed: isKaikasInjected,
    downloadUrls: {
      browserExtension:
        'https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en',
    },
    createConnector: () => {
      const connector = new KaikasConnector({
        chains,
        options: { shimDisconnect },
      });

      return {
        connector,
      };
    },
  };
};
