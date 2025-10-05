// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/TournamentScores.sol";

/// @title TournamentScores tests
/// @notice A small suite of unit tests for the `TournamentScores` contract covering creation, submission,
/// duplicate prevention and ownership transfer behavior.
/// @dev The tests use `vm.prank` to simulate transactions from different addresses and `vm.expectRevert` / `vm.expectEmit`
/// to assert expected reverts and events.
contract TournamentScoresTest is Test {
    TournamentScores ts;
    address owner = address(0xABCD);
    address alice = address(0xBEEF);
    address bob = address(0xCAFE);
    address carol = address(0xC0DE);

    // redeclare events so expectEmit can be used in tests
    /// @notice Mirror of the contract's TournamentCreated event for use with `vm.expectEmit` in tests.
    event TournamentCreated(bytes32 indexed tournamentId, address indexed creator, uint64 createdAt);
    /// @notice Mirror of the contract's ScoreSubmitted event for use with `vm.expectEmit` in tests.
    event ScoreSubmitted(
        bytes32 indexed tournamentId, bytes32 indexed nicknameHash, uint32 score, address indexed submitter
    );
    /// @notice Mirror of the contract's OwnershipTransferred event for use with `vm.expectEmit` in tests.
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /// @notice Deploy a fresh TournamentScores instance with `owner` as the deployer.
    /// @dev Uses `vm.prank(owner)` so the test-specified `owner` address becomes the contract owner.
    function setUp() public {
        vm.prank(owner);
        ts = new TournamentScores();
    }

    /// @notice Create a tournament as owner, submit a score as `alice`, and verify leaderboard contents and event emission.
    /// @dev Asserts that `getEntryCount` and `getLeaderboard` return the expected values after submission.
    ///
    /// Expected events:
    /// - `TournamentCreated(bytes32 indexed tournamentId, address indexed creator, uint64 createdAt)` emitted when owner creates the tournament.
    /// - `ScoreSubmitted(bytes32 indexed tournamentId, bytes32 indexed nicknameHash, uint32 score, address indexed submitter)` emitted when `alice` submits a score of 42.
    ///
    /// Expected reverts: none.
    function testCreateAndSubmit() public {
        bytes32 tid = keccak256("tournament-1");
        vm.prank(owner);
        vm.expectEmit(true, true, false, true);
        emit TournamentScores.TournamentCreated(tid, owner, uint64(block.timestamp));
        ts.createTournament(tid);
        bytes32 nick = keccak256("alice");
        vm.prank(alice);
        vm.expectEmit(true, true, false, true);
        emit TournamentScores.ScoreSubmitted(tid, nick, 42, alice);
        ts.submitScore(tid, nick, 42);
        uint256 count = ts.getEntryCount(tid);
        assertEq(count, 1);
    TournamentScores.Entry[] memory lb = ts.getTournamentEntries(tid, 0, 10);
    assertEq(lb[0].nicknameHash, nick);
    assertEq(lb[0].score, 42);
    }

    /// @notice Verify that duplicate nickname submissions for the same tournament revert with the expected message.
    /// @dev Creates a tournament as `owner`, submits once as `bob`, then expects a revert on the second submission.
    ///
    /// Expected events:
    /// - `TournamentCreated(...)` emitted on creation.
    /// - `ScoreSubmitted(..., score=10, submitter=bob)` emitted on first submission.
    ///
    /// Expected revert on second submission with reason: "Nickname already submitted".
    function testPreventDuplicate() public {
        bytes32 tid = keccak256("tournament-dup");
        vm.prank(owner);
        ts.createTournament(tid);
        bytes32 nick = keccak256("bob");
        vm.prank(bob);
        ts.submitScore(tid, nick, 10);
        vm.expectRevert(abi.encodeWithSelector(TournamentScores.NicknameAlreadySubmitted.selector));
        vm.prank(bob);
        ts.submitScore(tid, nick, 20);
    }

    /// @notice Ensure submissions to a non-existent tournament revert with "Tournament does not exist".
    /// @dev No tournament is created for the given id; submission should revert regardless of submitter.
    ///
    /// Expected revert reason: "Tournament does not exist".
    function testSubmitToNonExistentTournament() public {
        bytes32 tid = keccak256("nope");
        bytes32 nick = keccak256("carol");
        vm.expectRevert(abi.encodeWithSelector(TournamentScores.TournamentNotFound.selector));
        vm.prank(carol);
        ts.submitScore(tid, nick, 1);
    }

    /// @notice Creating a tournament with an id that already exists should revert with "Tournament exists".
    /// @dev The owner creates the tournament, then another create attempt by owner is expected to revert.
    ///
    /// Expected events: first call emits `TournamentCreated(...)`.
    /// Expected revert on second call with reason: "Tournament exists".
    function testCreateSameTournamentReverts() public {
        bytes32 tid = keccak256("already");
        vm.prank(owner);
        ts.createTournament(tid);
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(TournamentScores.TournamentExists.selector));
        ts.createTournament(tid);
    }

    /// @notice Confirm that only the owner can create tournaments; non-owners are rejected with "Not owner".
    /// @dev Attempts create from `alice` (non-owner) should revert; owner can create successfully.
    ///
    /// Expected revert reason when non-owner attempts create: "Not owner".
    /// Expected event when owner creates: `TournamentCreated(...)`.
    function testOnlyOwnerRestriction() public {
        bytes32 tid = keccak256("must-be-owner");
        // non-owner cannot create
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(TournamentScores.NotOwner.selector));
        ts.createTournament(tid);
        // owner can create
        vm.prank(owner);
        ts.createTournament(tid);
    }

    /// @notice Validate ownership transfer semantics: after transferring to `bob` the old owner can no longer create tournaments
    /// and the new owner can.
    /// @dev Emits `OwnershipTransferred(previousOwner, newOwner)` when ownership is transferred.
    ///
    /// Expected behavior and events:
    /// - `OwnershipTransferred(owner, bob)` emitted during transfer.
    /// - After transfer, calls to `createTournament` by the old owner revert with "Not owner".
    /// - The new owner (`bob`) can successfully call `createTournament(...)` and emit `TournamentCreated(...)`.
    function testTransferOwnership() public {
        bytes32 tid = keccak256("post-transfer");
        // initial owner creates
        vm.prank(owner);
        ts.createTournament(tid); // ok

        // transfer ownership to bob
        vm.prank(owner);
        vm.expectEmit(true, true, false, true);
        emit TournamentScores.OwnershipTransferred(owner, bob);
        ts.transferOwnership(bob);

        // old owner cannot create new tournament
        bytes32 t2 = keccak256("after-transfer");
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(TournamentScores.NotOwner.selector));
        ts.createTournament(t2);

        // new owner can create
        vm.prank(bob);
        ts.createTournament(t2);
    }
}
