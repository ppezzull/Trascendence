# Major module: Store the score of a tournament in the Blockchain.

ID: 23
Owner: Pietro Jairo Pezzullo

# Network

- Avalanche Fuji test network
- Public, cannot erase or change data once written
- Used as a permanent scoreboard

## Smart contract framework

- Language: Solidity
- Tool: Foundry (compile, test, deploy)
- Purpose: Define how tournaments and scores are stored

## Data structure

- Tournament ID (unique identifier)
- Player nickname → turned into a hash
- Entry = { nickname code, score }
- Append-only list, no duplicates

## Backend (Fastify)

- Holds organizer’s private key
- Validates requests
- Sends scores to the network

## Frontend (React)

- Reads scores directly from the network
- Shows leaderboard
- Asks backend to submit new scores

## Docker/CI

- After deploy: save contract address + ABI in manifest
- Manifest shared with backend & frontend
- Single command starts server + site with correct config

## Flow

1. Tournament created → ID on the network
2. Organizer submits scores via backend
3. Scores saved permanently on the network
4. Frontend reads and displays leaderboard
5. Anyone can verify scores on Fuji explorer