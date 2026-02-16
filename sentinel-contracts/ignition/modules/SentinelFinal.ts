import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// ⚠️ GANTI dengan alamat Rust dari Step 3
const RUST_ADDRESS = "0x44640a5156cc25599bc2c16e57c04e053fdef519";

const SentinelFinalModule = buildModule("SentinelFinalModule", (m) => {
  const token = m.contract("SentinelRWA");
  m.call(token, "connect", [RUST_ADDRESS]);
  return { token };
});

export default SentinelFinalModule;