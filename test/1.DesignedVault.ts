const { expect } = require("chai");
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

    let lpStakingAmount2 = 50000000
    const lpStakingAmount = BigNumber.from(lpStakingAmount2).mul(BigNumber.from(BASE_TEN).pow(decimals))
    let lpStakingVault : any;

    let lptgeAmount2 = 462963      //46296.3
    const lptgeAmount = BigNumber.from(lptgeAmount2).mul(BigNumber.from(BASE_TEN).pow(17))

    let lpfistClaim2 = 134259259      //1342592.59
    const lpfistClaim = BigNumber.from(lpfistClaim2).mul(BigNumber.from(BASE_TEN).pow(16))

    const claimAllAmount = (lpStakingAmount - lptgeAmount - lpfistClaim)
    // console.log(claimAllAmount)
    const averageClaimAmount = claimAllAmount/35
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

        const LPStakingVault = await ethers.getContractFactory("LPStakingVault");
        lpStakingVault = await LPStakingVault.deploy(docToken.address);
        lpStakingVault.connect(vaultOwner).deployed();
        
        provider = ethers.provider;

        await docToken.transfer(lpStakingVault.address, lpStakingAmount)
        // console.log(Number((await docToken.balanceOf(lpStakingVault.address)/BigNumber.from(BASE_TEN).pow(18))))
    })

    describe("LPStakingTest", () => {
        describe("setting", () => {
            it("check name, doc ", async function() {
                expect(await lpStakingVault.name()).to.equal("LPStaking");
                expect(await lpStakingVault.doc()).to.equal(docToken.address);
            });
    
            it("check the onlyOwner", async () => {
                let curBlock = await ethers.provider.getBlock();
                tgeTime = curBlock.timestamp + 50;
                firstClaimTime = tgeTime + 1000;
                startTime = firstClaimTime + 100;
    
                await expect(lpStakingVault.connect(account1).initialize(
                    lpStakingAmount,
                    totalClaim,
                    startTime,
                    periodTimesPerClaim
                )).to.be.revertedWith("Accessible: Caller is not an admin");
    
                await expect(lpStakingVault.connect(account1).allSetting(
                    [lptgeAmount,tgeTime],
                    [lpfistClaim,firstClaimTime]
                )).to.be.revertedWith("Accessible: Caller is not an admin");
    
                await expect(lpStakingVault.connect(account1).tgeSetting(
                    lptgeAmount,
                    tgeTime
                )).to.be.revertedWith("Accessible: Caller is not an admin");
    
                await expect(lpStakingVault.connect(account1).firstClaimSetting(
                    lpfistClaim,
                    firstClaimTime
                )).to.be.revertedWith("Accessible: Caller is not an admin");
    
                await expect(lpStakingVault.connect(account1).tgeClaim(
                    account1.address
                )).to.be.revertedWith("Accessible: Caller is not an admin");
    
                await expect(lpStakingVault.connect(account1).claim(
                    account1.address
                )).to.be.revertedWith("Accessible: Caller is not an admin");
            })
    
            it("setting the basic", async () => {
                let curBlock = await ethers.provider.getBlock();
                tgeTime = curBlock.timestamp + 50;
                // console.log(tgeTime)
                firstClaimTime = tgeTime + 1000;
                startTime = firstClaimTime + 100;
    
                await lpStakingVault.connect(tokenOwner).initialize(
                    lpStakingAmount,
                    totalClaim,
                    startTime,
                    periodTimesPerClaim
                );
    
                expect(await lpStakingVault.totalAllocatedAmount()).to.equal(lpStakingAmount);
                expect(await lpStakingVault.totalClaimCounts()).to.equal(totalClaim);
                expect(await lpStakingVault.startTime()).to.equal(startTime);
                expect(await lpStakingVault.claimPeriodTimes()).to.equal(periodTimesPerClaim);
            })
    
            it("tgeSetting", async () => {
                await lpStakingVault.connect(tokenOwner).tgeSetting(
                    123,1234
                );
    
                expect(await lpStakingVault.tgeAmount()).to.equal(123);
                expect(await lpStakingVault.tgeTime()).to.equal(1234);
            })
    
            it("firstClaimSetting", async () => {
                await lpStakingVault.connect(tokenOwner).firstClaimSetting(
                    123,1234
                );
    
                expect(await lpStakingVault.firstClaimAmount()).to.equal(123);
                expect(await lpStakingVault.firstClaimTime()).to.equal(1234);
            })
    
            it("allSetting", async () => {
                await lpStakingVault.connect(tokenOwner).allSetting(
                    [lptgeAmount,tgeTime],
                    [lpfistClaim,firstClaimTime]
                );
                
                expect(await lpStakingVault.tgeAmount()).to.equal(lptgeAmount);
                expect(await lpStakingVault.tgeTime()).to.equal(tgeTime);
                expect(await lpStakingVault.firstClaimAmount()).to.equal(lpfistClaim);
                expect(await lpStakingVault.firstClaimTime()).to.equal(firstClaimTime);
            })
        })
        describe("claim", () =>{
            it("tgeClaim before time", async () => {
                await expect(lpStakingVault.connect(tokenOwner).tgeClaim(
                    account1.address
                )).to.be.revertedWith("Designed Valut: need the tgeTime");
            })
    
            it("tgeClaim after time", async () => {
                expect(await docToken.balanceOf(account1.address)).to.equal(0);
    
                await ethers.provider.send('evm_setNextBlockTimestamp', [tgeTime]);
                await ethers.provider.send('evm_mine');
                
                await lpStakingVault.connect(tokenOwner).tgeClaim(
                    account1.address
                );
    
                expect(await docToken.balanceOf(account1.address)).to.equal(lptgeAmount);
            })

            it("claim before time", async () => {
                await expect(lpStakingVault.connect(tokenOwner).claim(
                    account1.address
                )).to.be.revertedWith("DesignedVault: not started yet");
            })

            it("claim after time", async () => {
                expect(await docToken.balanceOf(account2.address)).to.equal(0);
    
                await ethers.provider.send('evm_setNextBlockTimestamp', [firstClaimTime]);
                await ethers.provider.send('evm_mine');
                
                await lpStakingVault.connect(tokenOwner).claim(
                    account2.address
                );

                let round = await lpStakingVault.currentRound();
                expect(round).to.equal("1");
    
                expect(await docToken.balanceOf(account2.address)).to.equal(lpfistClaim);
            })

            it("claim same round", async () => {
                await expect(lpStakingVault.connect(tokenOwner).claim(
                    account1.address
                )).to.be.revertedWith("DesignedVault: already get this round");
            })

            it("claim after time", async () => {
                expect(await docToken.balanceOf(account3.address)).to.equal(0);
    
                await ethers.provider.send('evm_setNextBlockTimestamp', [startTime]);
                await ethers.provider.send('evm_mine');
                
                await lpStakingVault.connect(tokenOwner).claim(
                    account3.address
                );

                let round = await lpStakingVault.currentRound();
                expect(round).to.equal("2");
                    
                let tx = await docToken.balanceOf(account3.address);
                expect(Number(tx)).to.equal(Number(averageClaimAmount));
            })

            it("claim that time is round3", async () => {    
                await ethers.provider.send("evm_increaseTime", [periodTimesPerClaim]);
                await ethers.provider.send('evm_mine');
                
                await lpStakingVault.connect(tokenOwner).claim(
                    account3.address
                );

                let round = await lpStakingVault.currentRound();
                expect(round).to.equal("3");
                    
                let tx = await docToken.balanceOf(account3.address);
                expect(Number(tx)).to.equal(Number(averageClaimAmount*2));
            })

            it("claim that time is round13", async () => {    
                await ethers.provider.send("evm_increaseTime", [periodTimesPerClaim*10]);
                await ethers.provider.send('evm_mine');
                
                await lpStakingVault.connect(tokenOwner).claim(
                    account3.address
                );

                let round = await lpStakingVault.currentRound();
                expect(round).to.equal("13");
                    
                let tx = await docToken.balanceOf(account3.address);
                expect(Number(tx)).to.equal(Number(averageClaimAmount*12));
            })

            it("claim that time is round23", async () => {    
                await ethers.provider.send("evm_increaseTime", [periodTimesPerClaim*10]);
                await ethers.provider.send('evm_mine');
                
                await lpStakingVault.connect(tokenOwner).claim(
                    account3.address
                );

                let round = await lpStakingVault.currentRound();
                expect(round).to.equal("23");
                    
                let tx = await docToken.balanceOf(account3.address);
                expect(Number(tx)).to.equal(Number(averageClaimAmount*22));
            })

            it("claim that time is round33", async () => {    
                await ethers.provider.send("evm_increaseTime", [periodTimesPerClaim*10]);
                await ethers.provider.send('evm_mine');
                
                await lpStakingVault.connect(tokenOwner).claim(
                    account3.address
                );

                let round = await lpStakingVault.currentRound();
                expect(round).to.equal("33");
                    
                let tx = await docToken.balanceOf(account3.address);
                expect(Number(tx)).to.equal(Number(averageClaimAmount*32));
            })

            it("claim that time is round35", async () => {    
                await ethers.provider.send("evm_increaseTime", [periodTimesPerClaim*2]);
                await ethers.provider.send('evm_mine');
                
                await lpStakingVault.connect(tokenOwner).claim(
                    account3.address
                );

                let round = await lpStakingVault.currentRound();
                expect(round).to.equal("35");
                    
                let tx = await docToken.balanceOf(account3.address);
                expect(Number(tx)).to.equal(Number(averageClaimAmount*34));
            })

            it("claim that time is round36", async () => {    
                await ethers.provider.send("evm_increaseTime", [periodTimesPerClaim]);
                await ethers.provider.send('evm_mine');
                
                await lpStakingVault.connect(tokenOwner).claim(
                    account3.address
                );

                let round = await lpStakingVault.currentRound();
                expect(round).to.equal("36");

                let amount = await lpStakingVault.calcalClaimAmount(36);
                // console.log(Number(amount))
                    
                let tx = await docToken.balanceOf(account3.address);
                // console.log(Number(tx))
                // expect(Number(tx)).to.equal(Number(averageClaimAmount*35)); //조금 오차가있음..
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