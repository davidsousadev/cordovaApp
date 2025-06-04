document.addEventListener('deviceready', onDeviceReady, false);

let ws;  // variável para armazenar o WebSocket
const URL_BASE = "api-cordova.onrender.com";
const HTTP_URL = `https://${URL_BASE}`;
const WS_URL = `wss://${URL_BASE}/socket`;

let ultimoTimestamp = Date.now();

function onDeviceReady() {
    console.log('Cordova está pronto');

    // 1) Forçar pedido de permissão logo que o app abre (para Android 13+)
    solicitarPermissaoNotificacao();

    // 2) Registrar listener para clique em notificação
    cordova.plugins.notification.local.on('click', function (notification) {
        console.log('Notificação clicada, abriu link:', notification.data.link);
        if (notification.data && notification.data.link) {
            window.location = notification.data.link;
        }
    });

    // 3) Abrir conexão WebSocket para receber atualizações em tempo real
    iniciarWebSocket();
}

// ===== Função que força a solicitação de permissão =====
function solicitarPermissaoNotificacao() {
    if (
        cordova &&
        cordova.plugins &&
        cordova.plugins.notification &&
        cordova.plugins.notification.local
    ) {
        cordova.plugins.notification.local.hasPermission(function (granted) {
            console.log('Permissão existente (local):', granted);
            if (!granted) {
                cordova.plugins.notification.local.requestPermission(function (grantedRequest) {
                    console.log('Permissão solicitada (local):', grantedRequest);
                    if (!grantedRequest) {
                        alert('É necessário permitir notificações para receber atualizações.');
                    }
                });
            }
        });
    }
}

// ===== Envia notificação com ID único e link interno =====
function enviarNotificacao(mensagem, linkInterno) {
    if (
        cordova &&
        cordova.plugins &&
        cordova.plugins.notification &&
        cordova.plugins.notification.local
    ) {
        const id = Date.now();

        cordova.plugins.notification.local.schedule({
            id: id,
            title: 'Atualização',
            text: mensagem,
            foreground: true,
            smallIcon: 'res://ic_stat_notification',
            sound: 'res://notification',
            data: { link: linkInterno }
        });

        console.log('Notificação enviada:', mensagem, 'ID:', id, 'Link:', linkInterno);
    } else {
        alert(`(Fallback) ${mensagem}\nAbra: ${linkInterno}`);
    }
}

// ===== Função manual para disparar atualização =====
function dispararAtualizacao() {
    fetch(`${HTTP_URL}/trigger`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                enviarNotificacao('Atualização manual disparada!', 'pagina.html?msg=manual');
            }
        })
        .catch(err => {
            console.error('Erro ao disparar:', err);
        });
}

// ===== Abre conexão WebSocket =====
function iniciarWebSocket() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
    }

    try {
        ws = new WebSocket(WS_URL);

        ws.onopen = function () {
            console.log('WebSocket aberto em:', WS_URL);
        };

        ws.onmessage = function (event) {
            console.log('Mensagem recebida via WebSocket:', event.data);
            try {
                const data = JSON.parse(event.data);

                if (data.nova && Array.isArray(data.atualizacoes)) {
                    data.atualizacoes.forEach(item => {
                        const linkInterno = `pagina.html?idEvento=${item.id}`;
                        enviarNotificacao(item.mensagem, linkInterno);

                        if (item.timestamp > ultimoTimestamp) {
                            ultimoTimestamp = item.timestamp;
                        }
                    });
                    atualizarStatus('Nova atualização recebida via WebSocket!');
                } else {
                    atualizarStatus('Sem novas atualizações.');
                }
            } catch (e) {
                console.error('Erro ao parsear mensagem WebSocket:', e);
            }
        };

        ws.onerror = function (err) {
            console.error('Erro no WebSocket:', err);
            atualizarStatus('Erro na conexão WebSocket.');
        };

        ws.onclose = function (event) {
            console.log('WebSocket fechado:', event.code, event.reason);
            atualizarStatus('WebSocket desconectado. Tentando reconectar...');
            setTimeout(iniciarWebSocket, 5000);
        };
    } catch (ex) {
        console.error('Falha ao iniciar WebSocket:', ex);
        atualizarStatus('Não foi possível iniciar WebSocket.');
    }
}

// ===== Atualiza status na interface =====
function atualizarStatus(texto) {
    const statusEl = document.getElementById('status');
    if (statusEl) {
        statusEl.innerText = texto;
    }
}