pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract Deposit {
// fields:
	address public addressCT = address(0x0);
	ERC20 public token;
	uint public depositAmount = 0;
	mapping(address=>uint) public currentBalances;

	uint public totalDeposits = 0;

	mapping(uint=>address) public allHolders;
	uint public holdersMaxCount = 0;

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

	function depositTokensOf(address _a) external onlyCT {
		_depositTokens(_a);
	}

	function releaseTokensOf(address _a) external onlyCT {
		_releaseTokensOf(_a);
	}

	function releaseTokensOfTo(address _a, address _b) external onlyCT {
		_releaseTokensOfTo(_a, _b);
	}

	function releaseAllTokensTo(address _a) external onlyCT() {
		// then all structures are in bad state...
		uint total = token.balanceOf(address(this));		
		token.transfer(_a, total);	
	}

	function isDepositedEnough( address _user ) external view returns(bool) {
		// investor deposited enought tokens?
		// depositAmount can be changed since then
		return (currentBalances[_user]>=depositAmount);
	}

// 2 - Investors:
	function depositTokens() external {
		_depositTokens(msg.sender);
	}

	// release all tokens from current contract to owner
	function releaseMyTokens() external {
		_releaseTokensOf(msg.sender);
	}

// INTERNAL functions
	function _depositTokens(address _a) internal {
		// 1 - investor should allow us to withdraw X tokens
		uint allow = token.allowance(_a, address(this));
		uint balance = currentBalances[_a];

		// 2 - if investor already deposited N tokens before
		// 2.1  - and if 'depositAmount' increased -> require K=M-N more tokens
		uint neededMore = 0;
		if (depositAmount>=balance) {
			neededMore = depositAmount - balance;
		} else {
			// 2.2  - and if 'depositAmount' decreased -> DO NOT unlock excess tokens!
			return;
		}

		// 3 - if not enough -> fail
		require(allow >= neededMore, "Need more tokens");

		// 4 - withdraw
		token.transferFrom(_a, address(this), neededMore);

		// 5 - update currentBalances
		currentBalances[_a]+=neededMore;

		// 6 - increase holders count
		// do not check if this holder already present
		allHolders[holdersMaxCount] = _a;
		holdersMaxCount++;

		// 7 - increase totalDeposits
		totalDeposits+=neededMore;
	}

	function _releaseTokensOf(address _a) internal {
		_releaseTokensOfTo(_a, _a);
	}

	function _releaseTokensOfTo(address _a, address _to) internal {
		uint balance = currentBalances[_a];
		require(balance!=0,"No tokens to release");

		// send tokens to '_to'
		token.transfer(_to, balance);

		// clear balance
		currentBalances[_a] = 0;

		// TODO: SafeMath?
		require(totalDeposits>=balance, "Bad totalDeposits");
		totalDeposits-=balance;
	}
}
