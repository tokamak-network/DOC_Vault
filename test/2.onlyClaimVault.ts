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

    let totalAmount2 = 24750000
    const totalAmount = BigNumber.from(totalAmount2).mul(BigNumber.from(BASE_TEN).pow(decimals))
    let treasuryVault : any;

    let lptgeAmount2 = 0      //46296.3
    const lptgeAmount = BigNumber.from(lptgeAmount2).mul(BigNumber.from(BASE_TEN).pow(decimals))

    let lpfistClaim2 = 0      //1342592.59
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

        const TreasuryVault = await ethers.getContractFactory("TreasuryVault");
        treasuryVault = await TreasuryVault.deploy(docToken.address);
        treasuryVault.connect(vaultOwner).deployed();
        
        provider = ethers.provider;

        await docToken.transfer(treasuryVault.address, totalAmount)
        // console.log(Number((await docToken.balanceOf(lpStakingVault.address)/BigNumber.from(BASE_TEN).pow(18))))
    })

    describe("TreasuryTest", () => {
        describe("setting", () => {
            it("check name, doc ", async function() {
                expect(await treasuryVault.name()).to.equal("Treasury");
                expect(await treasuryVault.doc()).to.equal(docToken.address);
            });
    
            it("check the onlyOwner", async () => {
                let curBlock = await ethers.provider.getBlock();
                tgeTime = curBlock.timestamp + 50;
                firstClaimTime = tgeTime + 1000;
                startTime = firstClaimTime + 100;
    
                await expect(treasuryVault.connect(account1).initialize(
                    totalAmount,
                    totalClaim,
                    startTime,
                    periodTimesPerClaim
                )).to.be.revertedWith("Accessible: Caller is not an admin");
    
                await expect(treasuryVault.connect(account1).allSetting(
                    [lptgeAmount,tgeTime],
                    [lpfistClaim,firstClaimTime]
                )).to.be.revertedWith("Accessible: Caller is not an admin");
    
                await expect(treasuryVault.connect(account1).tgeSetting(
                    lptgeAmount,
                    tgeTime
                )).to.be.revertedWith("Accessible: Caller is not an admin");
    
                await expect(treasuryVault.connect(account1).firstClaimSetting(
                    lpfistClaim,
                    firstClaimTime
                )).to.be.revertedWith("Accessible: Caller is not an admin");
    
                await expect(treasuryVault.connect(account1).tgeClaim(
                    account1.address
                )).to.be.revertedWith("Accessible: Caller is not an admin");
    
                await expect(treasuryVault.connect(account1).claim(
                    account1.address
                )).to.be.revertedWith("Accessible: Caller is not an admin");
            })
    
            it("setting the basic", async () => {
                let curBlock = await ethers.provider.getBlock();
                tgeTime = curBlock.timestamp + 50;
                // console.log(tgeTime)
                firstClaimTime = tgeTime + 1000;
                startTime = firstClaimTime + 100;
    
                await treasuryVault.connect(tokenOwner).initialize(
                    totalAmount,
                    totalClaim,
                    startTime,
                    periodTimesPerClaim
                );
    
                expect(await treasuryVault.totalAllocatedAmount()).to.equal(totalAmount);
                expect(await treasuryVault.totalClaimCounts()).to.equal(totalClaim);
                expect(await treasuryVault.startTime()).to.equal(startTime);
                expect(await treasuryVault.claimPeriodTimes()).to.equal(periodTimesPerClaim);
            })
        })
        describe("claim", () =>{
            it("tgeClaim before time", async () => {
                await expect(treasuryVault.connect(tokenOwner).tgeClaim(
                    account1.address
                )).to.be.revertedWith("Designed Valut: need the tgeTime");
            })
    
            it("tgeClaim after time", async () => {
                expect(await docToken.balanceOf(account1.address)).to.equal(0);
    
                await ethers.provider.send('evm_setNextBlockTimestamp', [tgeTime]);
                await ethers.provider.send('evm_mine');

                await expect(treasuryVault.connect(tokenOwner).tgeClaim(
                    account1.address
                )).to.be.revertedWith("Designed Valut: need the tgeTime");
            })

            it("claim before time", async () => {
                await expect(treasuryVault.connect(tokenOwner).claim(
                    account1.address
                )).to.be.revertedWith("DesignedVault: not started yet");
            })

            it("claim after time", async () => {
                await expect(treasuryVault.connect(tokenOwner).claim(
                    account1.address
                )).to.be.revertedWith("DesignedVault: not started yet");
            })

            it("claim that time is round1", async () => {
                expect(await docToken.balanceOf(account3.address)).to.equal(0);
    
                await ethers.provider.send('evm_setNextBlockTimestamp', [startTime]);
                await ethers.provider.send('evm_mine');
                
                await treasuryVault.connect(tokenOwner).claim(
                    account3.address
                );

                let round = await treasuryVault.currentRound();
                expect(round).to.equal("1");
                    
                let tx = await docToken.balanceOf(account3.address);
                expect(Number(tx)).to.equal(Number(averageClaimAmount));
            })

            it("claim same round", async () => {
                await expect(treasuryVault.connect(tokenOwner).claim(
                    account1.address
                )).to.be.revertedWith("DesignedVault: already get this round");
            })

            it("claim that time is round2", async () => {    
                await ethers.provider.send("evm_increaseTime", [periodTimesPerClaim]);
                await ethers.provider.send('evm_mine');
                
                await treasuryVault.connect(tokenOwner).claim(
                    account3.address
                );

                let round = await treasuryVault.currentRound();
                expect(round).to.equal("2");
                    
                let tx = await docToken.balanceOf(account3.address);
                expect(Number(tx)).to.equal(Number(averageClaimAmount*2));
            })

            it("claim that time is round12", async () => {    
                await ethers.provider.send("evm_increaseTime", [periodTimesPerClaim*10]);
                await ethers.provider.send('evm_mine');
                
                await treasuryVault.connect(tokenOwner).claim(
                    account3.address
                );

                let round = await treasuryVault.currentRound();
                expect(round).to.equal("12");
                    
                let tx = await docToken.balanceOf(account3.address);
                expect(Number(tx)).to.equal(Number(averageClaimAmount*12));
            })

            it("claim that time is round22", async () => {    
                await ethers.provider.send("evm_increaseTime", [periodTimesPerClaim*10]);
                await ethers.provider.send('evm_mine');
                
                await treasuryVault.connect(tokenOwner).claim(
                    account3.address
                );

                let round = await treasuryVault.currentRound();
                expect(round).to.equal("22");
                    
                let tx = await docToken.balanceOf(account3.address);
                expect(Number(tx)).to.equal(Number(averageClaimAmount*22));
            })

            it("claim that time is round32", async () => {    
                await ethers.provider.send("evm_increaseTime", [periodTimesPerClaim*10]);
                await ethers.provider.send('evm_mine');
                
                await treasuryVault.connect(tokenOwner).claim(
                    account3.address
                );

                let round = await treasuryVault.currentRound();
                expect(round).to.equal("32");
                    
                let tx = await docToken.balanceOf(account3.address);
                expect(Number(tx)).to.equal(Number(averageClaimAmount*32));
            })

            it("claim that time is round35", async () => {    
                await ethers.provider.send("evm_increaseTime", [periodTimesPerClaim*3]);
                await ethers.provider.send('evm_mine');
                
                await treasuryVault.connect(tokenOwner).claim(
                    account3.address
                );

                let round = await treasuryVault.currentRound();
                expect(round).to.equal("35");
                    
                let tx = await docToken.balanceOf(account3.address);
                expect(Number(tx)).to.equal(Number(averageClaimAmount*35));
            })

            it("claim that time is round36", async () => {    
                await ethers.provider.send("evm_increaseTime", [periodTimesPerClaim]);
                await ethers.provider.send('evm_mine');
                
                await treasuryVault.connect(tokenOwner).claim(
                    account3.address
                );

                let round = await treasuryVault.currentRound();
                expect(round).to.equal("36");

                // let amount = await treasuryVault.calcalClaimAmount(36);
                // console.log(Number(amount))
                    
                let tx = await docToken.balanceOf(account3.address);
                // console.log(Number(tx))
                expect(Number(tx)).to.equal(Number(totalAmount)); 
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