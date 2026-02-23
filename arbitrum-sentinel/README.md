# 🧠 Sentinel DAO: Rust Policy Engine (Arbitrum Stylus)

This directory contains the core execution logic of Sentinel DAO, written in Rust and deployed via Arbitrum Stylus. 

## 🏗️ Architecture & Logic
Rather than hardcoding compliance rules in Solidity, Sentinel uses this Rust program as an **Execution Firewall**. 
When a transaction is initiated in the ERC-20 Solidity contract, it calls the `checkTransfer` function here. 

This engine evaluates:
1. **Dynamic Risk Thresholds:** Is the system in 'Panic Mode' (Paused)?
2. **Whitelist Verification:** Is the sender/receiver an authorized contributor?
3. **Trust Score Evaluation:** Does the sender's current Trust Score meet the dynamic minimum threshold set by the Guardian?

## ⚡ Why Stylus?
Computing dynamic risk scores and iterating over compliance logic is heavily gas-intensive on standard EVM. By compiling this logic to WebAssembly (WASM) via Arbitrum Stylus, we achieve **10x-100x lower compute costs** while maintaining seamless composability with the Solidity frontend contract.

## 📂 Key Files
- `src/lib.rs`: The main contract logic. Notice the `check_transfer` execution block and the `set_policy_config` functions that handle state changes efficiently using Rust structs.
