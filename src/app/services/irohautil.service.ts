import { Injectable } from '@angular/core';
import irohaUtil from '../../util/iroha/'

const nodeIp = 'http://192.168.0.2:8081'

@Injectable({
  providedIn: 'root'
})

export class IrohautilService {

  constructor() { }

  login_wallcc(username, privateKey) {
    alert("login: username="+username+" privateKey="+privateKey+" nodeIp="+nodeIp)

    irohaUtil.login(username, privateKey, nodeIp)
    .then(account => alert("login ok: " + JSON.stringify(account)))
    .catch(err => alert("login failed: " + JSON.stringify(err)))

  }


}
