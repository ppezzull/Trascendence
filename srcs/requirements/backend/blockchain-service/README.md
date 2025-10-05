
# blockchain-service — TournamentScores (Foundry)

Small Foundry project containing the `TournamentScores` Solidity contract, tests and deploy script used to store tournament scores on Avalanche Fuji (testnet) or a local Anvil node.

This folder contains the Solidity contract and tests used to store tournament scores on-chain.
It is intended to be compiled and tested with Foundry and deployed to Avalanche Fuji (or a local Anvil node).

Overview
- Contract: `src/TournamentScores.sol`
- Tests: `test/TournamentScores.t.sol`, `test/EdgeCases.t.sol`
- Scripts: `script/Deploy.s.sol` (deploy helper)

Usage (quick)
- Build and test locally with Foundry (recommended):

```bash
cd srcs/requirements/backend/blockchain-service
forge build
forge test -vv
```

- Run a local development chain with Anvil and run tests against it (optional):

```bash
anvil &
forge test -vv
```

- Deploy a contract (example using `forge script`):

```bash
forge script script/Deploy.s.sol:Deploy --rpc-url $FUJI_RPC_URL --private-key $PRIVATE_KEY --broadcast
```

Data structures

- Entry (stored per submission)
	- `bytes32 nicknameHash` — keccak256(lowercase(nickname)). Storing the hash keeps the on-chain footprint small and avoids storing raw strings.
	- `uint32 score` — numeric score value.

- Tournament (stored in mapping by `bytes32 tournamentId`)
	- `uint64 createdAt` — timestamp when the tournament was created; used as the existence sentinel (0 => not created).
	- `Entry[] entries` — append-only array of submissions.
	- `mapping(bytes32 => bool) seen` — per-tournament map to prevent duplicate nicknameHash submissions.

- Global storage
	- `mapping(bytes32 => Tournament) tournaments` — main lookup for tournament data by id.
	- `address owner` — single owner able to create tournaments and transfer ownership.

Functions

- `createTournament(bytes32 tournamentId)` — only owner. Creates a tournament and sets `createdAt`. Reverts with `TournamentExists()` error if the id was already created.

- `submitScore(bytes32 tournamentId, bytes32 nicknameHash, uint32 score)` — open to any address. Appends an Entry and marks the nicknameHash as seen for that tournament. Reverts with `TournamentNotFound()` or `NicknameAlreadySubmitted()` custom errors.

- `getLeaderboard(bytes32 tournamentId) => Entry[]` — returns a full memory copy of the entries in insertion order. Use with caution for large tournaments; may be expensive.

 - NOTE: `getLeaderboard` was removed from the contract to avoid accidental OOGs for very large tournaments. If you previously relied on `getLeaderboard`, switch to `getTournamentEntries` (paged reads).

 - `getTournamentEntries(bytes32 tournamentId, uint256 start, uint256 count) => Entry[]` — paginated view to read a slice of the leaderboard safely.

- `getEntryCount(bytes32 tournamentId) => uint256` — number of entries in the tournament.

- `tournamentExists(bytes32 tournamentId) => bool` — cheap view to check existence (`createdAt != 0`). Useful for UI and backend pre-checks.

- `transferOwnership(address newOwner)` — only owner; transfers ownership with `NewOwnerZero()` protection.

Errors & Events

- Custom errors are used to reduce revert gas cost: `TournamentExists`, `TournamentNotFound`, `NicknameAlreadySubmitted`, `NotOwner`, `NewOwnerZero`.
- Events: `TournamentCreated`, `ScoreSubmitted`, `OwnershipTransferred`.

Testing

- Tests are written with Forge (`forge-std/Test.sol`). Key test files:
	- `test/TournamentScores.t.sol` — unit tests: create, submit, duplicate prevention, ownership transfer, non-existent tournament behavior.
	- `test/EdgeCases.t.sol` — fuzz tests (nickname uniqueness), large-leaderboard insertion, pagination and `tournamentExists` checks.

- Run tests with:

```bash
forge test -vv
```

- Notes on tests:
	- Tests were updated to expect custom errors by using `vm.expectRevert(abi.encodeWithSelector(...))`.
	- Fuzz tests run with the default Forge fuzzing runs (256) in CI/local runs; they help ensure uniqueness/invariants.

Interacting from outside (example using viem / ethers-like clients)

Two common integration scenarios:

1) Backend (Fastify) sends transactions to submit scores.
	 - Backend responsibility: hold organizer/deployer private key securely (in `.env`, not in repo), validate incoming requests (unique nickname, signature or auth), canonicalize nickname to lowercase, compute `nicknameHash = keccak256(bytes(lowercase(nickname)))`, then call `submitScore` on the contract.

2) Frontend or backend reads leaderboards directly with an RPC provider (public read-only).

viem example (TypeScript) — simple read and submit flow outline

```ts
import { createPublicClient, createWalletClient, http } from 'viem'
import { foundry } from 'viem/chains'
import { parseAbi } from 'abitype'

const ABI = parseAbi([
	'function getTournamentEntries(bytes32,uint256,uint256) view returns ((bytes32,uint32)[])',
	'function submitScore(bytes32,bytes32,uint32)',
]);

// Read-only client (frontend)
const publicClient = createPublicClient({ chain: foundry, transport: http('https://rpc.ankr.com/avalanche_fuji') });

// Wallet client (backend) — used to broadcast transactions
// Use private key in secure env; here is an example with wallet client
// const walletClient = createWalletClient({ chain: avalancheFuji, transport: http(FUJI_RPC_URL), account: privateKeyAccount(privateKey) });

// Example: compute nickname hash
function nicknameHash(nick: string) {
	return keccak256(toUtf8Bytes(nick.toLowerCase()));
}

// Example reading a page
const tid = '0x' + keccak256(toUtf8Bytes('tournament-1')).slice(2);
const page = await publicClient.readContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: 'getTournamentEntries', args: [tid, 0n, 50n] });

// Example (backend) submitting a score — this requires a signed tx from the organizer key
// await walletClient.writeContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: 'submitScore', args: [tid, nicknameHash('Alice'), 42] });
```

Security considerations for outside integrators

- Always canonicalize nicknames (lowercase + trim) before hashing to avoid duplicates due to case or whitespace.
- Do not store private keys in repo. Use environment variables and secure vaults for production.
- Protect `submitScore` endpoint on backend with authentication and rate limiting to avoid spam or griefing.
- Use `tournamentExists` before attempting to submit to save gas and provide quick UX feedback.

Manifest & CI

- After deployment to Fuji the CI pipeline should generate a manifest containing the deployed contract address and ABI (e.g. `contracts.manifest.json`) which backend/frontend use to wire up the application.

Troubleshooting

 - If you previously used `getLeaderboard` and experienced OOGs on very large tournaments, switch to `getTournamentEntries` to iterate pages.
- If tests fail locally, run `forge fmt` and `forge test -vv` and inspect failure stacktraces; tests include helpful vm prank/expectRevert usage.
