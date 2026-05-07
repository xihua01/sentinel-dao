# 🏛️ Sentinel DAO: State & Access Layer (Solidity)

This directory contains the EVM-facing smart contracts. This layer acts as the standard interface for users, wallets, and other DeFi protocols, while delegating heavy security computations to the Rust Stylus engine.

## 🏗️ Architecture & Logic
The main contract extends standard OpenZeppelin implementations (`ERC20`, `AccessControl`) to maintain compatibility with the broader Web3 ecosystem.

**How it works:**
1. **Separation of Duties:** We use `AccessControl` to define a specific `COMPLIANCE_ROLE` (The Guardians). Only Guardians can update policies.
2. **The Intercept:** The standard ERC-20 `_update` function is overridden. Before any balance is transferred, it queries the Rust Stylus contract (`ISentinelStylus.checkTransfer`). 
3. **Revert Semantics:** If the Rust engine returns `false` (e.g., user is frozen or score is too low), the Solidity contract immediately reverts the transaction with `"Sentinel: Transfer Denied"`.
