// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const [deployer] = await ethers.getSigners()
  console.log("Deploying contract with the account :", deployer.address)

  let docAddress = "0xb109f4c20bdb494a63e32aa035257fba0a4610a4"

  const LPStakingVault = await ethers.getContractFactory("LPStakingVault");
  const lpStaking = await LPStakingVault.deploy(docAddress);

  await lpStaking.deployed();

  console.log("lpstaking Address:", lpStaking.address);
  //전송 후 DOC 토큰 전송 필요
  //npx hardhat verify --contract contracts/LPStakingVault.sol:LPStakingVault 0x4E77733e1ce977BC67DC77dAc725f4021aA5aDb1 0xb109f4c20bdb494a63e32aa035257fba0a4610a4 --network rinkeby
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
