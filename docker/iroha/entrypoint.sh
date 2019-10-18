#!/bin/sh
#while ! curl http://wallet-js-iroha-postgres:5432/ 2>&1 | grep '52'
#do
#done
sleep 10
# --overwrite-ledger
irohad --genesis_block genesis-borsello.block.json --config config.docker --keypair_name $KEY
