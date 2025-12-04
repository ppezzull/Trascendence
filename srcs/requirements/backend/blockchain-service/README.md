# blockchain-service - TournamentScores (Foundry)

Foundry project containing the TournamentScores Solidity contract for storing tournament scores on blockchain.

## What It Does

TournamentScores.sol is a smart contract that stores tournament scores permanently:

- Immutable storage (scores cannot be changed once submitted)
- Transparent verification (anyone can check scores on blockchain)
- Privacy protection (player names are hashed)
- Duplicate prevention (each player can submit once per tournament)
- Owner control (only owner can create tournaments)

## Contract Deployment

### Local Development
```bash
cd srcs/requirements/backend/blockchain-service
forge build
forge test -vv

# Start Anvil
anvil &

# Deploy contract
forge script script/Deploy.s.sol:Deploy \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
```

### Production
```bash
# Deploy to mainnet
forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://api.avax.network/ext/bc/C/rpc \
  --private-key YOUR_PRIVATE_KEY \
  --broadcast
```

## Contract Functions

- `createTournament(bytes32 tournamentId)`: Create new tournament (owner only)
- `submitScore(bytes32 tournamentId, bytes32 nicknameHash, uint32 score)`: Submit player score
- `tournamentExists(bytes32 tournamentId)`: Check if tournament exists
- `getEntryCount(bytes32 tournamentId)`: Get number of submissions
- `getTournamentEntries(bytes32 tournamentId, uint256 start, uint256 count)`: Get paginated entries
- `owner()`: Get contract owner

## Integration

Used by game-service through:
- ABI: `../game-service/src/abi/TournamentScores.json`
- Provider: `../game-service/src/providers/TournamentProvider.ts`
- Integration: Automatic score submission when matches complete

## Architecture

### Data Storage
- `Entry`: Player submission (nickname hash, score)
- `Tournament`: Collection of entries with creation timestamp
- `tournaments mapping`: Tournament storage by ID
- `seen mapping`: Prevents duplicate submissions per tournament

### Privacy
Player names are hashed using `keccak256(lowercase(name))` to protect privacy while preventing duplicates.

### Gas Efficiency
- Append-only storage for entries
- Minimal on-chain logic
- Pagination support for large tournaments
- Duplicate prevention without expensive loops

## Testing

```bash
forge test -vv

# Run against specific contract
forge test --match-test testTournamentScores -vv
```

## Files Structure

- `src/TournamentScores.sol`: Main contract
- `test/TournamentScores.t.sol`: Core tests
- `test/EdgeCases.t.sol`: Edge case tests
- `script/Deploy.s.sol`: Deployment script

## Security Notes

- Contract owner can create tournaments
- Anyone can submit scores to existing tournaments
- Duplicate submissions are rejected
- Scores are immutable once submitted
- Names are hashed for privacy

The contract is designed for tournament score storage with minimal gas costs and maximum transparency.