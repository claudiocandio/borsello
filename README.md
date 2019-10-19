
# Borsello
[![npm 0.7.1](https://img.shields.io/npm/v/iroha-helpers.svg)](https://www.npmjs.com/package/iroha-helpers)
[![Iroha 1.1.1](https://img.shields.io/badge/Iroha-1.1.1-red.svg)](https://github.com/hyperledger/iroha/releases/tag/1.1.1)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=flat-square)](https://opensource.org/licenses/Apache-2.0)

## Android, iOS and browser wallet App for [Hyperledger Iroha blockchain](http://iroha.readthedocs.io/)
## Developped with the [Ionic Framework](https://ionicframework.com/)

### Borsello is an Iroha wallet App based on https://github.com/soramitsu/iroha-wallet-js

The Borsello wallet App has the following main features:
1. Create a password encrypted Iroha wallet
2. See your assets and transactions
3. Transfer your assets to another Iroha wallet
4. Configure the App to point to different Iroha instances
5. Wallet save/restore
6. Two languages App English/Italian

### Some App screenshots

![borsello](https://www.claudiocandio.it/local/img/borsello1.png)
![borsello](https://www.claudiocandio.it/local/img/borsello2.png)
![borsello](https://www.claudiocandio.it/local/img/borsello3.png)
![borsello](https://www.claudiocandio.it/local/img/borsello4.png)
![borsello](https://www.claudiocandio.it/local/img/borsello5.png)
![borsello](https://www.claudiocandio.it/local/img/borsello6.png)

## Getting Started

### Prerequisites

I used Ubuntu 18.04.3 LTS with the following additional applications: Ionic, cordova, nodejs, npm, docker, docker-compose plus Java and the Android SDK Tools in order to compile the Android App.  
I will provide some links and help to prepare the environment but it may take some time and more reasearch to get things ready, especially for those like me who didn't know much about compiling Android & iOS App before, the web App instead should be easier to run.

#### Install Nodejs & npm - I'm using nodejs v12.9.0  
[Nodejs & npm download](https://nodejs.org/en/download/current/)  

#### Install Ionic
```bash
$ npm -g install ionic cordova native-run
```

Ionic info

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

#### Install docker
```bash
# apt install docker.io
# usermod -G docker -a youruser
```
```bash
$ docker --version
Docker version 18.09.7, build 2d0083d
```

#### Install docker-compose
docker-compose version from Ubuntu 18.04.3 LTS is too old, install 1.25.x from [Docker github](https://github.com/docker/compose/releases)
```bash
$ docker-compose --version
docker-compose version 1.25.0-rc1, build 8552e8e2
```
#### Prerequisites - only need the following for the Android App  
[Android SDK install](http://developer.android.com/sdk/index.html)  
Java
```bash
$ java -version
java version "1.8.0_212"
Java(TM) SE Runtime Environment (build 1.8.0_212-b10)
Java HotSpot(TM) 64-Bit Server VM (build 25.212-b10, mixed mode)
```

### Borsello installation

Clone the repository, change directory to borsello and install the npm packages
```bash
$ git clone https://github.com/claudiocandio/borsello
$ cd borsello
$ npm install
```

Run the Iroha instance using the docker commands, more info on how to run Iroha on [Iroha's docs](http://iroha.readthedocs.io/en/latest/getting_started/index.html)
```bash
$ docker volume create --name=borsello-iroha-postgres-vol
$ docker volume create --name=borsello-iroha-vol
$ docker-compose -f docker/docker-compose-borsello.yaml up
```

Create a new coin asset, for example bcoin with two decimals
```bash
$ node scripts/run.js iroha_util.js asset-create bcoin 2
```
You can create multiple coin assets

### Compiling the Android App

Compile the Android mobile App, this may take a while depending on your hardware
```bash
$ ionic cordova build android --prod --release
```

It will create platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk  
then you need more work to sign the App and make it ready to be installed, here some documentation but you may need to research more to get it done:  

[Ionic build](https://ionicframework.com/docs/cli/commands/cordova-build).  
[Ionic Android installation](https://ionicframework.com/docs/installation/android).  
[Ionic iOS installation](https://ionicframework.com/docs/installation/ios).  

If you just want to play with Iroha I have alreay prepared the Borsello Android App ready to be installed in this repository - [borsello-v1.0.6.apk](https://github.com/claudiocandio/borsello/raw/master/borsello-v1.0.6.apk).  - if you trust me ;-)  

### Compiling the iOS App
Compile the iOS mobile App, this should get an error unless you are using a MacOS that I still don't have.
```bash
$ ionic cordova build ios --prod --release
```

### Use the web browser App
You could run and test the Borsello App with a web browser, the main functions will work with the browse but not all of them, this is an easier option than compile the Android & iOS Apps if you just would like to play with the Iroha wallet.
```bash
$ ionic cordova platform add browser
$ ionic cordova run browser
```

### Running

Once you have the Borsello App ready and installed you must configure it to use your Iroha server pointing to port 8081 of the grpcwebproxy: start the Borsello App, go to Options and set the "Server address" ex.:  http://192.168.0.2:8081 or http://127.0.0.1:8081 (default) if you are using the web browser App in the same server where you started Iroha.

Create a new wallet name in the App, ex.: alice, you may encrypt your new wallet using a password.

Add some bcoin to your alice wallet, let's say we add 150.37 bcoin
```bash
$ node scripts/run.js iroha_util.js account-add-amount alice bcoin 150.37
```
Restart the App or tap/click the "Change Currency" to see your bcoin appear.

Do the same for any additional wallet you created and then you can start sending bcoin or any other asset between the wallets created.

Have fun!

## Disclaimer

This project was created just for fun to play with the Hyperledger Iroha blockchain and mobile apps, I never used Javascript, Typescript, Ionic and most of the things used here before of this project, so do not expect this to be a coding model and use it at your own risk.  
;-)

