pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/upgrades/contracts/Initializable.sol";


/**
 * @author crypto.tickets team
 * @title crypto.tickets Deposit contract to lock TKT tokens stake in the mainnet
 */
contract Deposit is Initializable {
// fields:
	address public addressCT;
	ERC20 public token;
	uint public depositAmount;
	mapping(address=>uint) public currentBalances;
	uint public totalDeposits;
	mapping(uint=>address) public allHolders;
	uint public holdersMaxCount;

// modifiers:
	modifier onlyCT() {require(msg.sender == addressCT, "Access restricted"); _;}

// methods:
// 1 - CT
	function initialize(address _addressCT, ERC20 _token, uint _depositAmount) public initializer {
		addressCT = _addressCT;
		token = _token;
		depositAmount = _depositAmount;
		totalDeposits = 0;
		holdersMaxCount = 0;
	}

	/**
	 * @dev Change ERC20 token for stake.
	 * @param _newToken New token address
	 */
	function setToken(ERC20 _newToken) external onlyCT() {
		token = _newToken;
	}

	/**
	 * @dev Change deposit amount. WILL NOT release tokens!
	 * @param _depositAmount New value.
	 */
	function setDepositAmount(uint _depositAmount) external onlyCT() {
		depositAmount = _depositAmount;
	}

	/**
	 * @dev Send TKTs from _a to this contract (if _a approved proper amount)
	 * @param _a Client address
	 */
	function depositTokensOf(address _a) external onlyCT {
		_depositTokens(_a);
	}

	/**
	 * @dev Release TKTs from this contract to _a
	 * @param _a Client address
	 */
	function releaseTokensOf(address _a) external onlyCT {
		_releaseTokensOf(_a);
	}

	/**
	 * @dev Release _a's TKTs from this contract to address _b
	 * @param _a Client address (that deposited tokens)
	 * @param _b Address to send tokens to
	 */
	function releaseTokensOfTo(address _a, address _b) external onlyCT {
		_releaseTokensOfTo(_a, _b);
	}

	/**
	 * @dev Release ALL deposited tokens to address _a
	 * @param _a Destination address
	 */
	function releaseAllTokensTo(address _a) external onlyCT() {
		// then all structures are in bad state...
		uint total = token.balanceOf(address(this));
		token.transfer(_a, total);
	}

	/**
	 * @dev Check whether _user has enough tokens
	 * @param _user Address to check
	 */
	function isDepositedEnough(address _user) external view returns(bool) {
		// investor deposited enought tokens?
		// depositAmount can be changed since then
		return (currentBalances[_user]>=depositAmount);
	}

// 2 - Investors:
	/**
	 * @dev Send TKTs from me to this contract (i should approve it before)
	 */
	function depositTokens() external {
		_depositTokens(msg.sender);
	}

	/**
	 * @dev Release all my tokens from this contract BACK TO ME
	 */
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
		require(depositAmount>=balance, "Already staked enough");
		uint neededMore = depositAmount - balance;

		// 3 - if not enough -> fail
		require(allow >= neededMore, "Need more tokens");

		// 4 - update currentBalances
		currentBalances[_a]+=neededMore;

		// 5 - increase holders count
		// do not check if this holder already present
		allHolders[holdersMaxCount] = _a;
		holdersMaxCount++;

		// 6 - increase totalDeposits
		totalDeposits+=neededMore;

		// 7 - withdraw
		token.transferFrom(_a, address(this), neededMore);
	}

	function _releaseTokensOf(address _a) internal {
		_releaseTokensOfTo(_a, _a);
	}

	function _releaseTokensOfTo(address _a, address _to) internal {
		uint balance = currentBalances[_a];
		require(balance!=0,"No tokens to release");

		// clear balance
		currentBalances[_a] = 0;

		// No SafeMath required
		// just an extra consistency check
		require(totalDeposits>=balance, "Bad totalDeposits");
		totalDeposits-=balance;

		// send tokens to '_to'
		token.transfer(_to, balance);
	}
}
