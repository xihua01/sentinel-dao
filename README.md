# 🛡️ Sentinel DAO: Treasury Firewall

**Sentinel DAO** is an intelligent security layer for DAO treasuries built on **Arbitrum Stylus**. Unlike standard multisigs that are static, Sentinel enforces dynamic, logic-based compliance policies executing at native speeds using Rust.

## 🚀 The Problem
DAO treasuries lose millions due to compromised private keys. If a signer is phished, standard multisigs (like Gnosis Safe) cannot detect the malicious intent—they only check for valid signatures.

## 💡 The Solution
Sentinel acts as an **On-Chain Firewall**. It sits between the treasury and the blockchain execution layer. Even if a hacker has a valid private key, Sentinel's Rust Policy Engine will **block the transaction** if:
1. The user's **Trust Score** has dropped (Panic Mode).
2. The user is not in the **Authorized Spender** whitelist.
3. The transaction violates dynamic spending limits.

## 🏗️ Tech Stack
- **Policy Engine:** Rust (Arbitrum Stylus) for high-performance risk computation.
- **Smart Contracts:** Solidity (Interface Layer & Access Control).
- **Frontend:** Next.js, Tailwind CSS, RainbowKit, Wagmi.
- **Chain:** Arbitrum Sepolia.

## 📦 How to Run

### 1. Contracts (Rust & Solidity)
```bash
cd sentinel-contracts
cargo stylus deploy ...
npx hardhat run scripts/manual-deploy.ts
```
### 2. Dashboard (Frontend)
```bash
cd sentinel-dashboard
npm install
npm run dev
```
