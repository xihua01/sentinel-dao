import { http, createConfig } from 'wagmi';
import { arbitrumSepolia } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

const projectId = 'SENTINEL_HACKATHON_2026';

export const config = getDefaultConfig({
  appName: 'Sentinel RWA Dashboard',
  projectId: projectId,
  chains: [arbitrumSepolia],
  transports: {
    [arbitrumSepolia.id]: http('https://arb-sepolia.g.alchemy.com/v2/AO7SS0jt3bibaQDVmnx8amQnamFsM6lZ'),
  },
  ssr: true, 
});