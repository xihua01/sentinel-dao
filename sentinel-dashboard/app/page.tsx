'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSimulateContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { toast } from 'sonner';
import { ShieldCheck, ShieldAlert, Wallet, Activity, ArrowRightLeft, Search, Zap, Lock, Unlock, Landmark, Users, AlertTriangle } from 'lucide-react';
import { TOKEN_ADDRESS, TOKEN_ABI } from '../src/constants';

export default function Home() {
  const { address, isConnected } = useAccount();
  
  // States
  const [targetAddress, setTargetAddress] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [adminTargetAddress, setAdminTargetAddress] = useState('');
  const [trustScoreInput, setTrustScoreInput] = useState('50');

  // === CONTRACT HOOKS ===

  // Pre-flight Check
  const { data: simulateData, error: simulateError, isError: isSimulateError } = useSimulateContract({
    address: TOKEN_ADDRESS, abi: TOKEN_ABI, functionName: 'transfer',
    args: [targetAddress, transferAmount ? parseEther(transferAmount) : BigInt(0)],
    query: { enabled: Boolean(targetAddress && transferAmount && Number(transferAmount) > 0), retry: false }
  });

  // 2. Write Contract
  const { data: hash, writeContract, isPending } = useWriteContract({
    mutation: {
      onError: (error) => toast.error(`Action Failed: ${error.message.split('\n')[0]}`),
    }
  });

  // 3. Wait Transaction
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isConfirming) toast.loading("Verifying on Arbitrum Stylus...", { id: 'tx-toast' });
    if (isConfirmed) {
        toast.dismiss('tx-toast');
        toast.success("Policy Enforced On-Chain!", { description: `Hash: ${hash?.slice(0, 10)}...` });
        setTransferAmount('');
    }
  }, [isConfirming, isConfirmed, hash]);

  // 4. Read Data
  const { data: balance } = useReadContract({
    address: TOKEN_ADDRESS, abi: TOKEN_ABI, functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { refetchInterval: 5000 }
  });

  const { data: targetUserData, refetch: refetchUserData } = useReadContract({
    address: TOKEN_ADDRESS, abi: TOKEN_ABI, functionName: 'getUserData',
    args: adminTargetAddress ? [adminTargetAddress] : undefined,
    query: { enabled: false }
  });

  const { data: isConnectedToRust } = useReadContract({
    address: TOKEN_ADDRESS, abi: TOKEN_ABI, functionName: 'isConnected',
  });

  // Parsing Data
  const targetIsWhitelisted = targetUserData ? targetUserData[0] : false;
  const targetTrustScore = targetUserData ? Number(targetUserData[1]) : 0;

  // === HANDLERS ===
  const handleGuardianAction = (actionName: string, fnName: string, args: any[]) => {
    toast.promise(
      () => {
        writeContract({ 
            address: TOKEN_ADDRESS, 
            abi: TOKEN_ABI, 
            functionName: fnName, 
            args: args,
            maxFeePerGas: BigInt(100000000), 
            maxPriorityFeePerGas: BigInt(100000000) 
        });
        return Promise.resolve();
      },
      { loading: `Executing ${actionName}...`, success: 'Signature Request Sent', error: 'Aborted' }
    );
  };

  // Helper Functions
  const getErrorMessage = (error: any) => {
    if (!error) return null;
    const msg = error.message || error.toString();
    if (msg.includes("Transfer Denied")) return "Sentinel Firewall: Trust Score too low or Unauthorized";
    if (msg.includes("insufficient funds")) return "Insufficient Treasury Balance";
    return "Policy Violation Detected";
  };

  const getScoreColor = (isWhitelisted: boolean, score: number) => {
      if (!isWhitelisted) return "text-slate-500";
      if (score < 30) return "text-rose-500 animate-pulse";
      if (score < 80) return "text-amber-400";
      return "text-emerald-400";
  };

  // Helper Label
  const getStatusLabel = (isWhitelisted: boolean, score: number) => {
      if (!isWhitelisted) return "UNAUTHORIZED (NO ACCESS)";
      if (score < 30) return "🚨 FROZEN (SECURITY RISK) 🚨";
      if (score < 80) return "STANDARD ACCESS";
      return "TRUSTED SIGNER";
  };

  // Helper Background Badge
  const getStatusBadgeStyle = (isWhitelisted: boolean, score: number) => {
      if (!isWhitelisted) return "bg-slate-800 text-slate-400 border-slate-700";
      if (score < 30) return "bg-rose-950 text-rose-500 border-rose-900 shadow-[0_0_10px_rgba(244,63,94,0.5)]";
      if (score < 80) return "bg-amber-950 text-amber-500 border-amber-900";
      return "bg-emerald-950 text-emerald-500 border-emerald-900";
  };

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8 font-sans bg-slate-950 text-slate-200">
      
      {/* === HEADER === */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-950/50 rounded-xl border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
            <Landmark className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white font-mono">
              SENTINEL <span className="text-indigo-400">DAO</span>
            </h1>
            <p className="text-slate-400 text-sm flex items-center gap-2 font-mono">
              <ShieldCheck className="w-3 h-3 text-emerald-500" /> Treasury Firewall (Powered by Stylus)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono font-bold ${isConnectedToRust ? "bg-emerald-950/50 border-emerald-500/50 text-emerald-400" : "bg-red-950/50 border-red-500/50 text-red-500"}`}>
             <Zap className="w-3 h-3 fill-current" />
             RUST POLICY ENGINE: {isConnectedToRust ? "ACTIVE" : "OFFLINE"}
          </div>
          <ConnectButton showBalance={false} accountStatus="address" chainStatus="icon" />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* === LEFT: CONTRIBUTOR VIEW (User Persona) === */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-2xl p-1 shadow-2xl">
            <div className="bg-slate-950/80 rounded-xl p-6 space-y-6">
              <div className="flex items-center justify-between text-slate-300 mb-2 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  <h2 className="font-bold tracking-wider text-sm">CONTRIBUTOR DASHBOARD</h2>
                </div>
                <span className="text-[10px] bg-slate-900 px-2 py-1 rounded text-slate-500 font-mono">VIEW ONLY</span>
              </div>

              {isConnected ? (
                <>
                  {/* Balance Display */}
                  <div className="p-6 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Wallet className="w-24 h-24 text-white" />
                    </div>
                    <p className="text-slate-400 text-xs font-mono uppercase tracking-widest">Available Allocation</p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-4xl font-black text-white tracking-tight font-mono">
                        {balance ? Number(formatEther(balance as bigint)).toLocaleString() : '0'}
                      </span>
                      <span className="text-indigo-400 font-bold text-sm">DAO TOKEN</span>
                    </div>
                  </div>

                  {/* Transfer Form */}
                  <div className="space-y-4 pt-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <ArrowRightLeft className="w-3 h-3" /> Request Disbursement
                    </h3>
                    
                    <div className="grid gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-mono ml-1">DESTINATION ADDRESS</label>
                        <input 
                          type="text" placeholder="0x..." 
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-700"
                          onChange={(e) => setTargetAddress(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-mono ml-1">AMOUNT</label>
                        <input 
                          type="number" placeholder="0.0" 
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-700"
                          onChange={(e) => setTransferAmount(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Pre-flight Check Feedback */}
                    {isSimulateError && targetAddress && transferAmount && (
                      <div className="p-4 bg-rose-950/20 border border-rose-500/30 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                        <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-rose-400 text-sm font-bold tracking-wide">FIREWALL BLOCKED TRANSACTION</p>
                          <p className="text-rose-500/70 text-xs mt-1 font-mono">{getErrorMessage(simulateError)}</p>
                        </div>
                      </div>
                    )}

                    <button 
                      onClick={() => {
                        if(simulateData?.request) writeContract(simulateData.request);
                        else writeContract({ address: TOKEN_ADDRESS, abi: TOKEN_ABI, functionName: 'transfer', args: [targetAddress, parseEther(transferAmount)] });
                      }}
                      disabled={isPending || isSimulateError || !Boolean(simulateData)}
                      className={`w-full py-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all text-sm tracking-wide
                        ${isSimulateError || !Boolean(simulateData)
                          ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-800'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/30 active:scale-[0.98]'
                        }`}
                    >
                      {isPending ? <span className="animate-pulse">VERIFYING POLICY...</span> : 'SUBMIT TRANSACTION'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="h-40 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50">
                  <Wallet className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-xs font-mono">CONNECT CONTRIBUTOR WALLET</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* === RIGHT: GUARDIAN CONSOLE (Admin Persona) === */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/40 backdrop-blur-sm border border-amber-500/20 rounded-2xl p-1 shadow-2xl relative overflow-hidden group">
            {/* Warning Tape Effect */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-600 to-transparent opacity-50" />
            
            <div className="bg-slate-950/90 rounded-xl p-6 space-y-6 h-full">
              <div className="flex items-center justify-between text-amber-500 mb-2 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  <h2 className="font-bold tracking-wider text-sm">TREASURY GUARD CONSOLE</h2>
                </div>
                <div className="flex items-center gap-1 bg-amber-950/50 text-amber-500 px-2 py-1 rounded border border-amber-900/50">
                    <Lock className="w-3 h-3" />
                    <span className="text-[10px] font-bold">GOVERNANCE ONLY</span>
                </div>
              </div>

              {/* Monitor Search */}
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-mono uppercase">Monitor Contributor Address</label>
                <div className="flex gap-2">
                    <input 
                    type="text" placeholder="0x..." 
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-white focus:border-amber-500 outline-none transition-colors"
                    onChange={(e) => setAdminTargetAddress(e.target.value)}
                    />
                    <button 
                    onClick={() => refetchUserData()}
                    className="bg-slate-800 hover:bg-slate-700 text-white p-2.5 rounded-lg border border-slate-700 transition-colors"
                    >
                    <Search className="w-4 h-4" />
                    </button>
                </div>
              </div>

              {/* Investigation Result */}
              {adminTargetAddress && (
                <div className="bg-slate-900 rounded-lg p-4 border border-slate-800 animate-in zoom-in-95">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-[10px] text-slate-500 uppercase font-mono">Live Stylus State</p>
                    {isConnectedToRust && <span className="text-[10px] text-emerald-500 flex items-center gap-1">● Synced</span>}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {/* Status Box */}
                    <div className={`p-3 rounded border ${targetIsWhitelisted ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-400' : 'bg-rose-950/20 border-rose-900/50 text-rose-500'}`}>
                      <p className="text-[10px] opacity-70 mb-1">Access Status</p>
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        {targetIsWhitelisted ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        {targetIsWhitelisted ? 'AUTHORIZED' : 'RESTRICTED'}
                      </div>
                    </div>

                    {/* Score Box */}
                      <div className="p-3 rounded bg-slate-800/50 border border-slate-700/50">
                      <p className="text-[10px] text-slate-400 mb-1">Trust Score</p>
                      <div className="flex items-baseline gap-2">
                        {/* Panggil getScoreColor dengan parameter isWhitelisted */}
                        <span className={`text-xl font-black ${getScoreColor(targetIsWhitelisted, targetTrustScore)}`}>
                            {targetTrustScore}
                        </span>
                        <span className="text-[10px] text-slate-600">/ 100</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Interpretation (Badge Besar) */}
                  <div className="mb-4 text-center">
                      <span className={`text-[10px] font-mono px-3 py-1.5 rounded border font-bold tracking-wider ${getStatusBadgeStyle(targetIsWhitelisted, targetTrustScore)}`}>
                          {getStatusLabel(targetIsWhitelisted, targetTrustScore)}
                      </span>
                  </div>

                  <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
                    <button 
                      onClick={() => handleGuardianAction('Authorize Signer', 'whitelistUser', [adminTargetAddress])}
                      className="w-full py-2.5 bg-emerald-900/20 hover:bg-emerald-900/30 text-emerald-400 border border-emerald-900/50 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <ShieldCheck className="w-3 h-3" /> AUTHORIZE SPENDER
                    </button>
                    <button 
                      onClick={() => handleGuardianAction('Freeze Assets', 'revokeUser', [adminTargetAddress])}
                      className="w-full py-2.5 bg-rose-900/20 hover:bg-rose-900/30 text-rose-400 border border-rose-900/50 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <AlertTriangle className="w-3 h-3" /> FREEZE ASSETS (PANIC)
                    </button>
                  </div>
                </div>
              )}

              {/* Policy Adjuster */}
              <div className="pt-4 border-t border-slate-800">
                <label className="text-[10px] text-slate-500 uppercase font-mono mb-2 block">Update Trust Level</label>
                <div className="flex gap-2">
                  <input 
                    type="number" min="0" max="100" value={trustScoreInput}
                    onChange={(e) => setTrustScoreInput(e.target.value)}
                    className="w-20 bg-slate-900 border border-slate-800 rounded-lg p-2 text-center text-white font-bold outline-none focus:border-amber-500 transition-colors"
                  />
                  <button 
                    onClick={() => handleGuardianAction('Update Trust Score', 'updateUserScore', [adminTargetAddress, parseInt(trustScoreInput)])}
                    disabled={!adminTargetAddress}
                    className="flex-1 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-amber-900/20 transition-all"
                  >
                    <Zap className="w-3 h-3 fill-current" /> UPDATE POLICY
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}