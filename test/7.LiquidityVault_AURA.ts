import { expect } from "chai";
const { ethers, network } = require('hardhat')

const {
    BigNumber,
    FixedFormat,
    FixedNumber,
    formatFixed,
    parseFixed
} = require("@ethersproject/bignumber");

describe("LiquidityVault", () => {
    const BASE_TEN = 10
    const decimals = 18

    let supplyAmount = 100000000
    const initialSupply = BigNumber.from(supplyAmount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    let account1 : any;
    let account2 : any;
    let account3 : any; 
    let account4 : any;
    let tokenOwner : any;
    let vaultOwner : any;
    let token, docToken : any;
    let prov;

    let totalAmount2 = 5000000
    const totalAmount = BigNumber.from(totalAmount2).mul(BigNumber.from(BASE_TEN).pow(decimals))
    let stakerVault : any;

    let lpfistClaim2 = 3000000      //3,000,000
    const lpfistClaim = BigNumber.from(lpfistClaim2).mul(BigNumber.from(BASE_TEN).pow(decimals))

    let monthReward = 400000        //400,000
    const monthBigReward = BigNumber.from(monthReward).mul(BigNumber.from(BASE_TEN).pow(decimals))

    const claimAllAmount = (totalAmount - lpfistClaim)
    // console.log(claimAllAmount)
    // console.log(averageClaimAmount)
    
    let totalClaim = 6

    let periodTimesPerClaim = 60 * 10; // 5 mins

    let firstClaimTime : any;
    let startTime : any;

    let provider : any;

    before(async () => {
        [ tokenOwner, vaultOwner, account1, account2, account3, account4 ] = await ethers.getSigners();
        token = await ethers.getContractFactory("DOC");
        prov = ethers.getDefaultProvider();

        docToken = await token.deploy("DocToken", "DOC", initialSupply, tokenOwner.address);

        const TreasuryVault = await ethers.getContractFactory("LiquidityVault");
        stakerVault = await TreasuryVault.deploy(docToken.address);
        stakerVault.connect(vaultOwner).deployed();
        
        provider = ethers.provider;

        await docToken.transfer(stakerVault.address, totalAmount)
        // console.log(Number((await docToken.balanceOf(lpStakingVault.address)/BigNumber.from(BASE_TEN).pow(18))))
    })

    describe("DEXListingVaultTest", () => {
        describe("setting", () => {
            it("check name, doc ", async function() {
                expect(await stakerVault.name()).to.equal("Liquidity");
                expect(await stakerVault.token()).to.equal(docToken.address);
            });
    
            it("check the onlyOwner", async () => {
                let curBlock = await ethers.provider.getBlock();
                firstClaimTime = curBlock.timestamp + 1000;
                startTime = firstClaimTime + 100;
    
                await expect(stakerVault.connect(account1).initialize(
                    totalAmount,
                    totalClaim,
                    startTime,
                    periodTimesPerClaim
                )).to.be.revertedWith("Accessible: Caller is not an admin");
        
                await expect(stakerVault.connect(account1).firstClaimSetting(
                    lpfistClaim,
                    firstClaimTime
                )).to.be.revertedWith("Accessible: Caller is not an admin");
    
                await expect(stakerVault.connect(account1).claim(
                    account1.address
                )).to.be.revertedWith("Accessible: Caller is not an admin");
            })
    

            it("firstClaimSetting", async () => {
                await stakerVault.connect(tokenOwner).firstClaimSetting(
                    lpfistClaim,firstClaimTime
                );
    
                expect(await stakerVault.firstClaimAmount()).to.equal(lpfistClaim);
                expect(await stakerVault.firstClaimTime()).to.equal(firstClaimTime);
            })

            it("initialize", async () => {
                await stakerVault.connect(tokenOwner).initialize(
                    totalAmount,
                    totalClaim,
                    startTime,
                    periodTimesPerClaim
                );

                expect(await stakerVault.totalAllocatedAmount()).to.equal(totalAmount);
                expect(await stakerVault.totalClaimCounts()).to.equal(totalClaim);
                expect(await stakerVault.startTime()).to.equal(startTime);
                expect(await stakerVault.claimPeriodTimes()).to.equal(periodTimesPerClaim);
            })
        })
        describe("claim", () =>{
            it("claim before time", async () => {
                await expect(stakerVault.connect(tokenOwner).claim(
                    account1.address
                )).to.be.revertedWith("OnthersVault: not started yet");
            })
    
            it("claim after firstClaimtime", async () => {
                expect(await docToken.balanceOf(account1.address)).to.equal(0);
    
                await ethers.provider.send('evm_setNextBlockTimestamp', [firstClaimTime]);
                await ethers.provider.send('evm_mine');
                
                await stakerVault.connect(tokenOwner).claim(
                    account1.address
                );
    
                expect(await docToken.balanceOf(account1.address)).to.equal(lpfistClaim);
            })
            

            it("claim after startTime", async () => {
                expect(await docToken.balanceOf(account2.address)).to.equal(0);
    
                await ethers.provider.send('evm_setNextBlockTimestamp', [startTime]);
                await ethers.provider.send('evm_mine');
                
                await stakerVault.connect(tokenOwner).claim(
                    account2.address
                );

                let tx = await docToken.balanceOf(account2.address)
                // console.log(Number(tx))
                // console.log(monthBigReward)
    
                expect(await docToken.balanceOf(account2.address)).to.equal(monthBigReward);
            })


            it("claim after 1month", async () => {    
                await ethers.provider.send('evm_setNextBlockTimestamp', [startTime + periodTimesPerClaim]);
                await ethers.provider.send('evm_mine');
                
                await stakerVault.connect(tokenOwner).claim(
                    account2.address
                );

                let tx = await docToken.balanceOf(account2.address)
                // console.log(Number(tx))
                // console.log(Number(monthBigReward*2))
    
                expect(Number(tx)).to.equal(Number(monthBigReward*2));
            })

            it("claim after 5month", async () => {    
                await ethers.provider.send('evm_setNextBlockTimestamp', [startTime + (periodTimesPerClaim*5)]);
                await ethers.provider.send('evm_mine');
                
                await stakerVault.connect(tokenOwner).claim(
                    account2.address
                );

                let tx = await docToken.balanceOf(account2.address)
                // console.log(Number(tx))
                // console.log(Number(monthBigReward*5))
    
                expect(Number(tx)).to.equal(Number(monthBigReward*5));
            })
    
            // if("time setting", async () => {
            //     await ethers.provider.send('evm_setNextBlockTimestamp', [whitelistStartTime]);
            //     await ethers.provider.send('evm_mine');
    
            //     await ethers.provider.send("evm_increaseTime", [periodTimesPerClaim]);
            //     await ethers.provider.send('evm_mine');
            // })
        })
    })
})