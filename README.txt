ionic cordova run browser
ionic serve -c --address 192.168.0.2

-
ionic cordova build android --debug
cp /datanuc/joker/prog_linux/ionic/Walcc/platforms/android/app/build/outputs/apk/debug/app-debug.apk /data/pub/ionic/

ionic cordova build android --prod --release
cd ..
./sign_app.sh /datanuc/joker/prog_linux/ionic/Walcc/platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk walcc-v1.0.0.apk
cp walcc-v1.0.0.apk /data/pub/ionic/
mv -f walcc-v1.0.0.apk Walcc/
-

--
Per errori
ReferenceError: Buffer is not defined
https://github.com/mtth/avsc/issues/200
Got this working by adding the following:

- In Index.html:
<script> var global = global || window; </script>

In polyfills.ts:
global.Buffer = global.Buffer || require('buffer').Buffer;

(window as any).process = {
env: { DEBUG: undefined },
};
--
--

