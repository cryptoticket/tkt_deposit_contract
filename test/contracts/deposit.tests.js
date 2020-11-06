const BigNumber = web3.BigNumber;

const ERC20 = artifacts.require('ERC20');
const Deposit = artifacts.require('Deposit');

require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();

contract('Deposit', (accounts) => {
    const creator = accounts[0];

	beforeEach(async () => {
		// this.erc20 = await ERC20.new("SomeToken", "STT");
	});


    describe('(unit tests)', () => {
        describe('contract constructor', () => {
            it('should construct new contract instance', async function () {
				this.erc20 = await ERC20.new("SomeToken", "STT");
				this.deposit = await Deposit.new(creator, this.erc20.address, 15000);

				assert.equal(await this.deposit.addressCT(), creator);
				assert.equal(await this.deposit.token(), this.erc20.address);
				assert.equal(await this.deposit.depositAmount(), 15000);
            });
        });

        describe('setToken', () => {
            it('should not update token address if called by someone', async function () {
				this.erc20 = await ERC20.new("SomeToken", "STT");
				this.deposit = await Deposit.new(creator, this.erc20.address, 15000);

				// init new token
				this.erc20_2 = await ERC20.new("SomeToken2", "STT2");
				await this.deposit.setToken(this.erc20_2.address).should.be.rejectedWith('revert');
				assert.equal(await this.deposit.token(), this.erc20.address);
            });
        });
    });
});
