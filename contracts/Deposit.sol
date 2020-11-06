pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Deposit {
// fields:
	address public addressCT;
	ERC20 public token;
	uint public depositAmount;

// modifiers:
	modifier onlyCT() {require(msg.sender == addressCT, "Access restricted"); _;}


// methods:
// 1 - CT
	constructor ( address _addressCT, ERC20 _token, uint _depositAmount ) public {
		addressCT = _addressCT;
		token = _token;
		depositAmount = _depositAmount;
	}

	function setToken( ERC20 _newToken ) external onlyCT() {
		token = _newToken;
	}

	function setDepositAmount( uint _depositAmount ) external onlyCT() {
		depositAmount = _depositAmount;
	}

	function releaseAllTokens() external onlyCT() {
		// release all tokens from current contract to owners? 
		// release all tokens from current contract to CT?

	}

	function isDepositedEnough( address _user ) external view returns(bool) {
		// investor deposited enought tokens?
		// depositAmount can be changed since then

		return false;
	} 

// 2 - Investors:
	function depositTokens() external {
		// 1 - investor should allow us to withdraw X tokens

		// 2 - if investor already deposited N tokens before 
		// 2.1  - and 'depositAmount' increased -> require K=M-N more tokens

		// 2.1  - and 'depositAmount' decreased -> DO NOT unlock excess tokens!

		// 3 - if not enough -> fail
	}

	function releaseMyTokens() external {
		// release all tokens from current contract to owner

	}
}
