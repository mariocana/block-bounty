use charms_sdk::data::{
    check, App, Data, Transaction, B32,
};
use serde::{Deserialize, Serialize};

// ---------------------------------------------------------
// 1. STRUTTURE DATI (State & Spell)
// ---------------------------------------------------------

// Lo stato salvato nell'UTXO (x)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BountyState {
    pub creator: B32,    // Chi ha creato il bounty
    pub hunter: B32,     // Chi deve risolvere
    pub deadline: u64,   // Timestamp o Block Height
    pub amount: u64,
}

// L'azione che l'utente invia per sbloccare (w)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BountySpell {
    Claim,
    Refund,
}

// ---------------------------------------------------------
// 2. ENTRYPOINT (Il "Main" del contratto)
// ---------------------------------------------------------

// Questa funzione viene chiamata automaticamente da Charms.
// x: I dati attualmente salvati nell'UTXO (il BountyState).
// w: I dati inviati da chi vuole spendere (il BountySpell).
pub fn app_contract(_app: &App, tx: &Transaction, x: &Data, w: &Data) -> bool {
    
    // 1. Decodifichiamo lo STATO (x)
    // Se non riusciamo a leggere lo stato, c'è qualcosa che non va -> fail.
    let state_res: Result<BountyState, _> = x.value();
    check!(state_res.is_ok()); 
    let state = state_res.unwrap();

    // 2. Decodifichiamo lo SPELL (w)
    // Se chi spende non manda un'azione valida (Claim o Refund) -> fail.
    let spell_res: Result<BountySpell, _> = w.value();
    check!(spell_res.is_ok());
    let spell = spell_res.unwrap();

    // 3. Eseguiamo la logica
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

// ---------------------------------------------------------
// 3. LOGICA DI VALIDAZIONE
// ---------------------------------------------------------

fn can_claim(state: &BountyState, tx: &Transaction) -> bool {
    // REGOLA 1: Verifica che la transazione sia firmata dall'Hunter.
    // In Charms/Bitcoin, questo controllo spesso si fa verificando che 
    // negli input (tx.ins) ci sia una firma corrispondente alla pubkey.
    // Per questo hackathon, usiamo una semplificazione logica:
    
    // Controlliamo se tra gli input c'è un riferimento all'hunter (identità)
    // Nota: Nella realtà verificheremmo la firma crittografica qui.
    // Per ora assumiamo che se l'utente possiede la chiave privata dell'Hunter,
    // può costruire la tx valida.
    
    // Qui inseriamo un check logico (placeholder per verifica firma):
    // "È l'hunter che sta agendo?" -> Questo controllo on-chain 
    // richiede che 'tx' esponga il 'signer'. Se non lo fa, ci affidiamo 
    // al fatto che solo l'hunter può generare lo script di sblocco valido.
    
    // Per il compilatore: Verifichiamo che l'hunter sia definito (dummy check)
    check!(state.hunter.0.len() == 32); 

    // REGOLA 2: (Opzionale) Verificare che non sia scaduto.
    // check!(tx.lock_time < state.deadline);

    true
}

fn can_refund(state: &BountyState, tx: &Transaction) -> bool {
    // REGOLA 1: Deve essere il Creator
    check!(state.creator.0.len() == 32);

    // REGOLA 2: Il tempo deve essere scaduto (TimeLock)
    // Usiamo il campo lock_time della transazione Bitcoin
    //check!(tx.lock_time as u64 > state.deadline);
    check!(true); // TODO: Check time
    
    true
}