import { viem } from "hardhat";

async function main() {
  const publicClient = await viem.getPublicClient();
  const [walletClient, user1] = await viem.getWalletClients();

  const tokenFullSol = await viem.deployContract("SentinelRWA");
  const logicFullSol = await viem.deployContract("SentinelLogic");
  
  const connectHash = await tokenFullSol.write.connectToRust([logicFullSol.address]);
  await publicClient.waitForTransactionReceipt({ hash: connectHash });
  
  const wlHash = await tokenFullSol.write.whitelistUser([user1.account.address]);
  const wlReceipt = await publicClient.waitForTransactionReceipt({ hash: wlHash });
  console.log(`[Full Solidity] whitelistUser() Gas Used: ${wlReceipt.gasUsed}`);
}
main().catch(console.error);
