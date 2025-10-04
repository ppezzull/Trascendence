# Foundry Workspace Setup for Blockchain Scores Module

This document provides the perfect context and structure for developing the **Tournament Scores** blockchain module using **Foundry**.

---

## 1. Network
- **Blockchain:** Avalanche Fuji test network
- **Chain ID:** 43113
- **RPC URL:** https://api.avax-test.network/ext/bc/C/rpc
- **Purpose:** Safe public testnet where data is permanent and cannot be changed once written.

---

## 2. Smart Contract Framework
- **Language:** Solidity (v0.8.x)
- **Framework:** Foundry (forge, cast, anvil)
- **Usage:**
  - Compile Solidity contracts (`forge build`)
  - Run Solidity-based tests (`forge test`)
  - Deploy contracts to Fuji (`forge create`)
  - Simulate locally with Anvil (local blockchain)

---

## 3. Data Structure (Solidity)
```solidity
struct Entry {
    bytes32 nicknameHash; // unique code from player nickname
    uint32 score;
}

struct Tournament {
    bool exists;
    uint64 createdAt;
    Entry[] entries;              // append-only list of scores
    mapping(bytes32 => bool) seen; // prevent duplicates
}

mapping(bytes32 => Tournament) public tournaments;
```

- **Tournament ID:** bytes32, derived from keccak256(season, bracket, date)
- **Nickname:** turned into lowercase hash before storing
- **Entry:** nicknameHash + score, added once per nickname

---

## 4. Backend (Fastify)
- Stores the organizer's private key in `.env`
- Validates and hashes nicknames before submitting scores
- Submits scores via `submitScore()` transaction
- Optionally exposes read endpoints for leaderboards

---

## 5. Frontend (React + Viem)
- Reads data directly from the blockchain using public RPC
- Displays tournament leaderboards
- Calls backend API to submit new scores (backend signs transactions)

---

## 6. Docker/CI
- After deployment, export:
  - Contract address
  - Chain ID
  - ABI
- Save into `contracts.manifest.json`:
```json
{
  "address": "0x...",
  "chainId": 43113,
  "abiPath": "PongScores.abi.json"
}
```
- Shared between backend and frontend containers
- `docker compose up` should start the entire stack in one command

---

## 7. Flow
1. Tournament created → stored on-chain with unique ID
2. Organizer submits scores via backend → validated and written on-chain
3. Data is permanent and visible on Avalanche Fuji explorer
4. Frontend fetches scores from the blockchain → leaderboard displayed
5. Anyone can verify scores directly from the contract

---

## 8. Commands (Cheat Sheet)
- **Build contracts:** `forge build`
- **Run tests:** `forge test`
- **Local dev chain:** `anvil`
- **Deploy contract to Fuji:**
```bash
forge create src/TournamentScores.sol:TournamentScores \\
  --rpc-url $FUJI_RPC \\
  --private-key $DEPLOYER_PK
```

---

This workspace ensures compliance with the subject rules:
- Avalanche + Solidity + testing blockchain (required)
- Foundry is a subcomponent tool for dev/test, not a turnkey feature
- Backend/Frontend integration is done separately (Fastify + React)
- Dockerized single-command deployment for evaluation
