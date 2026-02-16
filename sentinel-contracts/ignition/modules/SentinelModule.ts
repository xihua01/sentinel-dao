import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// ⚠️ GANTI dengan alamat Rust dari Step 3
const RUST_ADDRESS = "0xa8e25e53a9ab58e52adc4bd7088a6692bb393211";

const SentinelFinalModule = buildModule("SentinelFinalModule", (m) => {
  const token = m.contract("SentinelRWA");
  m.call(token, "connectToRust", [RUST_ADDRESS]);
  return { token };
});

export default SentinelFinalModule;