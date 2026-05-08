// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SentinelToken.sol";

contract SentinelLogic is ISentinelStylus {
    mapping(address => bool) public whitelisted;
    mapping(address => uint8) public risk_scores;
    address public admin;

    uint8 public min_score_active;
    uint8 public min_score_vip;
    bool public is_paused;

    modifier onlyAdmin() {
        require(msg.sender == admin, "SentinelLogic: Access Denied");
        _;
    }

    function init(address owner) external override {
        if (admin == address(0)) {
            admin = owner;
            min_score_active = 30;
            min_score_vip = 80;
            is_paused = false;
        }
    }

    function checkTransfer(address from, address to, uint256 amount) external view override returns (bool) {
        if (msg.sender != admin) return false;
        if (is_paused) return false;
        if (!whitelisted[from] || !whitelisted[to]) return false;

        uint8 score = risk_scores[from];
        uint256 limit;

        if (score < min_score_active) {
            return false;
        } else if (score < min_score_vip) {
            limit = 1_000_000_000_000_000_000_000; // 1,000 SENT
        } else {
            limit = 1_000_000_000_000_000_000_000_000; // 1,000,000 SENT
        }

        if (amount > limit) return false;
        return true;
    }

    function set_policy_config(uint8 min_active, uint8 min_vip) external override onlyAdmin {
        min_score_active = min_active;
        min_score_vip = min_vip;
    }

    function set_paused(bool paused) external override onlyAdmin {
        is_paused = paused;
    }

    function addToWhitelist(address user) external override onlyAdmin {
        whitelisted[user] = true;
        risk_scores[user] = 50;
    }

    function removeFromWhitelist(address user) external override onlyAdmin {
        whitelisted[user] = false;
        risk_scores[user] = 0;
    }

    function setRiskScore(address user, uint8 score) external override onlyAdmin {
        require(score <= 100, "Score max 100");
        risk_scores[user] = score;
    }

    function getUserStatus(address user) external view override returns (bool, uint8) {
        return (whitelisted[user], risk_scores[user]);
    }
}
