// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/TournamentScores.sol";

/// @title TournamentScores edge-case tests
/// @notice Tests large leaderboards, gas profiling and fuzzing nickname uniqueness.
contract EdgeCasesTest is Test {
    TournamentScores ts;
    address owner = address(0xABCD);
    address alice = address(0xBEEF);

    /// @notice Deploy fresh contract with `owner` as deployer.
    function setUp() public {
        vm.prank(owner);
        ts = new TournamentScores();
    }

    /// @notice Insert many entries (N) into a tournament and then read the full leaderboard.
    /// @dev This test checks that the contract can handle a moderately large number of entries and
    /// returns correct counts. It also logs the gas used to copy the leaderboard to memory.
    function testLargeLeaderboardInsertionAndRead() public {
        bytes32 tid = keccak256("big-tournament");
        vm.prank(owner);
        ts.createTournament(tid);

        uint256 N = 300; // moderate size — adjust if you want heavier stress
        for (uint256 i = 0; i < N; i++) {
            bytes32 nick = keccak256(abi.encodePacked("nick-", i));
            // derive a pseudo-unique submitter address per entry
            address submitter = address(
                uint160(
                    uint256(keccak256(abi.encodePacked(i, block.timestamp)))
                )
            );
            vm.prank(submitter);
            ts.submitScore(tid, nick, uint32(i));
        }

        // Ensure count matches
        uint256 count = ts.getEntryCount(tid);
        assertEq(count, N);

        // Read the leaderboard via pagination to avoid copying the full storage in one call.
        TournamentScores.Entry[] memory lb = ts.getTournamentEntries(tid, 0, N);
        // sanity checks
        assertEq(lb.length, N);
    }

    /// @notice Profile gas for a single submit and ensure it is non-zero.
    /// @dev Logs gas used for a single `submitScore` invocation.
    function testGasSubmitProfiling() public {
        bytes32 tid = keccak256("gas-tournament");
        vm.prank(owner);
        ts.createTournament(tid);

        bytes32 nick = keccak256("guy");
        uint256 gasBefore = gasleft();
        vm.prank(alice);
        ts.submitScore(tid, nick, 123);
        uint256 gasUsed = gasBefore - gasleft();
        // basic assertion: gasUsed should be positive
        assertGt(gasUsed, 0);
    }

    /// @notice Fuzz test: for any nickname, first submission should succeed and second should revert with "Nickname already submitted".
    /// @param nickname Arbitrary bytes32 nicknameHash (fuzzed by Forge).
    function testFuzz_DuplicateNickname(bytes32 nickname) public {
        bytes32 tid = keccak256("fuzz-dup");
        vm.prank(owner);
        ts.createTournament(tid);

        vm.prank(alice);
        ts.submitScore(tid, nickname, 1);

        vm.prank(address(0xB0B0));
        vm.expectRevert(
            abi.encodeWithSelector(
                TournamentScores.NicknameAlreadySubmitted.selector
            )
        );
        ts.submitScore(tid, nickname, 2);
    }

    /// @notice Fuzz test: for any two different nicknames a and b, both submissions should be accepted.
    /// @param a first nicknameHash
    /// @param b second nicknameHash
    function testFuzz_DifferentNicknames(bytes32 a, bytes32 b) public {
        vm.assume(a != b);
        bytes32 tid = keccak256("fuzz-diff");
        vm.prank(owner);
        ts.createTournament(tid);

        vm.prank(alice);
        ts.submitScore(tid, a, 10);
        vm.prank(address(0xCAFE));
        ts.submitScore(tid, b, 20);

        uint256 c = ts.getEntryCount(tid);
        assertEq(c, 2);
    }

    /// @notice Ensure tournamentExists returns false for unknown id and true for created ones.
    function testTournamentExistsView() public {
        bytes32 tid = keccak256("exists-test");
        assertFalse(ts.tournamentExists(tid));
        vm.prank(owner);
        ts.createTournament(tid);
        assertTrue(ts.tournamentExists(tid));
    }

    /// @notice Test pagination boundaries: start >= length returns empty, count clamp works.
    function testGetTournamentEntriesPageBoundaries() public {
        bytes32 tid = keccak256("page-test");
        vm.prank(owner);
        ts.createTournament(tid);
        // add 5 entries
        for (uint256 i = 0; i < 5; i++) {
            bytes32 nick = keccak256(abi.encodePacked("p", i));
            vm.prank(address(uint160(i + 1)));
            ts.submitScore(tid, nick, uint32(i));
        }

        // start >= length
        TournamentScores.Entry[] memory empty = ts.getTournamentEntries(tid, 10, 10);
        assertEq(empty.length, 0);

        // request more than available -> returns remaining
        TournamentScores.Entry[] memory page = ts.getTournamentEntries(tid, 3, 10);
        assertEq(page.length, 2);
        assertEq(page[0].score, 3);
    }
}
