// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/TournamentScores.sol";

contract TournamentScoresTest is Test {
    TournamentScores ts;

    function setUp() public {
        ts = new TournamentScores();
    }

    function testCreateAndSubmit() public {
        bytes32 tid = keccak256("tournament-1");
        ts.createTournament(tid);
        bytes32 nick = keccak256("alice");
        ts.submitScore(tid, nick, 42);
        uint256 count = ts.getEntryCount(tid);
        assertEq(count, 1);
        TournamentScores.Entry[] memory lb = ts.getLeaderboard(tid);
        assertEq(lb[0].nicknameHash, nick);
        assertEq(lb[0].score, 42);
    }

    function testPreventDuplicate() public {
        bytes32 tid = keccak256("tournament-dup");
        ts.createTournament(tid);
        bytes32 nick = keccak256("bob");
        ts.submitScore(tid, nick, 10);
        vm.expectRevert(bytes("Nickname already submitted"));
        ts.submitScore(tid, nick, 20);
    }

    function testSubmitToNonExistentTournament() public {
        bytes32 tid = keccak256("nope");
        bytes32 nick = keccak256("carol");
        vm.expectRevert(bytes("Tournament does not exist"));
        ts.submitScore(tid, nick, 1);
    }

    function testCreateSameTournamentReverts() public {
        bytes32 tid = keccak256("already");
        ts.createTournament(tid);
        vm.expectRevert(bytes("Tournament exists"));
        ts.createTournament(tid);
    }
}
