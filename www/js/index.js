// www/js/index.js
document.addEventListener('deviceready', onDeviceReady, false);

const API_BASE_URL = "https://api-cordova.vercel.app"; // ou http://<seu-endereco>:3000
let currentFcmToken = null;

function onDeviceReady() {
    console.log('Cordova está pronto');

    // 1) Forçar pedido de permissão (Android 13+ usa permissões FCM separadas)
    solicitarPermissaoNotificacaoLocal();

    // 2) Inicializar Firebasex e obter token FCM
    initFirebaseMessaging();

    // 3) Registrar listener para cliques em notificações locais (cordova-plugin-local-notification)
    cordova.plugins.notification.local.on('click', (notification) => {
        console.log('Notificação local clicada, abriu link:', notification.data.link);
        if (notification.data && notification.data.link) {
            window.location = notification.data.link;
        }
    });
}

// ===== Função que força a solicitação de permissão para notificações locais =====
function solicitarPermissaoNotificacaoLocal() {
    if (
        cordova &&
        cordova.plugins &&
        cordova.plugins.notification &&
        cordova.plugins.notification.local
    ) {
        cordova.plugins.notification.local.hasPermission((granted) => {
            console.log('Permissão existente (local):', granted);
            if (!granted) {
                cordova.plugins.notification.local.requestPermission((grantedRequest) => {
                    console.log('Permissão solicitada (local):', grantedRequest);
                    if (!grantedRequest) {
                        alert('É necessário permitir notificações para receber atualizações.');
                    }
                });
            }
        });
    }
}

// ===== Inicializa Firebasex, obtém token e registra handlers =====
function initFirebaseMessaging() {
    // 1. Verifica se o plugin existe
    if (!window.FirebasePlugin && !window.FCM) {
        console.warn('Plugin Firebasex/Firebase não encontrado.');
        return;
    }

    // 2. Pede permissão para receber notificações (iOS; no Android 13+ o plugin Firebasex faz isso automaticamente)
    window.FirebasePlugin.hasPermission((granted) => {
        if (!granted) {
            window.FirebasePlugin.grantPermission((permGranted) => {
                console.log('Permissão FCM concedida?', permGranted);
            });
        }
    });

    // 3. Pegar token FCM para este dispositivo
    window.FirebasePlugin.getToken(
        (token) => {
            console.log('Token FCM obtido:', token);
            currentFcmToken = token;
            // 3.1. Registrar token no nosso backend
            registrarTokenNoServidor(token);
        },
        (err) => {
            console.error('Erro ao obter token FCM:', err);
        }
    );

    // 4. Ouvinte para atualização do token (caso o token seja trocado pelo FCM)
    window.FirebasePlugin.onTokenRefresh((newToken) => {
        console.log('Token FCM atualizado:', newToken);
        currentFcmToken = newToken;
        registrarTokenNoServidor(newToken);
    });

    // 5. Listener para mensagens recebidas **com o app aberto** (foreground)
    window.FirebasePlugin.onMessageReceived((message) => {
        console.log('Mensagem FCM recebida (foreground):', message);
        // Se a mensagem tiver 'notification', ela já vai exibir notificação nativa automaticamente.
        // Mas podemos disparar uma local notification customizada:
        if (message && message.notification) {
            const title = message.notification.title || '';
            const body = message.notification.body || '';
            const link = message.data ? message.data.link : null;
            showLocalNotification(message.messageId, title, body, link);
        }
    });

    // 6. Listener para background messages (quando o app estiver em background ou fechado)
    //    O plugin Firebasex faz automaticamente a exibição de notificação nativa quando
    //    a payload contiver 'notification'. Se quiser customizar, precisa de código nativo.
    window.FirebasePlugin.onBackgroundMessage((message) => {
        console.log('Mensagem FCM recebida (background):', message);
        // Geralmente, o Firebasex já exibe a notificação nativa se houver message.notification.
        // Se quiser uma local notification customizada (icones, sons), use showLocalNotification().
        if (message && message.notification) {
            const title = message.notification.title || '';
            const body = message.notification.body || '';
            const link = message.data ? message.data.link : null;
            showLocalNotification(message.messageId, title, body, link);
        }
    });
}

// ===== Registra o token FCM no servidor =====
function registrarTokenNoServidor(token) {
    fetch(`${API_BASE_URL}/register-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token }),
    })
        .then((res) => res.json())
        .then((json) => {
            console.log('Resposta do /register-token:', json);
        })
        .catch((err) => {
            console.error('Erro ao registrar token no servidor:', err);
        });
}

// ===== Função utilitária para disparar uma local notification customizada =====
function showLocalNotification(id, title, text, linkInterno) {
    if (
        cordova &&
        cordova.plugins &&
        cordova.plugins.notification &&
        cordova.plugins.notification.local
    ) {
        cordova.plugins.notification.local.schedule({
            id: id || Date.now(),
            title: title,
            text: text,
            foreground: true,
            smallIcon: 'res://ic_stat_notification',
            sound: 'res://notification',
            data: { link: linkInterno },
        });
        console.log('Local Notification exibida:', title, text, linkInterno);
    } else {
        console.warn('Fallback: não foi possível exibir Local Notification. Mensagem:', text);
    }
}