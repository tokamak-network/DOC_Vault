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

  const Vault = await ethers.getContractFactory("TeamVault");
  const vaultContract = await Vault.deploy(docAddress);

  await vaultContract.deployed();

  console.log("TeamVault Address:", vaultContract.address);
  console.log("setting start");

  const BASE_TEN = 10
  const decimals = 18
  
  const totalAllocatedAmount = 50000000   //50,000,000
  const totalBigAmount = BigNumber.from(totalAllocatedAmount).mul(BigNumber.from(BASE_TEN).pow(decimals))
  const totalClaimCounts = 36             //36회
  const startTime = 1667203200            //2022년 10월 31일 월요일 오후 5:00:00 GMT+09:00
  const claimPeriodTimes = 2592000        //30일
  
  let tx = await vaultContract.connect(deployer).initialize(
    totalBigAmount,
    totalClaimCounts,
    startTime,
    claimPeriodTimes
  )
  await tx.wait()

  let tx2 = Number(await vaultContract.totalClaimCounts())
  console.log("tx2 :", tx2, ", totalClaimCounts : ", totalClaimCounts)
  console.log("finish")
  
  //전송 후 DOC 토큰 전송 필요
  //npx hardhat verify --contract contracts/TeamVault.sol:TeamVault a b --network rinkeby
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
