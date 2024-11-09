import { useEffect, useState } from 'react';
import { useAppKit } from '@reown/appkit/react';
import { useAccount, useConnect } from 'wagmi';
import { metaMask } from 'wagmi/connectors';

interface WindowWithEthereum extends Window {
  ethereum?: any;
}

export const useWalletConnection = () => {
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const { open: openAuthModal, close: closeAuthModal } = useAppKit();
  const account = useAccount();
  const { connectAsync, status: connectStatus } = useConnect();

  // Monitor account changes
  useEffect(() => {
    if (account.address) {
      console.log('Account connected:', account.address);
    }
  }, [account.address]);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      return /android|mobi|tablet/i.test(userAgent.toLowerCase());
    };

    setIsMobileDevice(checkMobile());
  }, []);

  // Listen for MetaMask account changes
  useEffect(() => {
    const { ethereum } = window as WindowWithEthereum;
    if (ethereum?.on) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0 && accounts[0]) {
          console.log('Account changed:', accounts[0]);
        }
      };

      ethereum.on('accountsChanged', handleAccountsChanged);

      // Cleanup
      return () => {
        if (ethereum.removeListener) {
          ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
      };
    }
  }, []);

  const handleConnect = async () => {
    const { ethereum } = window as WindowWithEthereum;

    if (isMobileDevice && ethereum?.isMetaMask) {
      try {
        const result = await connectAsync({ 
          connector: metaMask()
        });
        console.log('Connection result:', result);
      } catch (error) {
        console.error('MetaMask connection error:', error);
        openAuthModal();
      }
    } else if (isMobileDevice && !ethereum?.isMetaMask) {
      const mmDeepLink = `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`;
      window.location.href = mmDeepLink;
    } else {
      openAuthModal();
    }
  };

  return {
    address: account.address,
    isConnecting: connectStatus === 'pending',
    isDisconnected: account.status === 'disconnected',
    handleConnect,
    isMobileDevice,
    connectionStatus: account.status
  };
};