import { expect } from "chai";
const { ethers, network } = require('hardhat')

const {
    BigNumber,
    FixedFormat,
    FixedNumber,
    formatFixed,
    parseFixed
} = require("@ethersproject/bignumber");

describe("DesignVault", () => {
    const BASE_TEN = 10
    const decimals = 18

    let supplyAmount = 500000000
    const initialSupply = BigNumber.from(supplyAmount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    let account1 : any;
    let account2 : any;
    let account3 : any; 
    let account4 : any;
    let tokenOwner : any;
    let vaultOwner : any;
    let token, docToken : any;
    let prov;

    let totalAmount2 = 250000
    const totalAmount = BigNumber.from(totalAmount2).mul(BigNumber.from(BASE_TEN).pow(decimals))
    let stakerVault : any;

    let lptgeAmount2 = 250000      //250,000
    const lptgeAmount = BigNumber.from(lptgeAmount2).mul(BigNumber.from(BASE_TEN).pow(decimals))

    let lpfistClaim2 = 0      //0
    const lpfistClaim = BigNumber.from(lpfistClaim2).mul(BigNumber.from(BASE_TEN).pow(decimals))

    const claimAllAmount = (totalAmount - lptgeAmount - lpfistClaim)
    // console.log(claimAllAmount)
    const averageClaimAmount = claimAllAmount/36
    // console.log(averageClaimAmount)
    
    
    let totalClaim = 36
    let periodTimesPerClaim = 60 * 10; // 5 mins

    let tgeTime : any;
    let tgeTime2 : any;
    let firstClaimTime : any;
    let startTime : any;

    let provider : any;

    before(async () => {
        [ tokenOwner, vaultOwner, account1, account2, account3, account4 ] = await ethers.getSigners();
        token = await ethers.getContractFactory("DOC");
        prov = ethers.getDefaultProvider();

        docToken = await token.deploy("DocToken", "DOC", initialSupply, tokenOwner.address);

        const TreasuryVault = await ethers.getContractFactory("DEXListingVault");
        stakerVault = await TreasuryVault.deploy(docToken.address);
        stakerVault.connect(vaultOwner).deployed();
        
        provider = ethers.provider;

        await docToken.transfer(stakerVault.address, totalAmount)
        // console.log(Number((await docToken.balanceOf(lpStakingVault.address)/BigNumber.from(BASE_TEN).pow(18))))
    })

    describe("DEXListingVaultTest", () => {
        describe("setting", () => {
            it("check name, doc ", async function() {
                expect(await stakerVault.name()).to.equal("DEXListing");
                expect(await stakerVault.doc()).to.equal(docToken.address);
            });
    
            it("check the onlyOwner", async () => {
                let curBlock = await ethers.provider.getBlock();
                tgeTime = curBlock.timestamp + 50;
                firstClaimTime = tgeTime + 1000;
                startTime = firstClaimTime + 100;
    
                await expect(stakerVault.connect(account1).initialize(
                    totalAmount,
                    totalClaim,
                    startTime,
                    periodTimesPerClaim
                )).to.be.revertedWith("Accessible: Caller is not an admin");
    
                await expect(stakerVault.connect(account1).allSetting(
                    [lptgeAmount,tgeTime],
                    [lpfistClaim,firstClaimTime]
                )).to.be.revertedWith("Accessible: Caller is not an admin");
    
                await expect(stakerVault.connect(account1).tgeSetting(
                    lptgeAmount,
                    tgeTime
                )).to.be.revertedWith("Accessible: Caller is not an admin");
    
                await expect(stakerVault.connect(account1).firstClaimSetting(
                    lpfistClaim,
                    firstClaimTime
                )).to.be.revertedWith("Accessible: Caller is not an admin");
    
                await expect(stakerVault.connect(account1).tgeClaim(
                    account1.address
                )).to.be.revertedWith("Accessible: Caller is not an admin");
    
                await expect(stakerVault.connect(account1).claim(
                    account1.address
                )).to.be.revertedWith("Accessible: Caller is not an admin");
            })
    

            it("tgeSetting", async () => {
                await stakerVault.connect(tokenOwner).tgeSetting(
                    lptgeAmount,tgeTime
                );
    
                expect(await stakerVault.tgeAmount()).to.equal(lptgeAmount);
                expect(await stakerVault.tgeTime()).to.equal(tgeTime);
            })
        })
        describe("claim", () =>{
            it("tgeClaim before time", async () => {
                await expect(stakerVault.connect(tokenOwner).tgeClaim(
                    account1.address
                )).to.be.revertedWith("Designed Valut: need the tgeTime");
            })
    
            it("tgeClaim after time", async () => {
                expect(await docToken.balanceOf(account1.address)).to.equal(0);
    
                await ethers.provider.send('evm_setNextBlockTimestamp', [tgeTime]);
                await ethers.provider.send('evm_mine');
                
                await stakerVault.connect(tokenOwner).tgeClaim(
                    account1.address
                );
    
                expect(await docToken.balanceOf(account1.address)).to.equal(lptgeAmount);
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