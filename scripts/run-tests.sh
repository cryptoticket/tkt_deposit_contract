#!/bin/bash

# Executes cleanup function at script exit.
trap cleanup EXIT

cleanup() {
  # Kill the ganachecli instance that we started (if we started one).
  if [ -n "$ganachecli_pid" ]; then
    kill -9 $ganachecli_pid
  fi
}

ganachecli_running() {
  nc -z localhost 8555
}

if ganachecli_running; then
  echo "Using existing ganache-cli instance"
else
  echo "Starting ganache-cli"

  #./node_modules/ganache-cli/build/cli.node.js --gasLimit 0xfffffffffff --port 8555 --defaultBalanceEther 200\
  #> /dev/null &
	#
	# !!! See this option: --allowUnlimitedContractSize
	# https://ethereum.stackexchange.com/questions/47239/truffle-eip-170-contract-couldnt-be-stored-please-check-your-gas-amount

  # Same accounts as in 'scripts/run-test-blockchain.sh'
  ./node_modules/ganache-cli/cli.js --networkId 1111 --gasLimit 0xfffffffffff --port 8555  --defaultBalanceEther 200\
  --account="0x5767f39a7e4c819fe766420ba49ed8513fa51bf200cc7d531e605318cd0b11cc, 30000000000000000000000000000000000000"\
  > /dev/null &

  ganachecli_pid=$!
fi

#truffle migrate
#truffle test $1

# Run tests from custom folder
./node_modules/truffle/build/cli.bundled.js test test/contracts/*.js

