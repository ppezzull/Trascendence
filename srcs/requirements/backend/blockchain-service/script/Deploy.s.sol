// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/TournamentScores.sol";

contract Deploy is Script {
	function run() external returns (TournamentScores) {
		vm.startBroadcast();
		TournamentScores ts = new TournamentScores();
		vm.stopBroadcast();
		return ts;
	}
}
