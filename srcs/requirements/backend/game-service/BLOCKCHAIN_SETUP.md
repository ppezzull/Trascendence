# Blockchain Tournament System Setup

This system stores tournament scores on blockchain for permanent, transparent record-keeping.

## How It Works

**Blockchain-First means:** Tournament scores are stored permanently on blockchain, not database.
- Database: Tournament metadata, registrations, bracket information
- Blockchain: Immutable scores that cannot be changed once submitted
- Privacy: Player names are hashed on blockchain
- Transparency: Anyone can verify scores on blockchain

**Deployed Smart Contract:** TournamentScores on Avalanche Mainnet

## Local Setup (5 minutes)

Perfect for development without blockchain costs.

### Step 1: Install Anvil
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Step 2: Start Local Blockchain
```bash
anvil
# You'll see RPC URL: http://127.0.0.1:8545
```

### Step 3: Deploy Contract Locally
```bash
cd ../blockchain-service
forge script script/Deploy.s.sol:Deploy \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
```

Copy the contract address from output.

### Step 4: Configure Game Service
```bash
cd ../game-service
cp .env.local.example .env
# Edit .env file with your deployed contract address
```

### Step 5: Start Game Service
```bash
npm install
npm run build
npm run dev
```

## Production Setup

For production deployment on Avalanche mainnet.

### Requirements
- Production AVAX tokens
- Secure private key storage
- Contract deployed to mainnet
- HTTPS configured

### Configuration
```bash
cp .env.prod.example .env
```

Edit the production variables:
- BLOCKCHAIN_PRIVATE_KEY: Your production private key
- TOURNAMENT_SCORES_CONTRACT_ADDRESS: Your mainnet contract address
- JWT_SECRET: Secure secret matching user-service
- CORS_ORIGIN: Your production domain
- External service URLs: Production endpoints

### Security Requirements
- Never commit private keys to version control
- Use hardware wallet for mainnet private key
- Enable HTTPS only
- Set up monitoring and alerting
- Configure backups

## Test the Integration

### Create Tournament
```bash
curl -X POST http://localhost:3003/api/tournaments \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Tournament",
    "game_id": 1,
    "max_players": 4,
    "tournament_type": "single_elimination"
  }'
```

### Submit Score to Blockchain
```bash
curl -X POST http://localhost:3003/api/tournaments/1/submit-score \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"playerAlias": "Player1", "score": 100}'
```

### Verify on Blockchain
```bash
curl http://localhost:3003/api/tournaments/1/verify
```

## Troubleshooting

### "Invalid Address" Error
Check contract address format (0x + 40 hex characters)

### "RPC Connection Failed"
Verify RPC URL and blockchain is running

### "Contract Not Deployed"
Deploy contract first before using game service

### "JWT Invalid"
Ensure JWT_SECRET matches user-service

### "Database Locked"
Delete data/games.db and restart

## Architecture

### What's Stored on Blockchain
- Tournament IDs (hashed names)
- Player names (hashed for privacy)
- Scores (uint32 values)
- Timestamps

### What's Stored in Database
- Tournament metadata
- Player registrations
- Bracket information
- Real user profiles

### Privacy Protection
Player names are hashed: `keccak256(lowercase(playerName))`

Only the hash is stored on blockchain, protecting privacy while preventing duplicates.

## Quick Setup Script

Use the automated setup script:
```bash
./setup.sh
# Choose environment (Local or Production)
```

This copies the appropriate environment template and guides you through setup.

## Files and Structure

- `src/providers/TournamentProvider.ts`: Blockchain integration
- `src/models/TournamentModel.ts`: Tournament logic with blockchain
- `src/abi/TournamentScores.json`: Smart contract ABI
- `../blockchain-service/src/TournamentScores.sol`: Smart contract code

## Security Notes

- Private keys must be kept secure
- Different keys for each environment
- Scores are immutable once submitted
- Database only stores metadata
- Blockchain provides transparency and verifiability

Your blockchain tournament system is ready for use with permanent, transparent score storage.