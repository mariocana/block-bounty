// ui/src/types/spell.ts

export interface AppDefinition {
    type: 'n' | 't' | 'w'; // NFT, Token, or Write/State
    identity: string;
    vk: string;
  }
  
  export interface CharmState {
    creator: string;
    hunter: string;
    deadline: number;
    amount: number;
  }
  
  export interface SpellInput {
    utxo_id: string;
    charms: Record<string, CharmState | number>; // Map app_id to State or Amount
  }
  
  export interface SpellOutput {
    address: string;
    sats: number;
    charms?: Record<string, CharmState | number>;
  }
  
  export interface Spell {
    version: number;
    apps: Record<string, string>; // "$bounty": "w/identity/vk"
    ins: SpellInput[];
    outs: SpellOutput[];
  }