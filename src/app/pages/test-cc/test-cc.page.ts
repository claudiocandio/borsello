import { Component, OnInit } from '@angular/core';

import { FileChooser } from '@ionic-native/file-chooser/ngx';
import { File } from '@ionic-native/file/ngx';

@Component({
  selector: 'app-test-cc',
  templateUrl: './test-cc.page.html',
  styleUrls: ['./test-cc.page.scss'],
})
export class TestCCPage implements OnInit {

  public lines: Array<{ str: string; }> = [];

  constructor(private fileChooser: FileChooser, private file: File) {
  }

  ngOnInit() {
  }

  file_chooser(){
    this.lines = null

    this.fileChooser.open()
    .then(uri => {
      alert('uri'+JSON.stringify(uri));
    })
    .catch(err => alert('uri'+JSON.stringify(err)));
  }

  newkeys(){
    
    const iroha = require('iroha-lib') // npm install iroha-lib
    const crypto = new iroha.ModelCrypto()

    function generateKeypair () {
      const keypair = crypto.generateKeypair()
      const publicKey = keypair.publicKey().hex()
      const privateKey = keypair.privateKey().hex()
    
      return { publicKey, privateKey }
    }

    for (let i = 1; i < 11; i++) {
      this.lines.push({
        str: 'Line ' + i
      });
    }
  
    this.file.checkFile(this.file.dataDirectory, 'prk.txt')
    .then(_ => alert('File prk.txt exists'))
    .catch(() => { /* keys not created yet */

      alert('Creating keys puk & prk.txt')
      const { publicKey, privateKey } = generateKeypair()
      alert('puk: '+publicKey+ '\nprk: '+privateKey)
  
      this.file.writeFile(this.file.dataDirectory, 'puk.txt', publicKey)
      .then(() => {
        alert('Ok puk.txt')
      })
      .catch(err => alert(JSON.stringify(err)));
  
      this.file.writeFile(this.file.dataDirectory, 'prk.txt', privateKey)
      .then(() => {
        alert('Ok prk.txt')
      })
      .catch(err => alert(JSON.stringify(err)));
  
    });

  }



}
