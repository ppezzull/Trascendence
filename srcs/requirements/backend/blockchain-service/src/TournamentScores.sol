// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title TournamentScores
/// @notice Simple append-only tournament score storage. Each tournament is identified by a bytes32 id.
contract TournamentScores {
	struct Entry {
		bytes32 nicknameHash; // keccak256(lowercase(nickname))
		uint32 score;
	}

	struct Tournament {
		bool exists;
		uint64 createdAt;
		Entry[] entries;
		mapping(bytes32 => bool) seen; // prevent duplicate nicknameHash
	}

	mapping(bytes32 => Tournament) private tournaments;

	event TournamentCreated(bytes32 indexed tournamentId, address indexed creator, uint64 createdAt);
	event ScoreSubmitted(bytes32 indexed tournamentId, bytes32 indexed nicknameHash, uint32 score, address indexed submitter);

	/// @notice Create a new tournament id. Reverts if already exists.
	function createTournament(bytes32 tournamentId) external {
		Tournament storage t = tournaments[tournamentId];
		require(!t.exists, "Tournament exists");
		t.exists = true;
		t.createdAt = uint64(block.timestamp);
		emit TournamentCreated(tournamentId, msg.sender, t.createdAt);
	}

	/// @notice Submit a score for a tournament. Reverts when tournament doesn't exist or nickname already submitted.
	function submitScore(bytes32 tournamentId, bytes32 nicknameHash, uint32 score) external {
		Tournament storage t = tournaments[tournamentId];
		require(t.exists, "Tournament does not exist");
		require(!t.seen[nicknameHash], "Nickname already submitted");
		t.entries.push(Entry({ nicknameHash: nicknameHash, score: score }));
		t.seen[nicknameHash] = true;
		emit ScoreSubmitted(tournamentId, nicknameHash, score, msg.sender);
	}

	/// @notice Returns the leaderboard entries in insertion order.
	function getLeaderboard(bytes32 tournamentId) external view returns (Entry[] memory) {
		Tournament storage t = tournaments[tournamentId];
		require(t.exists, "Tournament does not exist");
		Entry[] memory out = new Entry[](t.entries.length);
		for (uint256 i = 0; i < t.entries.length; i++) {
			out[i] = t.entries[i];
		}
		return out;
	}

	/// @notice Number of entries for a tournament.
	function getEntryCount(bytes32 tournamentId) external view returns (uint256) {
		Tournament storage t = tournaments[tournamentId];
		require(t.exists, "Tournament does not exist");
		return t.entries.length;
	}
}
