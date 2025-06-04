```sh
    cordova requirements
    
    cordova plugin add https://github.com/katzer/cordova-plugin-local-notifications.git
    cordova plugin add cordova-plugin-device
    cordova plugin add https://github.com/NeoLSN/cordova-plugin-android-permissions.git
    
    cordova platform rm android
    cordova platform add android
    
    cordova prepare
    cordova build android

    cordova run android --emulador
```