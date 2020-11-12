pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract MintableToken is ERC20 {
	constructor() ERC20("SomeToken", "STT") public {

	}

	function mintFor(address _a, uint _n) public {
		_mint(_a, _n);
	}
}
