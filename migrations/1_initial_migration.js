let Migrations = artifacts.require('./Migrations.sol');
let Deposit = artifacts.require('./Deposit.sol');

// migrations/NN_deploy_upgradeable_box.js
const { deployProxy } = require('@openzeppelin/truffle-upgrades');
const addressCT = 0;
const tktToken = 0;
const depositAmount = 15000;

module.exports = async function (deployer) {
    /*
    console.log('Deploying Deposit to...');
    const instance = await deployProxy(Deposit, [addressCT, tktToken, depositAmount], { deployer });
    console.log('Deployed', instance.address);
    */
};
