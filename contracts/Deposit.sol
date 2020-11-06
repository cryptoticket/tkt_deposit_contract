pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Deposit {
// fields:
	address public addressCT;

// modifiers:
	modifier onlyCT() {require(msg.sender == addressCT, "Access restricted"); _;}


// methods:
	constructor ( ERC20 _token ) public {
		
	}
}
