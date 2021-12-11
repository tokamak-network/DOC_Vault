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

  let auraToken = "0x14f9C438dD5008b1c269659AA3234cBcB431a844" //rinkeby
  // let auraToken = "0xaEC59E5b4f8DbF513e260500eA96EbA173F74149" //mainnet

  const Vault = await ethers.getContractFactory("PlayToEarnVault");
  const vaultContract = await Vault.deploy(auraToken);

  await vaultContract.deployed();

  console.log("PlayToEarnVault Address:", vaultContract.address);
  console.log("setting start");

  const BASE_TEN = 10
  const decimals = 18

  const totalAllocatedAmount = 20000000   //20,000,000
  const totalBigAmount = BigNumber.from(totalAllocatedAmount).mul(BigNumber.from(BASE_TEN).pow(decimals))
  const totalClaimCounts = 16             //16회
  const startTime = 1647936000            //2022년 3월 22일 화요일 오후 5:00:00
  const claimPeriodTimes = 7776000        //90일

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
  //전송 후 AURA 토큰 전송 필요
  //npx hardhat verify --contract contracts/DEXListingVault.sol:DEXListingVault a b --network rinkeby
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
