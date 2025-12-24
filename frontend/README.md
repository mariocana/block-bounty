# BlockBounty
Trustless, Programmable Escrow on Bitcoin fueled by ZK-Proofs.

## 🚀 The Problem
Traditional bounty platforms suffer from the "Oracle Problem" of trust. Hunters must trust platforms to hold funds, or trust creators to pay after the work is done. Existing multisig solutions are clunky and lack programmable logic (e.g., verifying specific credentials or solutions without manual intervention).

## 💡 The Solution
BlockBounty brings smart-contract capabilities to Bitcoin L1 using the Charms framework. It allows creators to lock Bitcoin into a UTXO that acts as a programmable state machine. Funds can only be unlocked when a specific condition—verified by a ZK Proof—is met.

In this MVP, we implemented an "Assigned Hunter" model: The protocol enforces that only the wallet address designated by the creator can generate the valid proof required to spend the bounty UTXO.

## ⚙️ How It Works (Technical Architecture)
The project consists of two distinct layers that interact via Client-Side Validation (CSV):

### The "Judge": Rust Smart Contract (WASM)
We wrote the core verification logic in Rust (src/lib.rs) and compiled it to WebAssembly using the Charms SDK.

State: The contract defines a BountyState struct containing the creator, hunter, amount, and deadline.

Logic: The app_contract function validates state transitions. It ensures that a Claim action is only valid if the transaction witness proves the signer is the authorized_hunter.

Security: This logic is compiled into a WASM binary with a unique Verification Key (VK). This VK is the "fingerprint" that secures the protocol on the Bitcoin network.

### The "Lawyer": Next.js Client (UI)
The frontend is a Cyberpunk-themed Next.js application acting as the transaction builder.

Minting: It constructs a "Spell" (a structured data payload) that initializes the Bounty State on a Bitcoin UTXO. It hardcodes the Rust contract's VK to ensure the funds are governed by our specific rules.

Hunting: It identifies Bounty UTXOs and constructs a Claim spell. For the demo, it simulates the ZK-proof generation step and broadcasts the spending transaction via the UniSat Wallet.

## 🛠️ Tech Stack
Core Logic: Rust, Charms SDK, WebAssembly (WASM).

Frontend: Next.js, TypeScript, Tailwind CSS, Framer Motion.

Integration: UniSat Wallet API, Bitcoin Testnet.

Verification: Client-Side Validation (CSV) model.

## 🔮 Future Roadmap
Proof of Solution: Extending the ZK logic to verify the hash of a solution (e.g., a bug fix or password) rather than just the Hunter's identity.

Time-Lock Refunds: Implementing the can_refund logic to allow Creators to reclaim funds if the deadline block height is passed.

Arbitration DAO: Adding a multisig fallback for disputed bounties.

## 📦 How to Run
Logic: cargo build --target wasm32-unknown-unknown to generate the .wasm binary.

UI: cd ui && npm install && npm run dev to start the dashboard.

Wallet: Requires UniSat Wallet (Testnet) to sign transactions.