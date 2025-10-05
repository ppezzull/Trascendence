// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title TournamentScores
/// @notice Lightweight append-only on-chain storage for tournament score submissions.
///
/// Design goals:
/// 1. Keep on-chain logic minimal and cheap: store entries (nicknameHash, score) in insertion order.
/// 2. Prevent duplicate submissions per tournament using a mapping of nickname hashes.
/// 3. Allow a single on-chain owner (deployer) to create tournaments; score submissions are open to any account.
///
/// Notes:
/// - nicknameHash is expected to be keccak256(lowercase(nickname)) to avoid case collisions; the contract stores the hash only.
/// - Leaderboard ordering is insertion order. Clients or off-chain services should compute rank/sort if needed.
/// - Reading the full leaderboard copies storage to memory and may be gas intensive for large tournaments; prefer pagination or off-chain reads.
contract TournamentScores {
    /// -----------------------------------------------------------------------
    /// Custom errors for gas-efficient revert reasons
    /// -----------------------------------------------------------------------
    error TournamentExists();
    error TournamentNotFound();
    error NicknameAlreadySubmitted();
    error NotOwner();
    error NewOwnerZero();

    /// @notice The owner with permission to create tournaments and transfer ownership.
    /// @dev Set to deployer in the constructor. Use `transferOwnership` to change.
    address public owner;

    /// @notice Emitted when ownership is transferred from `previousOwner` to `newOwner`.
    /// @param previousOwner The address of the previous owner (may be zero for initial deployment only in some patterns).
    /// @param newOwner The address of the new owner.
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /// @notice Restricts execution to the contract owner.
    /// @dev Reverts with "Not owner" when called by non-owner accounts.
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    /// @notice Construct the contract and set the deployer as the initial owner.
    /// @dev The deployer address will be assigned to `owner`.
    constructor() {
        owner = msg.sender;
    }

    /// @notice A single leaderboard entry representing a player's submission.
    /// @param nicknameHash keccak256(lowercase(nickname)) — the hashed, canonicalized player nickname. Stored instead of raw strings to save gas and privacy.
    /// @param score The submitted score for this entry. Interpretation (higher better / lower better) is handled off-chain.
    struct Entry {
        bytes32 nicknameHash; // keccak256(lowercase(nickname))
        uint32 score;
    }

    /// @notice Storage container for a single tournament instance.
    /// @dev `seen` is a mapping used to prevent duplicate nicknameHash submissions. `entries` is append-only.
    struct Tournament {
        uint64 createdAt;
        Entry[] entries;
        mapping(bytes32 => bool) seen; // prevent duplicate nicknameHash
    }

    /// @notice Mapping of tournamentId => Tournament storage.
    /// @dev Use a bytes32 id to keep keys compact and deterministic for off-chain lookup.
    mapping(bytes32 => Tournament) private tournaments;

    /// @notice Emitted when a new tournament is created.
    /// @param tournamentId The id used to reference the tournament.
    /// @param creator The address that created the tournament (owner account).
    /// @param createdAt Block timestamp when the tournament was created.
    event TournamentCreated(bytes32 indexed tournamentId, address indexed creator, uint64 createdAt);

    /// @notice Emitted when a score is submitted for a tournament.
    /// @param tournamentId The tournament id the submission targets.
    /// @param nicknameHash keccak256(lowercase(nickname)) of the submitter.
    /// @param score The submitted score value.
    /// @param submitter The address that submitted the score (tx sender).
    event ScoreSubmitted(
        bytes32 indexed tournamentId, bytes32 indexed nicknameHash, uint32 score, address indexed submitter
    );

    /// @notice Create a new tournament with id `tournamentId`.
    /// @dev Only callable by the contract `owner`. Reverts with "Tournament exists" if the id was already created.
    /// @param tournamentId A compact bytes32 identifier for the tournament (e.g. keccak256("tournament-1")).
    function createTournament(bytes32 tournamentId) external onlyOwner {
        Tournament storage t = tournaments[tournamentId];
        // Use createdAt == 0 as the sentinel for "not created". This distinguishes a default mapping value
        // from an explicitly created tournament (which records a non-zero block timestamp).
        if (t.createdAt != 0) revert TournamentExists();
        t.createdAt = uint64(block.timestamp);
        emit TournamentCreated(tournamentId, msg.sender, t.createdAt);
    }

    /// @notice Submit an entry for `tournamentId`.
    /// @dev Reverts if the tournament does not exist or the `nicknameHash` was already submitted for that tournament.
    /// @param tournamentId Identifier of the tournament to submit to.
    /// @param nicknameHash keccak256(lowercase(nickname)) — the hashed nickname of the player.
    /// @param score The score value associated with this submission.
    function submitScore(bytes32 tournamentId, bytes32 nicknameHash, uint32 score) external {
        Tournament storage t = tournaments[tournamentId];
        if (t.createdAt == 0) revert TournamentNotFound();
        if (t.seen[nicknameHash]) revert NicknameAlreadySubmitted();
        t.entries.push(Entry({nicknameHash: nicknameHash, score: score}));
        t.seen[nicknameHash] = true;
        emit ScoreSubmitted(tournamentId, nicknameHash, score, msg.sender);
    }


    /// @notice Number of entries submitted for `tournamentId`.
    /// @param tournamentId The tournament id to query.
    /// @return The number of entries (length of the leaderboard) for the tournament.
    function getEntryCount(bytes32 tournamentId) external view returns (uint256) {
        Tournament storage t = tournaments[tournamentId];
        if (t.createdAt == 0) revert TournamentNotFound();
        return t.entries.length;
    }

    /// @notice Transfer contract ownership to `newOwner`.
    /// @dev Only callable by the current owner. Emits `OwnershipTransferred`.
    /// @param newOwner The address to transfer ownership to. Cannot be the zero address.
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert NewOwnerZero();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /// @notice Check whether a tournament has been created (cheap off-chain check).
    /// @param tournamentId The tournament id to check.
    /// @return True if the tournament exists (createdAt != 0), false otherwise.
    function tournamentExists(bytes32 tournamentId) external view returns (bool) {
        return tournaments[tournamentId].createdAt != 0;
    }

    /// @notice Return a page (slice) of entries for a tournament. Safer than copying the entire leaderboard.
    /// @param tournamentId The tournament id to read.
    /// @param start Inclusive start index.
    /// @param count Maximum number of entries to return.
    /// @return An array of up to `count` entries starting at `start`.
    function getTournamentEntries(bytes32 tournamentId, uint256 start, uint256 count)
        public
        view
        returns (Entry[] memory)
    {
        Tournament storage t = tournaments[tournamentId];
        if (t.createdAt == 0) revert TournamentNotFound();
        uint256 available = t.entries.length;
        if (start >= available) return new Entry[](0);
        uint256 end = start + count;
        if (end > available) end = available;
        Entry[] memory out = new Entry[](end - start);
        for (uint256 i = start; i < end; i++) {
            out[i - start] = t.entries[i];
        }
        return out;
    }
}
