// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
const { BigNumber } = require("ethers")


async function main() {
  // We get the contract to deploy
  const [deployer] = await ethers.getSigners()
  console.log("Deploying contract with the account :", deployer.address)

  let docAddress = "0xb109f4c20bdb494a63e32aa035257fba0a4610a4" //rinkeby
  // let docAddress = "0x0e498afce58dE8651B983F136256fA3b8d9703bc" //mainnet

  let ownerAddress = "0xf0B595d10a92A5a9BC3fFeA7e79f5d266b6035Ea" //rinkeby
  // let ownerAddress = "0xc575848f69C710dA33A978384114010bdb15f4db" //mainnet

  const Vault = await ethers.getContractFactory("DAOFundVault");
  const vaultContract = await Vault.deploy(docAddress, ownerAddress);

  await vaultContract.deployed();

  console.log("DAOFundVault Address:", vaultContract.address);
  
  //전송 후 DOC 토큰 전송 필요
  //npx hardhat verify a b "DAOFundVault" --network rinkeby
  //npx hardhat verify --contract contracts/MarketingVault.sol:MarketingVault a b --network rinkeby
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
