
// run using: node runbabel.js getacc.js
import * as iroha from 'iroha-lib'   // this has to be on top, otherwise it gives error TypeError: message.getMainPubkey_asU8 is not a function
const crypto = new iroha.ModelCrypto() // npm i iroha-lib

import grpc from 'grpc'
import {
  QueryService_v1Client as QueryService,
  CommandService_v1Client as CommandService
} from 'iroha-helpers/lib/proto/endpoint_grpc_pb'  // npm i iroha-helpers

import { commands, queries } from 'iroha-helpers'
import fs from 'fs'

// To be modified
const irohaDomain = 'mini'
const adminAccName = 'admin'
const adminPrivKey = 'e2e3c49be71ae0e1721b1a573f3d49756b87fce58679243dd4bbe09008158cf0'
//const NODE_IP = process.env.NODE_IP || '127.0.0.1:50051'
const NODE_IP = '127.0.0.1:50051'

const adminAccFull = `${adminAccName}@${irohaDomain}`

const DEFAULT_TIMEOUT_LIMIT = 5000

function usage() {
  console.log("Usage: " + __filename.substring(__filename.lastIndexOf('/')+1) + " asset-create assetid decimals");
  console.log(" Example: " + __filename.substring(__filename.lastIndexOf('/')+1) + " asset-create mycoin 2");
  console.log("Usage: " + __filename.substring(__filename.lastIndexOf('/')+1) + " account-add-amount accountname assetid amount");
  console.log(" Example: " + __filename.substring(__filename.lastIndexOf('/')+1) + " account-add-amount alice mycoin 150.37");
  process.exit(-1);
}

let amount = null
let assetid = null
let action = null
let AccName = null
let AccNameFull = null
let decimals = null

if (process.argv.length <= 4) { // at least 2 parameters
  usage()
}
else if (
  process.argv.length == 7 &&
  process.argv[3] == "account-add-amount"
) {
  action = process.argv[3]

  AccName = process.argv[4]
  AccNameFull = `${AccName}@${irohaDomain}`
  assetid = process.argv[5] + '#' + irohaDomain
  amount = process.argv[6]
}
else if (
  process.argv.length == 6 &&
  process.argv[3] == "asset-create"
) {
  action = process.argv[3]

  assetid = process.argv[4]
  decimals = process.argv[5]
}
else usage()

/////////
///////// account-add-amount
/////////
if (action == "account-add-amount") {

  new Promise((resolve, reject) => resolve())
    .then(async () => await account_add_amount(AccNameFull, assetid, amount))
    .then((assets) => {
      console.log('Added ' + amount + ' to ' + AccNameFull)
      console.log('Total assets of: ' + AccNameFull)
      console.log(JSON.stringify(assets))
    })
    .catch((err) => console.log(err))

}
/////////
///////// asset-create
/////////
else if (action == "asset-create") {

  new Promise((resolve, reject) => resolve())
    .then(async () => await asset_create(assetid, decimals))
    .then(() => {
      console.log("AssetId : " + assetid + " created")
    })
    .catch((err) => console.log(err))
}
/////////
///////// asset-get
/////////

////////////////////////////////
///// Below only functions /////
////////////////////////////////

async function asset_create(assetid, decimals) {

  try {
    await commands.createAsset(
      newCommandServiceOptions([adminPrivKey], 1, adminAccFull),
      {
        assetName: assetid,
        domainId: irohaDomain,
        precision: decimals
      }
    )
  } catch (error) {
    return Promise.reject(error)
  }

}

async function account_add_amount(AccNameFull, assetId, amount) {

  //check whether the account exists  
  try {
    const account = await queries.getAccount(
      newQueryServiceOptions(adminPrivKey, adminAccFull),
      {
        accountId: AccNameFull
      }
    )
  } catch (error) {
    console.log("Error: " + AccNameFull + "does not exist")
    return Promise.reject(error)
  }

  // addAssetQuantity only works adding to admin first
  console.log(`Adding ${amount} ${assetId} to ${adminAccFull}`)
  try {
    await commands.addAssetQuantity(
      newCommandServiceOptions([adminPrivKey], 1, adminAccFull),
      {
        assetId,
        amount
      }
    )
  } catch (error) {
    return Promise.reject(error)
  }

  if (AccNameFull !== 'admin@' + irohaDomain) {
    console.log(`Transfer ${amount} ${assetId} to ${AccNameFull}`)
    try {
      await commands.transferAsset(
        newCommandServiceOptions([adminPrivKey], 1, adminAccFull),
        {
          srcAccountId: adminAccFull,
          destAccountId: AccNameFull,
          assetId,
          description: '',
          amount: amount
        }
      )
    } catch (error) {
      return Promise.reject(error)
    }
  }

  try {
    const assets = await queries.getAccountAssets(
      newQueryServiceOptions(adminPrivKey, adminAccFull),
      {
        accountId: AccNameFull,
        pageSize: 100
      }
    )
    return Promise.resolve(assets)
  } catch (error) {
    console.log(error)
  }

}

//////////////////////////
//// iroha functions /////
//////////////////////////

function newCommandServiceOptions(privateKeys, quorum, accountId) {
  return {
    privateKeys,
    quorum,
    creatorAccountId: accountId,
    commandService: new CommandService(
      NODE_IP,
      grpc.credentials.createInsecure()
    ),
    timeoutLimit: DEFAULT_TIMEOUT_LIMIT
  }
}

function newQueryServiceOptions(privateKey, accountId) {
  return {
    privateKey: privateKey,
    creatorAccountId: accountId,
    queryService: new QueryService(
      NODE_IP,
      grpc.credentials.createInsecure()
    ),
    timeoutLimit: DEFAULT_TIMEOUT_LIMIT
  }
}

