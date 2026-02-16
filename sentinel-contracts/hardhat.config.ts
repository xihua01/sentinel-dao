import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { defineConfig } from "hardhat/config";
import "dotenv/config";

const RPC_URL = process.env.ARBITRUM_SEPOLIA_RPC_URL || "";
const PRIVATE_KEY = process.env.ARBITRUM_SEPOLIA_PRIVATE_KEY || "";

if (!PRIVATE_KEY) {
  console.warn("⚠️ ARBITRUM_SEPOLIA_PRIVATE_KEY not found in .env.");
}

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: { version: "0.8.28" },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: { enabled: true, runs: 200 },
        },
      },
    },
  },
  networks: {
    arbitrumSepolia: {
      type: "http",
      url: RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      gasPrice: 30000000000,
    },
  },
});