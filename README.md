```sh
    cordova requirements
    
    cordova platform rm android
    cordova platform add android@13.0.0 # aach64
    
    cordova plugin add https://github.com/katzer/cordova-plugin-local-notifications.git
    cordova plugin add cordova-plugin-device
    cordova plugin add https://github.com/NeoLSN/cordova-plugin-android-permissions.git

    cordova prepare
    cordova build android

    cordova run android --emulador
```