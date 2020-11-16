const BigNumber = web3.BigNumber;
const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');

const MintableToken = artifacts.require('MintableToken');
const Deposit = artifacts.require('Deposit');
const DepositV2Test = artifacts.require('DepositV2Test');

require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();

contract('Deposit', (accounts) => {
    const creator = accounts[0];

    beforeEach(async () => {

    });

    describe('contract constructor', () => {
        it('should work', async () => {
            this.erc20 = await MintableToken.new();

            this.deposit = await deployProxy(Deposit, [creator, this.erc20.address, 15000]);
            this.deposit2 = await upgradeProxy(this.deposit.address, DepositV2Test);

            assert.equal(await this.deposit2.depositAmount(), 15000);
            // assert.equal(await this.deposit2.x(), 80);

            console.log('Upgrade test finished');
        });
    });
});
