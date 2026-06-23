import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// ⚠️ GANTI dengan alamat Rust dari Step 3
const RUST_ADDRESS = "0x5ac887736a10b6f63a5ad946c2c7d787f740cb3c";

const SentinelFinalModule = buildModule("SentinelFinalModule", (m) => {
  const token = m.contract("SentinelRWA");
  m.call(token, "connectToRust", [RUST_ADDRESS]);
  return { token };
});

export default SentinelFinalModule;