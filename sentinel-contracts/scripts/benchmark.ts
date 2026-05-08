// scripts/benchmark-sentinel.ts
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";
import SentinelArtifact from "../artifacts/contracts/SentinelToken.sol/SentinelRWA.json";
import SentinelLogicArtifact from "../artifacts/contracts/SentinelLogic.sol/SentinelLogic.json";
import * as dotenv from "dotenv";

dotenv.config();

const RUST_ADDRESS = "0x6ae7760270787324f187111bfc6096d0094778a3";
const ITERATIONS = 5;

interface BenchmarkResult {
  operation: string;
  avgSolid: bigint;
  avgHybrid: bigint;
  savings: string;
}

const results: BenchmarkResult[] = [];

async function measureGas(
  name: string,
  operation: () => Promise<`0x${string}`>,
  publicClient: any,
  mode: string
): Promise<bigint> {
  let totalGas = 0n;
  let successCount = 0n;

  process.stdout.write(`   Mengukur [${mode}] ${name}... `);

  for (let i = 0; i < ITERATIONS; i++) {
    try {
      const hash = await operation();
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      totalGas += receipt.gasUsed;
      successCount++;
    } catch (err: any) {
      console.error(`Error pada ${mode} [${name}]:`, err.shortMessage || err.message);
      // Abaikan error iterasi agar proses lanjut
    }
  }

  if (successCount === 0n) return 0n;
  const avg = totalGas / successCount;
  console.log(`Rata-rata: ${avg} gas`);
  return avg;
}

async function main() {
  console.log("\n========================================================");
  console.log(" 🚀 SENTINEL DAO: SOLIDITY VS HYBRID (STYLUS) BENCHMARK");
  console.log("========================================================\n");

  const privateKey = process.env.PRIVATE_KEY || process.env.ARBITRUM_SEPOLIA_PRIVATE_KEY;
  if (!privateKey) throw new Error("Private Key tidak ditemukan di .env");

  const account = privateKeyToAccount(`0x${privateKey.replace('0x', '')}` as `0x${string}`);
  const walletClient = createWalletClient({ account, chain: arbitrumSepolia, transport: http() });
  const publicClient = createPublicClient({ chain: arbitrumSepolia, transport: http() });

  const testUser = privateKeyToAccount(`0x${'A'.repeat(64)}` as `0x${string}`);

  // 1. DEPLOYMENT
  console.log("📦 Deploying Kontrak Full Solidity...");
  const hashSolid = await walletClient.deployContract({
    abi: SentinelArtifact.abi,
    bytecode: SentinelArtifact.bytecode as `0x${string}`,
    args: [],
  });
  const receiptSolid = await publicClient.waitForTransactionReceipt({ hash: hashSolid });
  const tokenSolid = receiptSolid.contractAddress!;

  console.log("   --> Deploying SentinelLogic (Solidity Policy Engine)...");
  const hashLogic = await walletClient.deployContract({
    abi: SentinelLogicArtifact.abi,
    bytecode: SentinelLogicArtifact.bytecode as `0x${string}`,
    args: [],
  });
  const receiptLogic = await publicClient.waitForTransactionReceipt({ hash: hashLogic });
  const logicSolid = receiptLogic.contractAddress!;

  console.log("   --> Menghubungkan Token ke Policy Engine...");
  const hashConnectSolid = await walletClient.writeContract({
    address: tokenSolid,
    abi: SentinelArtifact.abi,
    functionName: 'connectToRust',
    args: [logicSolid],
  });
  await publicClient.waitForTransactionReceipt({ hash: hashConnectSolid });


  console.log("📦 Deploying Kontrak Hybrid (Vault Solidity + Policy Rust)...");
  const hashHybrid = await walletClient.deployContract({
    abi: SentinelArtifact.abi,
    bytecode: SentinelArtifact.bytecode as `0x${string}`,
    args: [],
  });
  const receiptHybrid = await publicClient.waitForTransactionReceipt({ hash: hashHybrid });
  const tokenHybrid = receiptHybrid.contractAddress!;

  // Set alamat Stylus ke kontrak Hybrid
  if (RUST_ADDRESS) {
    const connectHashHybrid = await walletClient.writeContract({
      address: tokenHybrid,
      abi: SentinelArtifact.abi,
      functionName: 'connectToRust',
      args: [RUST_ADDRESS],
    });
    await publicClient.waitForTransactionReceipt({ hash: connectHashHybrid });
  } else {
    console.log("⚠️ PERINGATAN: STYLUS_ADDRESS di .env kosong!");
  }

  // 2. BENCHMARKING OPERATIONS
  console.log("\n⏳ Memulai Pengujian (Iterasi: " + ITERATIONS + "x per fungsi)...\n");

  const operationsToTest = [
    {
      name: "Update Whitelist",
      fn: 'whitelistUser',
      args: [testUser.address]
    },
    {
      name: "Kalkulasi Trust Score",
      fn: 'updateUserScore',
      args: [testUser.address, 90]
    },
    {
      name: "Eksekusi Transfer (Policy Check)",
      fn: 'transfer',
      args: [testUser.address, 1000n]
    }
  ];

  for (const op of operationsToTest) {
    const avgSolid = await measureGas(op.name, () => walletClient.writeContract({
      address: tokenSolid,
      abi: SentinelArtifact.abi,
      functionName: op.fn,
      args: op.args
    }), publicClient, "SOLID");

    const avgHybrid = await measureGas(op.name, () => walletClient.writeContract({
      address: tokenHybrid,
      abi: SentinelArtifact.abi,
      functionName: op.fn,
      args: op.args
    }), publicClient, "HYBRID");

    let savings = "N/A";
    if (avgSolid > 0n && avgHybrid > 0n) {
      const diff = Number(avgSolid) - Number(avgHybrid);
      savings = ((diff / Number(avgSolid)) * 100).toFixed(2) + "%";
    }

    results.push({ operation: op.name, avgSolid, avgHybrid, savings });
  }

  // 3. CETAK TABEL HASIL
  console.log("\n========================================================");
  console.log(" 📊 RINGKASAN HASIL BENCHMARK");
  console.log("========================================================");
  console.table(
    results.map(r => ({
      "Fungsi Policy": r.operation,
      "Gas Solidity": r.avgSolid.toString(),
      "Gas Stylus (Rust)": r.avgHybrid.toString(),
      "Penghematan (%)": r.savings
    }))
  );
  console.log("========================================================\n");
}

main().catch(console.error);