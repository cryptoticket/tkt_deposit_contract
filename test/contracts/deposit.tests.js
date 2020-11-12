const BigNumber = web3.BigNumber;

const MintableToken = artifacts.require('MintableToken');
const Deposit = artifacts.require('Deposit');

require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();

contract('Deposit', (accounts) => {
    const creator = accounts[0];
    const acc1 = accounts[1];
    const acc2 = accounts[2];

    beforeEach(async function () {
        this.erc20 = await MintableToken.new();
    });

    describe('(unit tests)', () => {
        beforeEach(async () => {

        });

        describe('contract constructor', () => {
            it('should construct new contract instance', async function () {
                this.deposit = await Deposit.new(creator, this.erc20.address, 15000);

                assert.equal(await this.deposit.addressCT(), creator);
                assert.equal(await this.deposit.token(), this.erc20.address);
                assert.equal(await this.deposit.depositAmount(), 15000);

                assert.equal(await this.deposit.holdersMaxCount(), 0);
            });
        });

        describe('setToken', () => {
            it('should not update token address if called by someone', async function () {
                this.deposit = await Deposit.new(creator, this.erc20.address, 15000);

                // init new token
                this.erc20_2 = await MintableToken.new();
                await this.deposit.setToken(this.erc20_2.address, { from: acc1 }).should.be.rejectedWith('revert');
                assert.equal(await this.deposit.token(), this.erc20.address);
            });
        });

        describe('setDepositAmount', () => {
            it('should return value passed in constructor', async function () {
                this.deposit = await Deposit.new(creator, this.erc20.address, 15000);
                assert.equal(await this.deposit.depositAmount(), 15000);
            });

            it('should return last value', async function () {
                this.deposit = await Deposit.new(creator, this.erc20.address, 15000);
                await this.deposit.setDepositAmount(12000);
                assert.equal(await this.deposit.depositAmount(), 12000);
            });
        });

        describe('isDepositedEnough', () => {
            it('should return false for new user', async function () {
                this.deposit = await Deposit.new(creator, this.erc20.address, 10000);

                assert.equal(await this.deposit.isDepositedEnough(creator), false);
                assert.equal(await this.deposit.isDepositedEnough(acc1), false);
            });

            it('should return true if deposited enough', async function () {
                // mint
                await this.erc20.mintFor(acc1, 10000);
                assert.equal(await this.erc20.balanceOf(acc1), 10000);

                // allow
                this.deposit = await Deposit.new(creator, this.erc20.address, 10000);
                await this.erc20.approve(this.deposit.address, 10000, { from: acc1 });
                assert.equal(await this.erc20.allowance(acc1, this.deposit.address), 10000);

                // now call 'depositTokens'
                await this.deposit.depositTokens({ from: acc1 }).should.be.fulfilled;
                assert.equal(await this.deposit.isDepositedEnough(acc1), true);
            });

            it('should return false if conditions changed', async function () {
                // mint
                await this.erc20.mintFor(acc1, 10000);
                assert.equal(await this.erc20.balanceOf(acc1), 10000);

                // allow
                this.deposit = await Deposit.new(creator, this.erc20.address, 10000);
                await this.erc20.approve(this.deposit.address, 10000, { from: acc1 });
                assert.equal(await this.erc20.allowance(acc1, this.deposit.address), 10000);

                // now call 'depositTokens'
                await this.deposit.depositTokens({ from: acc1 }).should.be.fulfilled;
                assert.equal(await this.deposit.isDepositedEnough(acc1), true);

                await this.deposit.setDepositAmount(15000);
                assert.equal(await this.deposit.isDepositedEnough(acc1), false);
            });
        });

        describe('depositTokens', () => {
            it('should deposit tokens', async function () {
                // mint
                await this.erc20.mintFor(acc1, 10000);
                assert.equal(await this.erc20.balanceOf(acc1), 10000);

                // allow
                this.deposit = await Deposit.new(creator, this.erc20.address, 10000);
                await this.erc20.approve(this.deposit.address, 10000, { from: acc1 });
                assert.equal(await this.erc20.allowance(acc1, this.deposit.address), 10000);

                const b1 = await this.deposit.currentBalances(acc1);
                assert.equal(b1, 0);

                // now call 'depositTokens'
                await this.deposit.depositTokens({ from: acc1 }).should.be.fulfilled;
                assert.equal(await this.erc20.balanceOf(acc1), 0);
                assert.equal(await this.erc20.balanceOf(this.deposit.address), 10000);
                assert.equal(await this.erc20.allowance(acc1, this.deposit.address), 0);

                // check currentBalances
                const b2 = await this.deposit.currentBalances(acc1);
                assert.equal(b2, 10000);
            });

            it('should not deposit tokens if not enough', async function () {
                // mint
                await this.erc20.mintFor(acc1, 9000);

                // allow
                this.deposit = await Deposit.new(creator, this.erc20.address, 10000);
                await this.erc20.approve(this.deposit.address, 900, { from: acc1 });

                // now call 'depositTokens'
                await this.deposit.depositTokens({ from: acc1 }).should.be.rejectedWith('revert');
            });

            it('should not deposit tokens twice', async function () {
                // mint
                await this.erc20.mintFor(acc1, 10000);

                // approve
                this.deposit = await Deposit.new(creator, this.erc20.address, 10000);
                await this.erc20.approve(this.deposit.address, 10000, { from: acc1 });

                // now call 'depositTokens'
                await this.deposit.depositTokens({ from: acc1 }).should.be.fulfilled;
                assert.equal(await this.erc20.balanceOf(acc1), 0);
                assert.equal(await this.erc20.balanceOf(this.deposit.address), 10000);
                assert.equal(await this.erc20.allowance(acc1, this.deposit.address), 0);

                // check currentBalances
                const b2 = await this.deposit.currentBalances(acc1);
                assert.equal(b2, 10000);

                // 2
                // don't approve more!
                await this.erc20.mintFor(acc1, 4000);
                await this.erc20.approve(this.deposit.address, 4000, { from: acc1 });

                await this.deposit.depositTokens({ from: acc1 }).should.be.fulfilled;
                assert.equal(await this.erc20.balanceOf(acc1), 4000);
                assert.equal(await this.erc20.balanceOf(this.deposit.address), 10000);
                assert.equal(await this.erc20.allowance(acc1, this.deposit.address), 4000);

                // check currentBalances
                const b3 = await this.deposit.currentBalances(acc1);
                assert.equal(b3, 10000);
            });

            it('should deposit tokens twice if conditions changed', async function () {
                // mint
                await this.erc20.mintFor(acc1, 10000);

                // approve
                this.deposit = await Deposit.new(creator, this.erc20.address, 10000);
                await this.erc20.approve(this.deposit.address, 10000, { from: acc1 });

                // now call 'depositTokens'
                await this.deposit.depositTokens({ from: acc1 }).should.be.fulfilled;
                assert.equal(await this.erc20.balanceOf(acc1), 0);
                assert.equal(await this.erc20.balanceOf(this.deposit.address), 10000);
                assert.equal(await this.erc20.allowance(acc1, this.deposit.address), 0);
                assert.equal(await this.deposit.isDepositedEnough(acc1), true);

                // 2 - change conditions
                await this.deposit.setDepositAmount(15000);
                assert.equal(await this.deposit.isDepositedEnough(acc1), false);

                // 3
                // approve more!
                await this.erc20.mintFor(acc1, 5000);
                await this.erc20.approve(this.deposit.address, 5000, { from: acc1 });

                await this.deposit.depositTokens({ from: acc1 }).should.be.fulfilled;
                assert.equal(await this.erc20.balanceOf(acc1), 0);
                assert.equal(await this.erc20.balanceOf(this.deposit.address), 15000);
                assert.equal(await this.erc20.allowance(acc1, this.deposit.address), 0);

                // check currentBalances
                const b3 = await this.deposit.currentBalances(acc1);
                assert.equal(b3, 15000);
            });

            it('should deposit tokens twice and leave rest if conditions changed', async function () {
                // mint
                await this.erc20.mintFor(acc1, 10000);

                // approve
                this.deposit = await Deposit.new(creator, this.erc20.address, 10000);
                await this.erc20.approve(this.deposit.address, 10000, { from: acc1 });

                // now call 'depositTokens'
                await this.deposit.depositTokens({ from: acc1 }).should.be.fulfilled;
                assert.equal(await this.erc20.balanceOf(acc1), 0);
                assert.equal(await this.erc20.balanceOf(this.deposit.address), 10000);
                assert.equal(await this.erc20.allowance(acc1, this.deposit.address), 0);
                assert.equal(await this.deposit.isDepositedEnough(acc1), true);

                // 2 - change conditions
                await this.deposit.setDepositAmount(15000);
                assert.equal(await this.deposit.isDepositedEnough(acc1), false);

                // 3
                // approve more!
                await this.erc20.mintFor(acc1, 8000);
                await this.erc20.approve(this.deposit.address, 8000, { from: acc1 });

                await this.deposit.depositTokens({ from: acc1 }).should.be.fulfilled;
                assert.equal(await this.erc20.balanceOf(acc1), 3000);
                assert.equal(await this.erc20.balanceOf(this.deposit.address), 15000);
                assert.equal(await this.erc20.allowance(acc1, this.deposit.address), 3000);

                // check currentBalances
                const b3 = await this.deposit.currentBalances(acc1);
                assert.equal(b3, 15000);
            });

            it('should not unlock tokens if conditions changed (lower)', async function () {
                // mint
                await this.erc20.mintFor(acc1, 10000);

                // approve
                this.deposit = await Deposit.new(creator, this.erc20.address, 10000);
                await this.erc20.approve(this.deposit.address, 10000, { from: acc1 });

                // now call 'depositTokens'
                await this.deposit.depositTokens({ from: acc1 }).should.be.fulfilled;
                assert.equal(await this.erc20.balanceOf(acc1), 0);
                assert.equal(await this.erc20.balanceOf(this.deposit.address), 10000);
                assert.equal(await this.erc20.allowance(acc1, this.deposit.address), 0);
                assert.equal(await this.deposit.isDepositedEnough(acc1), true);

                // 2 - change conditions
                await this.deposit.setDepositAmount(7000);

                // 3 - call deposit
                await this.deposit.depositTokens({ from: acc1 }).should.be.fulfilled;
                assert.equal(await this.erc20.balanceOf(acc1), 0);
                assert.equal(await this.erc20.balanceOf(this.deposit.address), 10000);
                assert.equal(await this.erc20.allowance(acc1, this.deposit.address), 0);

                // check currentBalances
                const b3 = await this.deposit.currentBalances(acc1);
                assert.equal(b3, 10000);
            });
        });

        describe('releaseMyTokens', () => {
            it('should fail if nothing to release', async function () {
                this.deposit = await Deposit.new(creator, this.erc20.address, 10000);
                await this.erc20.approve(this.deposit.address, 10000, { from: acc1 });
                assert.equal(await this.erc20.allowance(acc1, this.deposit.address), 10000);

                const b1 = await this.deposit.currentBalances(acc1);
                assert.equal(b1, 0);

                // release
                await this.deposit.releaseMyTokens({ from: acc1 }).should.be.rejectedWith('revert');
            });

            it('should not release users tokens if called by other user', async function () {
                // mint
                await this.erc20.mintFor(acc1, 10000);
                assert.equal(await this.erc20.balanceOf(acc1), 10000);

                // allow
                this.deposit = await Deposit.new(creator, this.erc20.address, 10000);
                await this.erc20.approve(this.deposit.address, 10000, { from: acc1 });
                assert.equal(await this.erc20.allowance(acc1, this.deposit.address), 10000);

                const b1 = await this.deposit.currentBalances(acc1);
                assert.equal(b1, 0);

                // now call 'depositTokens'
                await this.deposit.depositTokens({ from: acc1 }).should.be.fulfilled;

                // release
                await this.deposit.releaseMyTokens({ from: acc2 }).should.be.rejectedWith('revert');
            });

            it('should release users tokens', async function () {
                // mint
                await this.erc20.mintFor(acc1, 10000);
                assert.equal(await this.erc20.balanceOf(acc1), 10000);

                // allow
                this.deposit = await Deposit.new(creator, this.erc20.address, 10000);
                await this.erc20.approve(this.deposit.address, 10000, { from: acc1 });
                assert.equal(await this.erc20.allowance(acc1, this.deposit.address), 10000);

                const b1 = await this.deposit.currentBalances(acc1);
                assert.equal(b1, 0);

                // now call 'depositTokens'
                await this.deposit.depositTokens({ from: acc1 }).should.be.fulfilled;

                // release
                await this.deposit.releaseMyTokens({ from: acc1 }).should.be.fulfilled;
                assert.equal(await this.erc20.balanceOf(acc1), 10000);
                assert.equal(await this.erc20.balanceOf(this.deposit.address), 0);
                assert.equal(await this.erc20.allowance(acc1, this.deposit.address), 0);

                // check currentBalances
                const b3 = await this.deposit.currentBalances(acc1);
                assert.equal(b3, 0);
            });

            it('should not release again', async function () {
                // mint
                await this.erc20.mintFor(acc1, 10000);
                assert.equal(await this.erc20.balanceOf(acc1), 10000);

                // allow
                this.deposit = await Deposit.new(creator, this.erc20.address, 10000);
                await this.erc20.approve(this.deposit.address, 10000, { from: acc1 });
                assert.equal(await this.erc20.allowance(acc1, this.deposit.address), 10000);

                const b1 = await this.deposit.currentBalances(acc1);
                assert.equal(b1, 0);

                // now call 'depositTokens'
                await this.deposit.depositTokens({ from: acc1 }).should.be.fulfilled;

                // release
                await this.deposit.releaseMyTokens({ from: acc1 }).should.be.fulfilled;
                await this.deposit.releaseMyTokens({ from: acc1 }).should.be.rejectedWith('revert');
            });
        });

        describe('releaseTokensOf', () => {
            it('should fail if nothing to release', async function () {
                this.deposit = await Deposit.new(creator, this.erc20.address, 10000);
                await this.erc20.approve(this.deposit.address, 10000, { from: acc1 });
                assert.equal(await this.erc20.allowance(acc1, this.deposit.address), 10000);

                const b1 = await this.deposit.currentBalances(acc1);
                assert.equal(b1, 0);

                // release
                await this.deposit.releaseTokensOf(acc1, { from: creator }).should.be.rejectedWith('revert');
            });

            it('should release users tokens', async function () {
                // mint
                await this.erc20.mintFor(acc1, 10000);
                assert.equal(await this.erc20.balanceOf(acc1), 10000);

                // allow
                this.deposit = await Deposit.new(creator, this.erc20.address, 10000);
                await this.erc20.approve(this.deposit.address, 10000, { from: acc1 });
                assert.equal(await this.erc20.allowance(acc1, this.deposit.address), 10000);

                const b1 = await this.deposit.currentBalances(acc1);
                assert.equal(b1, 0);

                // now call 'depositTokens'
                await this.deposit.depositTokens({ from: acc1 }).should.be.fulfilled;

                // release
                await this.deposit.releaseTokensOf(acc1, { from: creator }).should.be.fulfilled;
                assert.equal(await this.erc20.balanceOf(acc1), 10000);
                assert.equal(await this.erc20.balanceOf(this.deposit.address), 0);
                assert.equal(await this.erc20.allowance(acc1, this.deposit.address), 0);

                // check currentBalances
                const b3 = await this.deposit.currentBalances(acc1);
                assert.equal(b3, 0);
            });

            it('should not release if called by other user', async function () {
                // mint
                await this.erc20.mintFor(acc1, 10000);
                assert.equal(await this.erc20.balanceOf(acc1), 10000);

                // allow
                this.deposit = await Deposit.new(creator, this.erc20.address, 10000);
                await this.erc20.approve(this.deposit.address, 10000, { from: acc1 });
                assert.equal(await this.erc20.allowance(acc1, this.deposit.address), 10000);

                const b1 = await this.deposit.currentBalances(acc1);
                assert.equal(b1, 0);

                // now call 'depositTokens'
                await this.deposit.depositTokens({ from: acc1 }).should.be.fulfilled;

                // release
                await this.deposit.releaseTokensOf(acc1, { from: acc2 }).should.be.rejectedWith('revert');

                // check currentBalances
                const b3 = await this.deposit.currentBalances(acc1);
                assert.equal(b3, 10000);
            });

            it('should not release again', async function () {
                // mint
                await this.erc20.mintFor(acc1, 10000);
                assert.equal(await this.erc20.balanceOf(acc1), 10000);

                // allow
                this.deposit = await Deposit.new(creator, this.erc20.address, 10000);
                await this.erc20.approve(this.deposit.address, 10000, { from: acc1 });
                assert.equal(await this.erc20.allowance(acc1, this.deposit.address), 10000);

                const b1 = await this.deposit.currentBalances(acc1);
                assert.equal(b1, 0);

                // now call 'depositTokens'
                await this.deposit.depositTokens({ from: acc1 }).should.be.fulfilled;

                // release
                await this.deposit.releaseTokensOf(acc1, { from: creator }).should.be.fulfilled;
                await this.deposit.releaseTokensOf(acc1, { from: creator }).should.be.rejectedWith('revert');
            });
        });

        describe('holdersMaxCount', () => {
            it('should return 1 for one stake', async function () {
                // mint
                await this.erc20.mintFor(acc1, 10000);
                assert.equal(await this.erc20.balanceOf(acc1), 10000);

                // allow
                this.deposit = await Deposit.new(creator, this.erc20.address, 10000);
                await this.erc20.approve(this.deposit.address, 10000, { from: acc1 });
                assert.equal(await this.erc20.allowance(acc1, this.deposit.address), 10000);

                const b1 = await this.deposit.currentBalances(acc1);
                assert.equal(b1, 0);

                // now call 'depositTokens'
                await this.deposit.depositTokens({ from: acc1 }).should.be.fulfilled;
                const hmc = await this.deposit.holdersMaxCount();
                assert.equal(hmc.toNumber(0), 1);

                const a1 = await this.deposit.allHolders(0);
                assert.equal(a1, acc1);
            });

            it('should return 2 for two different stakes', async function () {
                // 1
                await this.erc20.mintFor(acc1, 10000);
                this.deposit = await Deposit.new(creator, this.erc20.address, 10000);
                await this.erc20.approve(this.deposit.address, 10000, { from: acc1 });
                await this.deposit.depositTokens({ from: acc1 }).should.be.fulfilled;

                // 2
                await this.erc20.mintFor(acc2, 10000);
                await this.erc20.approve(this.deposit.address, 10000, { from: acc2 });
                await this.deposit.depositTokens({ from: acc2 }).should.be.fulfilled;

                // check
                const hmc = await this.deposit.holdersMaxCount();
                assert.equal(hmc.toNumber(0), 2);
            });

            it('should return 2 for two different stakes OF THE SAME USER', async function () {
                // 1
                await this.erc20.mintFor(acc1, 10000);
                this.deposit = await Deposit.new(creator, this.erc20.address, 10000);
                await this.erc20.approve(this.deposit.address, 10000, { from: acc1 });
                await this.deposit.depositTokens({ from: acc1 }).should.be.fulfilled;

                await this.deposit.setDepositAmount(15000);

                // 2
                await this.erc20.mintFor(acc1, 5000);
                await this.erc20.approve(this.deposit.address, 5000, { from: acc1 });
                await this.deposit.depositTokens({ from: acc1 }).should.be.fulfilled;

                // check
                const hmc = await this.deposit.holdersMaxCount();
                assert.equal(hmc.toNumber(0), 2);

                const a1 = await this.deposit.allHolders(0);
                assert.equal(a1, acc1);
                const a2 = await this.deposit.allHolders(1);
                assert.equal(a2, acc1);
            });

            it('should return 1 event if released', async function () {
                // mint
                await this.erc20.mintFor(acc1, 10000);
                this.deposit = await Deposit.new(creator, this.erc20.address, 10000);
                await this.erc20.approve(this.deposit.address, 10000, { from: acc1 });

                // now call 'depositTokens'
                await this.deposit.depositTokens({ from: acc1 }).should.be.fulfilled;

                // release
                await this.deposit.releaseMyTokens({ from: acc1 }).should.be.fulfilled;

                // check
                const hmc = await this.deposit.holdersMaxCount();
                assert.equal(hmc.toNumber(0), 1);

                const a1 = await this.deposit.allHolders(0);
                assert.equal(a1, acc1);
            });
        });

        describe('totalDeposits', () => {
            it('should return 10000 if stake is only one', async function () {
                // mint
                await this.erc20.mintFor(acc1, 10000);
                this.deposit = await Deposit.new(creator, this.erc20.address, 10000);
                await this.erc20.approve(this.deposit.address, 10000, { from: acc1 });
                await this.deposit.depositTokens({ from: acc1 }).should.be.fulfilled;
                const td = await this.deposit.totalDeposits();
                assert.equal(td.toNumber(0), 10000);
            });

            it('should return 20000 for two different stakes', async function () {
                // 1
                await this.erc20.mintFor(acc1, 10000);
                this.deposit = await Deposit.new(creator, this.erc20.address, 10000);
                await this.erc20.approve(this.deposit.address, 10000, { from: acc1 });
                await this.deposit.depositTokens({ from: acc1 }).should.be.fulfilled;

                // 2
                await this.erc20.mintFor(acc2, 10000);
                await this.erc20.approve(this.deposit.address, 10000, { from: acc2 });
                await this.deposit.depositTokens({ from: acc2 }).should.be.fulfilled;

                // check
                const td = await this.deposit.totalDeposits();
                assert.equal(td.toNumber(0), 20000);
            });

            it('should return 15000 for 2 deposits OF THE SAME USER', async function () {
                // 1
                await this.erc20.mintFor(acc1, 10000);
                this.deposit = await Deposit.new(creator, this.erc20.address, 10000);
                await this.erc20.approve(this.deposit.address, 10000, { from: acc1 });
                await this.deposit.depositTokens({ from: acc1 }).should.be.fulfilled;

                await this.deposit.setDepositAmount(15000);

                // 2
                await this.erc20.mintFor(acc1, 5000);
                await this.erc20.approve(this.deposit.address, 5000, { from: acc1 });
                await this.deposit.depositTokens({ from: acc1 }).should.be.fulfilled;

                // check
                const td = await this.deposit.totalDeposits();
                assert.equal(td.toNumber(0), 15000);
            });

            it('should return 0 if released', async function () {
                // mint
                await this.erc20.mintFor(acc1, 10000);
                this.deposit = await Deposit.new(creator, this.erc20.address, 10000);
                await this.erc20.approve(this.deposit.address, 10000, { from: acc1 });

                // now call 'depositTokens'
                await this.deposit.depositTokens({ from: acc1 }).should.be.fulfilled;

                // release
                await this.deposit.releaseMyTokens({ from: acc1 }).should.be.fulfilled;

                // check
                const td = await this.deposit.totalDeposits();
                assert.equal(td.toNumber(0), 0);
            });
        });

        describe('depositTokensOf', () => {
            it('should not deposit if called by other', async function () {
                // mint
                await this.erc20.mintFor(acc1, 10000);
                assert.equal(await this.erc20.balanceOf(acc1), 10000);

                // allow
                this.deposit = await Deposit.new(creator, this.erc20.address, 10000);
                await this.erc20.approve(this.deposit.address, 10000, { from: acc1 });
                assert.equal(await this.erc20.allowance(acc1, this.deposit.address), 10000);

                const b1 = await this.deposit.currentBalances(acc1);
                assert.equal(b1, 0);

                // now call 'depositTokens'
                await this.deposit.depositTokensOf(acc1, { from: acc2 }).should.be.rejectedWith('revert');
            });

            it('should deposit tokens', async function () {
                // mint
                await this.erc20.mintFor(acc1, 10000);
                assert.equal(await this.erc20.balanceOf(acc1), 10000);

                // allow
                this.deposit = await Deposit.new(creator, this.erc20.address, 10000);
                await this.erc20.approve(this.deposit.address, 10000, { from: acc1 });
                assert.equal(await this.erc20.allowance(acc1, this.deposit.address), 10000);

                const b1 = await this.deposit.currentBalances(acc1);
                assert.equal(b1, 0);

                // now call 'depositTokens'
                await this.deposit.depositTokensOf(acc1, { from: creator }).should.be.fulfilled;
                assert.equal(await this.erc20.balanceOf(acc1), 0);
                assert.equal(await this.erc20.balanceOf(this.deposit.address), 10000);
                assert.equal(await this.erc20.allowance(acc1, this.deposit.address), 0);

                // check currentBalances
                const b2 = await this.deposit.currentBalances(acc1);
                assert.equal(b2, 10000);
            });
        });

        describe('releaseAllTokensTo', () => {
            beforeEach(async function () {
                // mint
                await this.erc20.mintFor(acc1, 10000);
                // allow
                this.deposit = await Deposit.new(creator, this.erc20.address, 10000);
                await this.erc20.approve(this.deposit.address, 10000, { from: acc1 });
                // now call 'depositTokens'
                await this.deposit.depositTokensOf(acc1, { from: creator }).should.be.fulfilled;
            });

            it('should release all tokens', async function () {
                await this.deposit.releaseAllTokensTo(acc2, { from: creator }).should.be.fulfilled;
                assert.equal(await this.erc20.balanceOf(this.deposit.address), 0);
                assert.equal(await this.erc20.balanceOf(acc2), 10000);
            });

            it('should allow to release twice without error', async function () {
                await this.deposit.releaseAllTokensTo(acc2, { from: creator }).should.be.fulfilled;
                await this.deposit.releaseAllTokensTo(acc2, { from: creator }).should.be.fulfilled;
                assert.equal(await this.erc20.balanceOf(this.deposit.address), 0);
                assert.equal(await this.erc20.balanceOf(acc2), 10000);
            });
        });
    });
});
