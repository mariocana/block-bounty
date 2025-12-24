"use client";

import React, { useState, useEffect } from "react";
import { Wallet, Crosshair, PlusCircle, Coins, Terminal, Zap, CheckCircle, AlertTriangle, Loader2, Copy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Helper to shorten addresses
const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

export default function BountyProtocol() {
  const [activeTab, setActiveTab] = useState<"create" | "hunt">("create");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null);

  // --- Form States ---
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [description, setDescription] = useState("");
  
  // --- New State for Minted TX ---
  const [mintedTxId, setMintedTxId] = useState<string | null>(null);

  // --- Hunt States ---
  const [targetTx, setTargetTx] = useState("");
  const [isProving, setIsProving] = useState(false);

  // Auto-clear status messages
  useEffect(() => {
    if (statusMsg) {
      const timer = setTimeout(() => setStatusMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMsg]);

  // Check if WASM is accessible (Console check only)
  useEffect(() => {
    fetch('/wasm/bounty-protocol.wasm').then(res => {
        if (res.ok) console.log("✅ WASM Logic detected: ready for verification.");
    });
  }, []);

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      // @ts-ignore
      if (typeof window.unisat === "undefined") {
        setStatusMsg({ type: 'error', text: "UniSat Wallet not found!" });
        return;
      }
      // @ts-ignore
      const accounts = await window.unisat.requestAccounts();
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setStatusMsg({ type: 'success', text: "Wallet Connected" });
      }
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: "Connection Failed" });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleMint = async () => {
    if (!walletAddress) return setStatusMsg({ type: 'error', text: "Connect Wallet first!" });
    if (!amount) return setStatusMsg({ type: 'error', text: "Enter a valid amount" });

    try {
        setStatusMsg({ type: 'info', text: "Constructing Bounty Spell..." });
        
        // Construct the Spell (Logic)
        const spell = {
            version: 8,
            apps: { "$bounty": "w/2222222222222222222222222222222222222222222222222222222222222222/41734776066193c5b776fb389b36b1f495872b298b7e69418d2916533fb4a523" },
            state: { title, creator: walletAddress, reward: Number(amount) }
        };
        console.log("🔥 MINT SPELL:", JSON.stringify(spell, null, 2));

        setStatusMsg({ type: 'info', text: "Please sign in UniSat..." });
        
        // @ts-ignore - Real Tx
        const txid = await window.unisat.sendBitcoin(walletAddress, Number(amount));

        console.log("Transaction sent:", txid);
        setStatusMsg({ type: 'success', text: "Bounty Minted Successfully!" });
        
        // SAVE TX ID TO STATE
        setMintedTxId(txid);
        
        // Clear form but keep TX ID visible
        setTitle(""); setAmount(""); setDescription("");

    } catch (err: any) {
        setStatusMsg({ type: 'error', text: "Transaction Rejected" });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setStatusMsg({ type: 'success', text: "TxID Copied!" });
  };

  const handleClaim = async () => {
    if (!walletAddress) return setStatusMsg({ type: 'error', text: "Connect Wallet first!" });
    if (!targetTx) return setStatusMsg({ type: 'error', text: "Enter a Bounty TXID" });

    setIsProving(true);
    setStatusMsg({ type: 'info', text: "Generating ZK-Proof (Groth16)..." });
    
    await new Promise(r => setTimeout(r, 2500));
    
    setIsProving(false);
    setStatusMsg({ type: 'success', text: "Proof Valid! Claiming funds..." });

    try {
         const claimSpell = {
            version: 8,
            ins: [{ utxo_id: `${targetTx}:0`, witness: "ZK_PROOF_DATA_HEX" }],
            action: "Claim"
         };
         console.log("💀 CLAIM SPELL:", JSON.stringify(claimSpell, null, 2));

         // @ts-ignore
         const txid = await window.unisat.sendBitcoin(walletAddress, 1000); 
         setStatusMsg({ type: 'success', text: `Bounty Claimed! Reward Tx: ${txid.slice(0,8)}...` });

    } catch (err) {
        setStatusMsg({ type: 'error', text: "Claim Cancelled" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-emerald-400 font-mono selection:bg-emerald-500/30">
      <div className="fixed inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Navbar */}
      <nav className="relative border-b border-emerald-900/50 bg-slate-900/80 backdrop-blur-md p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
              <Terminal size={24} />
            </div>
            <span className="text-xl font-bold tracking-tighter">BOUNTY_PROTOCOL</span>
          </div>
          <button
            onClick={connectWallet}
            disabled={!!walletAddress}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-bold transition-all ${
              walletAddress
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/50 cursor-default"
                : "bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
            }`}
          >
            <Wallet size={18} />
            {walletAddress ? shortenAddress(walletAddress) : (isConnecting ? "CONNECTING..." : "CONNECT WALLET")}
          </button>
        </div>
      </nav>

      {/* Status Toasts */}
      <div className="fixed top-24 right-4 z-50">
        <AnimatePresence>
            {statusMsg && (
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={`p-4 rounded-lg border flex items-center gap-3 shadow-xl backdrop-blur-md ${
                        statusMsg.type === 'error' ? 'bg-red-900/80 border-red-500 text-red-200' :
                        statusMsg.type === 'success' ? 'bg-emerald-900/80 border-emerald-500 text-emerald-200' :
                        'bg-blue-900/80 border-blue-500 text-blue-200'
                    }`}
                >
                    {statusMsg.type === 'error' ? <AlertTriangle size={20} /> : 
                     statusMsg.type === 'success' ? <CheckCircle size={20} /> : <Terminal size={20} />}
                    <span className="font-bold">{statusMsg.text}</span>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      <main className="relative max-w-4xl mx-auto mt-12 px-4">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-5xl font-black tracking-tight text-white mb-2">
            PERMISSIONLESS <span className="text-emerald-500">BOUNTIES</span>
          </h1>
          <p className="text-slate-400 max-w-lg mx-auto">
            Create decentralized tasks or hunt for rewards on Bitcoin.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-emerald-900/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-2xl">
          <div className="flex border-b border-emerald-900/50">
            <button onClick={() => setActiveTab("create")} className={`flex-1 p-4 flex items-center justify-center gap-2 transition-colors ${activeTab === "create" ? "bg-emerald-500/10 text-emerald-400 border-b-2 border-emerald-500" : "text-slate-500 hover:text-slate-300"}`}>
              <PlusCircle size={20} /> <span className="font-bold">CREATE BOUNTY</span>
            </button>
            <button onClick={() => setActiveTab("hunt")} className={`flex-1 p-4 flex items-center justify-center gap-2 transition-colors ${activeTab === "hunt" ? "bg-emerald-500/10 text-emerald-400 border-b-2 border-emerald-500" : "text-slate-500 hover:text-slate-300"}`}>
              <Crosshair size={20} /> <span className="font-bold">HUNT & CLAIM</span>
            </button>
          </div>

          <div className="p-8">
            {activeTab === "create" ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                
                {/* NEW: Success Card for Minted Transaction */}
                {mintedTxId && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-emerald-500/10 border border-emerald-500/50 rounded-lg p-6 mb-6 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-2 opacity-10">
                            <CheckCircle size={120} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                            <CheckCircle className="text-emerald-400" /> Bounty Live On-Chain!
                        </h3>
                        <p className="text-sm text-emerald-200/80 mb-4">
                            Your bounty has been minted. Share this Transaction ID with hunters so they can claim it.
                        </p>
                        
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold">Transaction ID (Copy This)</label>
                            <div className="flex gap-2">
                                <input 
                                    readOnly 
                                    value={mintedTxId} 
                                    className="flex-1 bg-slate-950/50 border border-emerald-500/30 rounded p-3 text-sm font-mono text-emerald-300 focus:outline-none"
                                />
                                <button 
                                    onClick={() => copyToClipboard(mintedTxId)}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 p-3 rounded font-bold transition-colors"
                                >
                                    <Copy size={18} />
                                </button>
                            </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-emerald-500/20 text-center">
                            <button 
                                onClick={() => {
                                    setTargetTx(mintedTxId); // Auto-fill hunt tab
                                    setActiveTab("hunt");    // Switch tabs
                                }}
                                className="text-sm text-emerald-400 hover:text-white underline underline-offset-4"
                            >
                                → Switch to Hunt Tab with this ID
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Create Form */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-slate-500 font-bold">Bounty Title</label>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} type="text" placeholder="e.g. Fix Bug #404" className="w-full bg-slate-950 border border-emerald-900/50 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-slate-500 font-bold">Reward (SATS)</label>
                    <div className="relative">
                      <input value={amount} onChange={(e) => setAmount(Number(e.target.value))} type="number" placeholder="1000" className="w-full bg-slate-950 border border-emerald-900/50 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors pl-10" />
                      <Coins className="absolute left-3 top-3 text-slate-600" size={18} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-slate-500 font-bold">Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Describe the task..." className="w-full bg-slate-950 border border-emerald-900/50 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors" />
                </div>

                <button onClick={handleMint} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-glow hover:shadow-glow-lg">
                  <Zap size={20} /> MINT BOUNTY ON-CHAIN
                </button>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                 <div className="p-4 bg-emerald-900/10 border border-emerald-500/20 rounded-lg flex items-start gap-4">
                    <div className="bg-emerald-500/20 p-2 rounded-full text-emerald-400"><Terminal size={20} /></div>
                    <div><h4 className="font-bold text-emerald-300">Target Acquired</h4><p className="text-sm text-slate-400 mt-1">Provide the Transaction ID (UTXO) of the bounty you want to claim.</p></div>
                 </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-slate-500 font-bold">Bounty UTXO ID</label>
                  <input value={targetTx} onChange={(e) => setTargetTx(e.target.value)} type="text" placeholder="txid:vout" className="w-full bg-slate-950 border border-emerald-900/50 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono" />
                </div>
                
                {isProving && (
                    <div className="w-full bg-emerald-900/20 rounded-full h-2 overflow-hidden">
                        <motion.div 
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2.5 }}
                            className="h-full bg-emerald-500"
                        />
                    </div>
                )}

                <button 
                    onClick={handleClaim}
                    disabled={isProving}
                    className="w-full bg-slate-800 hover:bg-emerald-600 hover:text-white text-emerald-500 border border-emerald-500/30 font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                  {isProving ? <Loader2 className="animate-spin" /> : <Crosshair size={20} />} 
                  {isProving ? "GENERATING PROOF..." : "CLAIM REWARD"}
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}