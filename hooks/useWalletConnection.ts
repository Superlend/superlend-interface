// import { useEffect, useState } from 'react';
// import { useAppKit } from '@reown/appkit/react';
// import { useAccount, useConnect } from 'wagmi';
// import { metaMask } from 'wagmi/connectors';

// interface WindowWithEthereum extends Window {
//   ethereum?: any;
// }

// export const useWalletConnection = () => {
//   const [isMobileDevice, setIsMobileDevice] = useState(false);
//   const { open: openAuthModal, close: closeAuthModal } = useAppKit();
//   const { address, isConnecting, isDisconnected } = useAccount();
//   const { connectAsync } = useConnect();

//   useEffect(() => {
//     // Check if it's a mobile device
//     const checkMobile = () => {
//       const userAgent = navigator.userAgent || navigator.vendor;
//       return /android|mobi|tablet/i.test(userAgent.toLowerCase());
//     };

//     setIsMobileDevice(checkMobile());
//   }, []);

//   const handleConnect = async () => {
//     const { ethereum } = window as WindowWithEthereum;

//     if (isMobileDevice && ethereum?.isMetaMask) {
//       // If MetaMask is installed on mobile, use direct connection
//       try {
//         await connectAsync({ 
//           connector: metaMask()
//         });
//       } catch (error) {
//         console.error('MetaMask connection error:', error);
//         // Fallback to AppKit modal if direct connection fails
//         openAuthModal();
//       }
//     } else if (isMobileDevice && !ethereum?.isMetaMask) {
//       // If MetaMask is not installed on mobile, redirect to MetaMask
//       const dappUrl = `${window.location.href}`;
//       const mmDeepLink = `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`;
//       window.location.href = mmDeepLink;
//     } else {
//       // For desktop or other cases, use AppKit modal
//       openAuthModal();
//     }
//   };

//   return {
//     address,
//     isConnecting,
//     isDisconnected,
//     handleConnect,
//     isMobileDevice
//   };
// };