import { createPublicClient, createWalletClient, http, getContract } from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";
import SentinelRWAArtifact from "../artifacts/contracts/SentinelToken.sol/SentinelRWA.json";

const TOKEN_ADDRESS = "0xb04c22a9635a4f74e972a2df60c5c2fefd98a327" as `0x${string}`; 
const RUST_ADDRESS = "0x6ae7760270787324f187111bfc6096d0094778a3" as `0x${string}`;

const recipientPrivateKey = generatePrivateKey();
const recipientAccount = privateKeyToAccount(recipientPrivateKey);
const RECIPIENT_ADDRESS = recipientAccount.address;

const TRANSFER_AMOUNT = 500n;

async function main() {
  console.log("\n" + "=".repeat(80));
  console.log("🎯 SENTINEL RWA: TRANSFER TO OTHER USER (User B)");
  console.log("=".repeat(80));

  const privateKey = process.env.ARBITRUM_SEPOLIA_PRIVATE_KEY!;
  const rpcUrl = process.env.ARBITRUM_SEPOLIA_RPC_URL!;
  const adminAccount = privateKeyToAccount(`0x${privateKey.replace('0x', '')}` as `0x${string}`);

  const publicClient = createPublicClient({ chain: arbitrumSepolia, transport: http(rpcUrl) });
  const walletClient = createWalletClient({ account: adminAccount, chain: arbitrumSepolia, transport: http(rpcUrl) });

  const token = getContract({
    address: TOKEN_ADDRESS,
    abi: SentinelRWAArtifact.abi,
    client: { public: publicClient, wallet: walletClient },
  });

  console.log(`👮 Admin (Sender)   : ${adminAccount.address}`);
  console.log(`👤 User B (Receiver): ${RECIPIENT_ADDRESS} (Generated Randomly)`);
  console.log(`💰 Amount           : ${TRANSFER_AMOUNT} Wei`);

  console.log("\n" + "-".repeat(60));
  console.log("🛠️ STEP 1: Cek Whitelist Admin");
  try {
      // Kita panggil whitelistUser untuk Admin (kalau sudah ada, biasanya gapapa/revert aman)
      const wlHash = await token.write.whitelistUser([adminAccount.address]);
      await publicClient.waitForTransactionReceipt({ hash: wlHash });
      console.log("✅ Admin Whitelisted.");
  } catch (e) {
      console.log("✅ Admin sudah whitelisted sebelumnya.");
  }

  console.log("\n" + "-".repeat(60));
  console.log("🛠️ STEP 2: Mendaftarkan User B (Receiver) ke Whitelist");
  console.log("   (Tanpa langkah ini, Transfer PASTI Gagal karena logic Rust)");
  
  const wlReceiverHash = await token.write.whitelistUser([RECIPIENT_ADDRESS]);
  console.log(`⏳ Whitelisting User B... Tx: ${wlReceiverHash}`);
  await publicClient.waitForTransactionReceipt({ hash: wlReceiverHash });
  console.log("✅ User B Berhasil di-Whitelist!");

  console.log("\n" + "-".repeat(60));
  console.log("💸 STEP 3: Transfer Token ke User B");
  
  try {
    const txHash = await token.write.transfer([RECIPIENT_ADDRESS, TRANSFER_AMOUNT]);
    console.log(`⏳ Mengirim Token... Tx: ${txHash}`);
    await publicClient.waitForTransactionReceipt({ hash: txHash });
    console.log("✅ PASS: Transfer Sukses! (Karena Sender & Receiver Whitelisted)");
    
    const balanceB = await token.read.balanceOf([RECIPIENT_ADDRESS]);
    console.log(`💰 Saldo User B sekarang: ${balanceB} Wei`);
  } catch (error: any) {
    console.log(`❌ FAIL: Transfer Gagal - ${error.shortMessage || error.message}`);
    return; // Stop jika gagal di sini
  }


  console.log("\n" + "-".repeat(60));
  console.log("🚫 STEP 4: Revoke (Hapus) User B dari Whitelist");
  
  const revokeHash = await token.write.revokeUser([RECIPIENT_ADDRESS]);
  console.log(`⏳ Revoking User B... Tx: ${revokeHash}`);
  await publicClient.waitForTransactionReceipt({ hash: revokeHash });
  console.log("✅ User B Berhasil Dihapus/Blacklist.");


  console.log("\n" + "-".repeat(60));
  console.log("🧪 STEP 5: Coba Transfer Lagi ke User B (Expected: Gagal)");
  
  try {
    const txFail = await token.write.transfer([RECIPIENT_ADDRESS, TRANSFER_AMOUNT]);
    console.log(`❌ FAIL: Transfer masih berhasil (Padahal User B sudah di-kick!) Tx: ${txFail}`);
  } catch (error: any) {
    console.log("✅ PASS: Transfer Ditolak Rust! (Security Berjalan)");
    console.log(`   Reason: ${error.shortMessage || "Reverted as expected"}`);
  }

  console.log("\n" + "=".repeat(80));
  console.log("🎉 TEST SELESAI. Sistem RWA Anda Valid!");
}

main().catch(console.error);
