pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/upgrades/contracts/Initializable.sol";


contract DepositV2Test is Initializable {
	address public addressCT;
	ERC20 public token;
	uint public depositAmount;
	mapping(address=>uint) public currentBalances;
	uint public totalDeposits;
	mapping(uint=>address) public allHolders;
	uint public holdersMaxCount;

	// new variable
	uint public x;

	function initialize() public initializer {
		x = 80;
	}
}
