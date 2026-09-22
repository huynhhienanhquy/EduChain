import { useEffect, useState } from 'react';
import { BrowserProvider, formatEther } from 'ethers';

function shortAddress(value) {
  return value ? `${value.slice(0, 6)}...${value.slice(-4)}` : 'Chưa kết nối';
}

export default function WalletBadge({ fallbackAddress }) {
  const [address, setAddress] = useState(fallbackAddress || '');
  const [balance, setBalance] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (!window.ethereum) return;
        const provider = new BrowserProvider(window.ethereum);
        const accounts = await provider.send('eth_accounts', []);
        const selected = accounts?.[0] || fallbackAddress || '';
        if (!selected || !mounted) return;
        setAddress(selected);
        const value = await provider.getBalance(selected);
        if (mounted) setBalance(Number(formatEther(value)).toFixed(4));
      } catch (err) {
        console.error(err);
      }
    };
    load();
    return () => { mounted = false; };
  }, [fallbackAddress]);

  return (
    <div className="wallet-pill">
      <span className={`status-dot ${address ? 'online' : ''}`} />
      <div>
        <strong>{shortAddress(address)}</strong>
        <small>{balance ? `${balance} ETH · Ganache` : 'MetaMask local'}</small>
      </div>
    </div>
  );
}
