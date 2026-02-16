// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol"; // 1. GOVERNANCE

interface ISentinelStylus {
    function checkTransfer(address from, address to, uint256 amount) external view returns (bool);
    function init(address owner) external;
    function addToWhitelist(address user) external;
    function removeFromWhitelist(address user) external;
    function setRiskScore(address user, uint8 score) external;
    function getUserStatus(address user) external view returns (bool, uint8);
    
    function set_policy_config(uint8 min_active, uint8 min_vip) external;
    function set_paused(bool paused) external;
}

contract SentinelRWA is ERC20, AccessControl {
    ISentinelStylus public stylusLogic;
    bool public isConnected = false;

    // Role Definition
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");

    // SECURITY MODEL: Audit Trail (Events)
    event UserWhitelisted(address indexed user, address indexed admin);
    event UserRevoked(address indexed user, address indexed admin);
    event RiskScoreUpdated(address indexed user, uint8 newScore, address indexed admin);
    event PolicyUpdated(uint8 minActive, uint8 minVip, address indexed admin);

    constructor() ERC20("Sentinel RWA Pro", "SENT") {
        // Setup Governance
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(COMPLIANCE_ROLE, msg.sender); // Deployer juga Compliance Officer
        
        _mint(msg.sender, 1_000_000 * 10**decimals());
    }

    function connectToRust(address _rustAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(!isConnected, "Already connected");
        stylusLogic = ISentinelStylus(_rustAddress);
        stylusLogic.init(address(this)); 
        
        // Auto Whitelist Admin
        try stylusLogic.addToWhitelist(msg.sender) {} catch {}
        try stylusLogic.setRiskScore(msg.sender, 100) {} catch {}
        
        isConnected = true;
    }

    function _update(address from, address to, uint256 value) internal override {
        if (isConnected && from != address(0) && to != address(0)) {
            bool allowed = stylusLogic.checkTransfer(from, to, value);
            if (!allowed) {
                revert("Sentinel: Transfer Denied (Policy Violation)");
            }
        }
        super._update(from, to, value);
    }

    // === COMPLIANCE FUNCTIONS (Role Based) ===
    
    function whitelistUser(address _user) external onlyRole(COMPLIANCE_ROLE) {
        stylusLogic.addToWhitelist(_user);
        emit UserWhitelisted(_user, msg.sender); // Audit Trail
    }

    function revokeUser(address _user) external onlyRole(COMPLIANCE_ROLE) {
        stylusLogic.removeFromWhitelist(_user);
        emit UserRevoked(_user, msg.sender);
    }

    function updateUserScore(address _user, uint8 _score) external onlyRole(COMPLIANCE_ROLE) {
        stylusLogic.setRiskScore(_user, _score);
        emit RiskScoreUpdated(_user, _score, msg.sender);
    }

    // === POLICY CONFIGURATION (Admin Only) ===
    
    function updatePolicyConfig(uint8 _minActive, uint8 _minVip) external onlyRole(DEFAULT_ADMIN_ROLE) {
        stylusLogic.set_policy_config(_minActive, _minVip);
        emit PolicyUpdated(_minActive, _minVip, msg.sender);
    }

    function setSystemPause(bool _paused) external onlyRole(DEFAULT_ADMIN_ROLE) {
        stylusLogic.set_paused(_paused);
    }

    function getUserData(address _user) external view returns (bool isWhitelisted, uint8 score) {
        if (!isConnected) return (false, 0);
        return stylusLogic.getUserStatus(_user);
    }
}