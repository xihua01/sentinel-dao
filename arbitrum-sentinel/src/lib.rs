#![cfg_attr(not(feature = "export-abi"), no_main)]
extern crate alloc;

use stylus_sdk::{alloy_primitives::{Address, U256, U8}, prelude::*};

sol_storage! {
    #[entrypoint]
    pub struct Sentinel {
        mapping(address => bool) whitelisted;
        mapping(address => uint8) risk_scores;
        address admin; // Token Address (Solidity)
        
        // === POLICY ENGINE: DYNAMIC CONFIG ===
        uint8 min_score_active; // Default: 30
        uint8 min_score_vip;    // Default: 80
        bool is_paused;         // Emergency Break
    }
}

#[public]
impl Sentinel {
    
    pub fn init(&mut self, owner: Address) {
        self.admin.set(owner);
        self.min_score_active.set(U8::from(30));
        self.min_score_vip.set(U8::from(80));
        self.is_paused.set(false);
    }

    pub fn check_transfer(&self, from: Address, to: Address, amount: U256) -> bool {
        let caller = stylus_sdk::msg::sender();
        if caller != self.admin.get() { return false; }

        // Policy: Global Pause
        if self.is_paused.get() { return false; }

        if !self.whitelisted.get(from) || !self.whitelisted.get(to) { return false; }

        let score = self.risk_scores.get(from); 
        
        // Policy: Dynamic Thresholds
        let min_active = self.min_score_active.get();
        let min_vip = self.min_score_vip.get();

        let limit;
        if score < min_active {
            return false; 
        } else if score < min_vip {
            limit = U256::from(1_000_000_000_000_000_000_000_u128); // 1,000 SENT
        } else {
            limit = U256::from(1_000_000_000_000_000_000_000_000_u128); // 1,000,000 SENT
        }

        if amount > limit { return false; }

        true 
    }

    // === CONFIGURATION (Policy Engine) ===
    pub fn set_policy_config(&mut self, min_active: u8, min_vip: u8) {
        self.ensure_admin();
        self.min_score_active.set(U8::from(min_active));
        self.min_score_vip.set(U8::from(min_vip));
    }

    pub fn set_paused(&mut self, paused: bool) {
        self.ensure_admin();
        self.is_paused.set(paused);
    }

    pub fn add_to_whitelist(&mut self, user: Address) {
        self.ensure_admin(); 
        self.whitelisted.setter(user).set(true);
        self.risk_scores.setter(user).set(U8::from(50));
    }

    pub fn remove_from_whitelist(&mut self, user: Address) {
        self.ensure_admin();
        self.whitelisted.setter(user).set(false);
        self.risk_scores.setter(user).set(U8::from(0)); 
    }

    pub fn set_risk_score(&mut self, user: Address, score: u8) {
        self.ensure_admin();
        if score > 100 { panic!("Score max 100"); }
        self.risk_scores.setter(user).set(U8::from(score));
    }

    pub fn get_user_status(&self, user: Address) -> (bool, u8) {
        let score_u8 = self.risk_scores.get(user);
        let score_primitive: u8 = score_u8.try_into().unwrap(); 
        (self.whitelisted.get(user), score_primitive)
    }

    pub fn get_admin(&self) -> Address { self.admin.get() }
}

impl Sentinel {
    fn ensure_admin(&self) {
        let caller = stylus_sdk::msg::sender();
        if caller != self.admin.get() { panic!("Access Denied"); }
    }
}