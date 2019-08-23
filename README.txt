ionic cordova run browser
ionic serve -c --address 192.168.0.2
ionic cordova build android --debug
cp /datanuc/joker/prog_linux/ionic/Walcc/platforms/android/app/build/outputs/apk/debug/app-debug.apk /data/pub/ionic/

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

