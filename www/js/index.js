document.addEventListener('deviceready', onDeviceReady, false);

let ws;                       // variável para armazenar o WebSocket
const WS_URL = 'wss://api-cordova.vercel.app/socket'; 
let ultimoTimestamp = Date.now();

function onDeviceReady() {
    console.log('Cordova está pronto');

    // 1) Forçar pedido de permissão logo que o app abre (para Android 13+)
    solicitarPermissaoNotificacao();

    // 2) Registrar listener para clique em notificação
    cordova.plugins.notification.local.on('click', function (notification) {
        console.log('Notificação clicada, abriu link:', notification.data.link);
        if (notification.data && notification.data.link) {
            // Redirecionar para a página interna (usa query params)
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
        const id = Date.now(); // Garante ID único

        cordova.plugins.notification.local.schedule({
            id: id,
            title: 'Atualização',
            text: mensagem,
            foreground: true,
            smallIcon: 'res://ic_stat_notification',
            sound: 'res://notification',    // sem extensão
            data: { link: linkInterno }
        });        

        console.log('Notificação enviada:', mensagem, 'ID:', id, 'Link:', linkInterno);
    } else {
        // Fallback simples para navegador em desktop
        alert(`(Fallback) ${mensagem}\nAbra: ${linkInterno}`);
    }
}

// ===== Função manual para disparar atualização =====
function dispararAtualizacao() {
    fetch('https://api-cordova.vercel.app/trigger')
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
    // Se já existir uma conexão aberta, fechamos antes
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
    }

    try {
        ws = new WebSocket(WS_URL);

        ws.onopen = function () {
            console.log('WebSocket aberto em:', WS_URL);
            // Opcional: caso queira enviar algo ao servidor no momento de abertura, descomente abaixo.
            // Mas o nosso socket.js no back-end já faz broadcast sempre que "NOTIFY" é recebido.
            // const payload = JSON.stringify({ type: 'sync', since: ultimoTimestamp });
            // ws.send(payload);
        };

        ws.onmessage = function (event) {
            console.log('Mensagem recebida via WebSocket:', event.data);
            try {
                const data = JSON.parse(event.data);
                // Espera-se formato: { nova: boolean, atualizacoes: [ { id, mensagem, timestamp } ] }
                if (data.nova && Array.isArray(data.atualizacoes)) {
                    data.atualizacoes.forEach(item => {
                        const linkInterno = `pagina.html?idEvento=${item.id}`;
                        enviarNotificacao(item.mensagem, linkInterno);

                        if (item.timestamp > ultimoTimestamp) {
                            ultimoTimestamp = item.timestamp;
                        }
                    });
                    document.getElementById('status').innerText = 'Nova atualização recebida via WebSocket!';
                } else {
                    document.getElementById('status').innerText = 'Sem novas atualizações.';
                }
            } catch (e) {
                console.error('Erro ao parsear mensagem WebSocket:', e);
            }
        };

        ws.onerror = function (err) {
            console.error('Erro no WebSocket:', err);
            document.getElementById('status').innerText = 'Erro na conexão WebSocket.';
        };

        ws.onclose = function (event) {
            console.log('WebSocket fechado:', event.code, event.reason);
            // Opcional: tentar reconectar após alguns segundos
            setTimeout(iniciarWebSocket, 5000);
            document.getElementById('status').innerText = 'WebSocket desconectado. Tentando reconectar...';
        };
    } catch (ex) {
        console.error('Falha ao iniciar WebSocket:', ex);
        document.getElementById('status').innerText = 'Não foi possível iniciar WebSocket.';
    }
}