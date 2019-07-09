import { Injectable } from '@angular/core';
import { resolve } from 'q';

import * as grpc from 'grpc'
import {
  QueryService_v1Client,
  CommandService_v1Client
} from 'iroha-helpers/lib/proto/endpoint_grpc_pb'
import { commands, queries } from 'iroha-helpers'

const DEFAULT_TIMEOUT_LIMIT = 5000
//const nodeIp = 'http://192.168.0.2:9081'
const nodeIp = '192.168.0.2:50051'

const queryService = new QueryService_v1Client(
  nodeIp,
  grpc.credentials.createInsecure()
)
const commandService = new CommandService_v1Client(
  nodeIp,
  grpc.credentials.createInsecure()
)

@Injectable({
  providedIn: 'root'
})

export class IrohautilService {

  constructor() { }

  login(username, privateKey) {

    /*
          commands.setAccountDetail({
            privateKeys: [privateKey],
            creatorAccountId: 'admin@test',
            quorum: 1,
            commandService,
            timeoutLimit: 5000
          }, {
              accountId: 'admin@test',
              key: 'jason',
              value: 'statham'
            }),
    */
    queries.getAccountDetail({
      privateKey: privateKey,
      creatorAccountId: username,
      queryService,
      timeoutLimit: DEFAULT_TIMEOUT_LIMIT
    }, {
        accountId: username
      }).then(account => {
        return Promise.resolve(account)
      }).catch(err => {
        return Promise.reject(err)
      })

  }

}
