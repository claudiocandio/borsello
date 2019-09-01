
Start server iroha:
iroha-wallet-js$ docker-compose -f docker/docker-compose-mini.yamlup

Start server for browser:
$ ionic cordova run browser

Start/stop server background for browser http://localhost:8000
$ nohup ionic cordova build android --prod --release &
$ pkill ionic

Start server for iPhone tests:
$ ionic serve -c --address 192.168.0.2

-
Buildings

$ ionic cordova build android --debug
cp /datanuc/joker/prog_linux/ionic/Walcc/platforms/android/app/build/outputs/apk/debug/app-debug.apk /data/pub/ionic/

$ ionic cordova build android --prod --release
cd ..
./sign_app.sh /datanuc/joker/prog_linux/ionic/Walcc/platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk Walcc/walcc-v1.0.0.apk
cd -
cp walcc-v1.0.0.apk /data/pub/ionic/
-

$ ionic cordova build ios --prod --release

