import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";
import SentinelRWAArtifact from "../artifacts/contracts/SentinelToken.sol/SentinelRWA.json";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const RUST_ADDRESS = "0x6ae7760270787324f187111bfc6096d0094778a3"; 

  console.log("\n🚀 DEPLOY SENTINEL RWA (V3) - DEBUG MODE");
  console.log("=========================================");

  const privateKey = process.env.PRIVATE_KEY || process.env.ARBITRUM_SEPOLIA_PRIVATE_KEY;
  if (!privateKey) throw new Error("Private Key missing");
  const account = privateKeyToAccount(`0x${privateKey.replace('0x', '')}` as `0x${string}`);
  
  const walletClient = createWalletClient({ account, chain: arbitrumSepolia, transport: http() });
  const publicClient = createPublicClient({ chain: arbitrumSepolia, transport: http() });

  console.log(`👤 Deployer: ${account.address}`);

  // 1. Deploy Token
  console.log("\n📄 Deploying Solidity Token...");
  const deployHash = await walletClient.deployContract({
    abi: SentinelRWAArtifact.abi,
    bytecode: SentinelRWAArtifact.bytecode as `0x${string}`,
    args: [],
  });
  console.log(`⏳ Deploy Tx: ${deployHash}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash: deployHash });
  const tokenAddress = receipt.contractAddress!;
  console.log(`✅ Token: ${tokenAddress}`);

  // 2. Connect to Rust
  console.log("\n🔗 Connecting to Stylus...");
  console.log(`   Target Rust: ${RUST_ADDRESS}`);
  
  try {
      await publicClient.simulateContract({
        address: tokenAddress,
        abi: SentinelRWAArtifact.abi,
        functionName: 'connectToRust',
        args: [RUST_ADDRESS],
        account,
        gas:95_000_000n 
      });
      console.log("   ✅ Simulation Successful!");

      const connectHash = await walletClient.writeContract({
        address: tokenAddress,
        abi: SentinelRWAArtifact.abi,
        functionName: 'connectToRust',
        args: [RUST_ADDRESS],
        gas: 5_000_000n
      });
      
      console.log(`⏳ Tx Sent: ${connectHash}`);
      await publicClient.waitForTransactionReceipt({ hash: connectHash });
      console.log("✅ SUCCESS CONNECT!");

  } catch (error: any) {
      console.error("\n❌ FAILED CONNECT:");
      console.error("   Reason:", error.shortMessage || error.message);
      console.log("\n⚠️ DON'T CONTINUE WITH VERIFICATION!");
      return;
  }

  console.log("\n🎉 FINAL ADDRESS:");
  console.log(`TOKEN_ADDRESS = "${tokenAddress}"`);
  console.log(`RUST_ADDRESS  = "${RUST_ADDRESS}"`);
}

main().catch(console.error);