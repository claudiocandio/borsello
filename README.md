
# Borsello
[![npm 0.7.1](https://img.shields.io/npm/v/iroha-helpers.svg)](https://www.npmjs.com/package/iroha-helpers)
[![Iroha 1.1.1](https://img.shields.io/badge/Iroha-1.1.1-red.svg)](https://github.com/hyperledger/iroha/releases/tag/1.1.1)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=flat-square)](https://opensource.org/licenses/Apache-2.0)

## Android & iOS App for [Iroha Hyperledger blockchain](http://iroha.readthedocs.io/)
## Developped with the [Ionic Framework](https://ionicframework.com/)

Borsello is an Iroha wallet App based on https://github.com/soramitsu/iroha-wallet-js

The Borsello wallet App has the following main features:
1. Create a password encrypted Iroha wallet
2. See your assets and transactions
3. Transfer your assets to another Iroha wallet
4. Configure server address to point to different Iroha instances
5. Wallet restore using wallet name and private key
6. Two languages App English/Italian

![borsello](https://www.claudiocandio.it/local/img/borsello1.png)
![borsello](https://www.claudiocandio.it/local/img/borsello2.png)
![borsello](https://www.claudiocandio.it/local/img/borsello3.png)
![borsello](https://www.claudiocandio.it/local/img/borsello4.png)
![borsello](https://www.claudiocandio.it/local/img/borsello5.png)
![borsello](https://www.claudiocandio.it/local/img/borsello6.png)


## Getting Started

### Prerequisites

I used Ubuntu 18.04.3 LTS then you will need quite a few applications: Ionic, cordova, nodejs, npm, docker, docker-compose, Java and Android SDK Tools, here some help and links to prepare the environment, hopefully I haven't forgotten anything and it may take some time and more reasearch to get things ready:

[Nodejs & npm download](https://nodejs.org/en/download/)  
[Nodejs & npm Install](https://github.com/nodejs/help/wiki/Installation)  

Ionic & Cordova
```bash
$ npm -g install ionic
$ npm -g install cordova
```

Some versions  

```bash
$ ionic info

Ionic:

   Ionic CLI                     : 5.4.2 (/datanuc/joker/prog_linux/local/node-v12.9.0-linux-x64/lib/node_modules/ionic)
   Ionic Framework               : @ionic/angular 4.7.4
   @angular-devkit/build-angular : 0.13.9
   @angular-devkit/schematics    : 7.3.9
   @angular/cli                  : 7.3.9
   @ionic/angular-toolkit        : 1.5.1

Cordova:

   Cordova CLI       : 9.0.0 (cordova-lib@9.0.1)
   Cordova Platforms : android 8.0.0, browser 6.0.0
   Cordova Plugins   : cordova-plugin-ionic-keyboard 2.1.3, cordova-plugin-ionic-webview 4.1.1, (and 9 other plugins)

Utility:

   cordova-res : 0.7.0 (update available: 0.8.0)
   native-run  : 0.2.8 (update available: 0.2.9)

System:

   Android SDK Tools : 26.1.1 (/home/joker/prog_linux/local/Android/Sdk)
   NodeJS            : v12.9.0 (/datanuc/joker/prog_linux/local/node-v12.9.0-linux-x64/bin/node)
   npm               : 6.12.0
   OS                : Linux 4.15
```

```bash
$ docker --version
Docker version 18.09.7, build 2d0083d
```

Docker version from Ubuntu is too old, install 1.25.x from here [Docker github](https://github.com/docker/compose/releases)
```bash
$ docker-compose --version
docker-compose version 1.25.0-rc1, build 8552e8e2
```

[SDK Android install](http://developer.android.com/sdk/index.html)

```bash
$ java -version
java version "1.8.0_212"
Java(TM) SE Runtime Environment (build 1.8.0_212-b10)
Java HotSpot(TM) 64-Bit Server VM (build 25.212-b10, mixed mode)
```

### Borsello installation

Clone the repository
```bash
$ git clone https://github.com/claudiocandio/borsello
```

Change directory to borsello
```bash
$ cd borsello
```

Install the npm packages
```bash
$ npm install
```

Run an Iroha instance using the docker-compose command, more info on how to run Iroha on [Iroha's docs](http://iroha.readthedocs.io/en/latest/getting_started/index.html)
```bash
$ docker volume create --name=borsello-iroha-postgres-vol
$ docker volume create --name=borsello-iroha-vol
$ docker-compose -f docker/docker-compose-borsello.yaml up
```

Create a new asset coin, for example bcoin with two decimals
```bash
$ node scripts/run.js iroha_util.js asset-create bcoin 2
```

### Compiling the App

Compile the Android mobile App, this may take a while depending on your hardware
```bash
$ ionic cordova build android --prod --release
```
It will create platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk  
then you will need more work to sign the App and make it ready to be installed, here some documentation:  

[Ionic build](https://ionicframework.com/docs/cli/commands/cordova-build).  
[Ionic Android installation](https://ionicframework.com/docs/installation/android).  
[Ionic iOS installation](https://ionicframework.com/docs/installation/ios).  

I have alreay prepared the Android App ready to be installed in this repository - borsello-v1.0.6.apk - if you trust me ;-)  
No iOS App is available yet as it would require a MacOS and some other things I still don't have.

### Running

Once you install and run the App you will need to create your wallet name, for example: alice, you may also encrypt it using a password.

You can also run and test the application via web browser, the main functions will work with the browse but not all of them
```bash
$ ionic cordova run browser
```

When you have created the new alice wallet you will need to add some bcoin to be able top play with it, let's say we add 150.37 bcoin
```bash
$ node scripts/run.js iroha_util.js account-add-amount alice bcoin 150.37
```

Do the same for any additional wallets you created and then you can start using the App to send bcoin or any other asset between the wallets created.

To use the Borsello App or the web browser App you must configure the Iroha server address, open the App, go to Options and set the "Server address" with the ip or dns name of your Iroha instance, ex.:  http://192.168.0.2:8081

Have fun!

## Disclaimer

All this project was created just for fun to play with the Hyperledger Iroha blockchain and mobile apps, I never used Javascript, Typescript, Ionic and most of the things used here before of this project, so do not expect this to be a coding model and use it at your own risk.  
;-)

