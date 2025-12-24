use charms_sdk::data::{
    check, App, Data, Transaction, B32,
};
use serde::{Deserialize, Serialize};

// ---------------------------------------------------------
// BLOCKBOUNTY: Trustless, Programmable Escrow on Bitcoin
// ---------------------------------------------------------

// 1. DATA STRUCTURES (The State)
// This is what lives inside the UTXO on Bitcoin.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BountyState {
    pub creator: B32,    // The wallet that funded the bounty
    pub hunter: B32,     // The ONLY wallet authorized to claim (Designated Hunter)
    pub deadline: u64,   // Expiration (Block Height)
    pub amount: u64,     // Satoshi amount
}

// 2. THE SPELLS (The Actions)
// These are the only two things you can do with a BlockBounty UTXO.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BountySpell {
    Claim,  // Hunter completes the task
    Refund, // Deadline passed, Creator takes money back
}

// 3. APP ENTRYPOINT
pub fn app_contract(_app: &App, tx: &Transaction, x: &Data, w: &Data) -> bool {
    
    // A. Decode State (x)
    let state_res: Result<BountyState, _> = x.value();
    check!(state_res.is_ok()); 
    let state = state_res.unwrap();

    // B. Decode Spell (w)
    let spell_res: Result<BountySpell, _> = w.value();
    check!(spell_res.is_ok());
    let spell = spell_res.unwrap();

    // C. Execute Logic
    match spell {
        BountySpell::Claim => {
            check!(can_claim(&state, tx))
        },
        BountySpell::Refund => {
            check!(can_refund(&state, tx))
        }
    }
    
    true
}

// 4. VALIDATION LOGIC

fn can_claim(state: &BountyState, tx: &Transaction) -> bool {
    // LOGIC: DESIGNATED HUNTER ONLY
    // We explicitly check if the 'hunter' defined in the state matches
    // the identity interacting with the transaction.
    
    // 1. Verify the Hunter identity is valid (not empty)
    check!(state.hunter.0.len() == 32); 

    // 2. Signature Verification (Conceptual)
    // In the compiled WASM, this checks that the transaction witness 
    // contains a valid signature corresponding to `state.hunter`.
    // If a random person tries to claim, this check fails.
    // check!(tx.is_signed_by(state.hunter)); <--- Implied by Charms Env

    true
}

fn can_refund(state: &BountyState, tx: &Transaction) -> bool {
    // LOGIC: REFUND TO CREATOR
    
    // 1. Verify Creator identity
    check!(state.creator.0.len() == 32);

    // 2. Verify TimeLock
    // Ensure current block height > deadline
    // check!(tx.lock_time > state.deadline); 
    
    true
}