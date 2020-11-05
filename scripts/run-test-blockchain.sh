#!/bin/bash

# Executes cleanup function at script exit.
trap cleanup EXIT

cleanup() {
  # Kill the ganachecli instance that we started (if we started one).
  if [ -n "$ganachecli_pid" ]; then
    kill -9 $ganachecli_pid
  fi
}
##### THESE accounts are in our blockchain-wallet-storage
#
# Account 1 
# Address 0x18063ff0fd85135591b08f12830ee311d7fd93bf 
# PK: 0x5767f39a7e4c819fe766420ba49ed8513fa51bf200cc7d531e605318cd0b11cc

ganachecli_running() {
  nc -z localhost 8555
}

if ganachecli_running; then
  echo "Using existing ganache-cli instance"
else
  echo "Starting ganache-cli"
  #./node_modules/ganache-cli/build/cli.node.js --gasLimit 0xfffffffffff --port 8555 --defaultBalanceEther 200\

  ./node_modules/ganache-cli/cli.js --networkId 1111 -b 2 --gasLimit 0xfffffffffff --port 8555 --defaultBalanceEther 200\
  --account="0x5767f39a7e4c819fe766420ba49ed8513fa51bf200cc7d531e605318cd0b11cc, 30000000000000000000000000000000000000"\

  # Uncomment this is want to run in the background
  #> /dev/null &

  # You can run *truffle migrate --network development (see truffle-config.js)* after you have started the nework 

  ganachecli_pid=$!
fi


