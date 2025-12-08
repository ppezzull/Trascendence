// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/TournamentScores.sol";

contract DeployLocal is Script {
    function run() external returns (TournamentScores, address) {
        vm.startBroadcast();
        TournamentScores ts = new TournamentScores();
        address deployedAddress = address(ts);
        vm.stopBroadcast();

        console.log("TournamentScores deployed to:", deployedAddress);
        console.log("Transaction hash:", vm.txHash());
        console.log("Gas used:", vm.gasUsed());

        return (ts, deployedAddress);
    }
}