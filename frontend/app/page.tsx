"use client";

import React, { useState, useEffect } from "react";
import { Wallet, Crosshair, PlusCircle, Coins, Terminal, Zap, CheckCircle, AlertTriangle } from "lucide-react";
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

  // Auto-clear status messages
  useEffect(() => {
    if (statusMsg) {
      const timer = setTimeout(() => setStatusMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [statusMsg]);

  // 1. Connect to UniSat Wallet
  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      // @ts-ignore
      if (typeof window.unisat === "undefined") {
        setStatusMsg({ type: 'error', text: "UniSat Wallet not found! Please install it." });
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

  // 2. MINT FUNCTION (Real Wallet Interaction)
  const handleMint = async () => {
    if (!walletAddress) {
      setStatusMsg({ type: 'error', text: "Connect Wallet first!" });
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setStatusMsg({ type: 'error', text: "Enter a valid reward amount" });
      return;
    }

    try {
        setStatusMsg({ type: 'info', text: "Constructing Bounty Spell..." });

        // A. Construct the Logic (The Spell)
        // This mirrors the JSON we struggled with in the CLI, but here it's easy JS objects.
        const spell = {
            version: 8,
            apps: {
                "$bounty": "w/2222222222222222222222222222222222222222222222222222222222222222/41734776066193c5b776fb389b36b1f495872b298b7e69418d2916533fb4a523"
            },
            state: {
                title: title,
                creator: walletAddress,
                reward: Number(amount)
            }
        };

        console.log("🔥 GENERATED SPELL:", JSON.stringify(spell, null, 2));

        // B. Trigger Wallet to Fund the Bounty
        // In a real mainnet app, this would send to a script address.
        // For this demo, we send to a 'burn' address or back to self to prove the user has funds.
        setStatusMsg({ type: 'info', text: "Please sign the transaction in UniSat..." });
        
        // @ts-ignore
        const txid = await window.unisat.sendBitcoin(
            walletAddress, // Sending to self for safety in demo
            Number(amount)
        );

        console.log("Transaction sent:", txid);
        setStatusMsg({ type: 'success', text: `Bounty Minted! Tx: ${txid.slice(0,8)}...` });
        
        // Reset form
        setTitle("");
        setAmount("");
        setDescription("");

    } catch (err: any) {
        console.error(err);
        if (err.message.includes("User rejected")) {
            setStatusMsg({ type: 'error', text: "Transaction Rejected by User" });
        } else {
            setStatusMsg({ type: 'error', text: "Mint Failed. Do you have Testnet BTC?" });
        }
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
                  <input type="text" placeholder="txid:vout" className="w-full bg-slate-950 border border-emerald-900/50 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono" />
                </div>
                <button className="w-full bg-slate-800 hover:bg-emerald-600 hover:text-white text-emerald-500 border border-emerald-500/30 font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-all"><Crosshair size={20} /> CLAIM REWARD</button>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}