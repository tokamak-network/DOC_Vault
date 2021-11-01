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

  const Vault = await ethers.getContractFactory("DEXListingVault");
  const vaultContract = await Vault.deploy(docAddress);

  await vaultContract.deployed();

  console.log("DEXListingVault Address:", vaultContract.address);
  console.log("setting start");

  const BASE_TEN = 10
  const decimals = 18

  const tgeTime = 1636099200    //2021년 11월 5일 금요일 오후 5:00:00 GMT+09:00
  const tgeAmount = 250000      //250,000
  const tgeBigAmount =  BigNumber.from(tgeAmount).mul(BigNumber.from(BASE_TEN).pow(decimals))

  let tx = await vaultContract.connect(deployer).tgeSetting(tgeBigAmount,tgeTime)
  await tx.wait()

  let tx2 = Number(await vaultContract.tgeAmount())
  console.log("tx2 :", tx2, ", tgeBigAmount : ", Number(tgeBigAmount))
  console.log("finish")
  //전송 후 DOC 토큰 전송 필요
  //npx hardhat verify --contract contracts/DEXListingVault.sol:DEXListingVault a b --network rinkeby
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
