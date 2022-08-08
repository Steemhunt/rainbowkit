import { normalizeChainId } from '@wagmi/core';
import { Signer } from 'ethers';
import { getAddress } from 'ethers/lib/utils';
import {
  Connector,
  ConnectorNotFoundError,
  ProviderRpcError,
  ResourceUnavailableError,
  RpcError,
  UserRejectedRequestError,
} from 'wagmi';

export class KaikasConnector extends Connector {
  readonly id = 'kaikas';
  readonly name = 'Kaikas Wallet';
  readonly ready = true;

  #provider?: Window['klaytn'];
  #switchingChains?: boolean;

  async getProvider() {
    if (!this.#provider) {
      this.#provider = window.klaytn;
    }
    return this.#provider;
  }

  async connect() {
    try {
      const provider = await this.getProvider();
      if (!provider) throw new ConnectorNotFoundError();

      if (provider.on) {
        provider.on('accountsChanged', this.onAccountsChanged);
        provider.on('chainChanged', this.onChainChanged);
        provider.on('disconnect', this.onDisconnect);
      }

      const accounts = await provider.enable();
      const chainId = provider.networkVersion;

      let unsupported = this.isChainUnsupported(chainId);

      return {
        account: accounts[0],
        chain: { id: chainId, unsupported },
        provider,
      };
    } catch (error) {
      if (this.isUserRejectedRequestError(error))
        throw new UserRejectedRequestError(error);
      if ((error as RpcError).code === -32002)
        throw new ResourceUnavailableError(error);
      throw error;
    }
  }

  async disconnect() {
    const provider = await this.getProvider();
    if (!provider?.removeListener) return;

    provider.removeListener('accountsChanged', this.onAccountsChanged);
    provider.removeListener('chainChanged', this.onChainChanged);
    provider.removeListener('disconnect', this.onDisconnect);
  }

  protected onAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) this.emit('disconnect');
    else this.emit('change', { account: getAddress(accounts[0] as string) });
  };

  protected onChainChanged = (chainId: number | string) => {
    const id = normalizeChainId(chainId);
    const unsupported = this.isChainUnsupported(id);
    this.emit('change', { chain: { id, unsupported } });
  };

  protected onDisconnect = () => {
    // We need this as MetaMask can emit the "disconnect" event
    // upon switching chains. This workaround ensures that the
    // user currently isn't in the process of switching chains.
    if (this.options?.shimChainChangedDisconnect && this.#switchingChains) {
      this.#switchingChains = false;
      return;
    }

    this.emit('disconnect');
  };

  getAccount(): Promise<string> {
    throw new Error('Method not implemented.');
  }
  getChainId(): Promise<number> {
    throw new Error('Method not implemented.');
  }
  getSigner(): Promise<Signer> {
    throw new Error('Method not implemented.');
  }
  isAuthorized(): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  protected isUserRejectedRequestError(error: unknown) {
    return (error as ProviderRpcError).code === 4001;
  }
}
