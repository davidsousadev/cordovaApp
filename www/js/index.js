document.addEventListener('deviceready', onDeviceReady, false);

let ultimoTimestamp = Date.now();

function onDeviceReady() {
    console.log('Cordova está pronto');

    // ✅ Solicita permissão (Android 13+)
    if (cordova.plugins.notification) {
        cordova.plugins.notification.local.requestPermission(function (granted) {
            console.log('Permissão de notificação: ', granted);
        });
    }

    setInterval(verificarAtualizacoes, 10000);
}

// ✅ Envia notificação com ID único
function enviarNotificacao(mensagem) {
    if (cordova && cordova.plugins && cordova.plugins.notification) {
        const id = Date.now(); // 🔥 ID único garantido

        cordova.plugins.notification.local.schedule({
            id: id,
            title: 'Atualização',
            text: mensagem,
            foreground: true,
        });

        console.log('Notificação enviada:', mensagem, 'ID:', id);

    } else {
        alert(mensagem); // Fallback para navegador
    }
}

// 🔥 Dispara uma atualização manual
function dispararAtualizacao() {
    fetch('https://api-cordova.vercel.app/trigger')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                enviarNotificacao('Atualização criada com sucesso!');
            }
        })
        .catch(err => {
            console.error('Erro ao disparar:', err);
        });
}

// 🔍 Verifica atualizações no backend
function verificarAtualizacoes() {
    const url = `https://api-cordova.vercel.app/updates?since=${ultimoTimestamp}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.nova) {
                data.atualizacoes.forEach(item => {
                    enviarNotificacao(item.mensagem);
                    if (item.timestamp > ultimoTimestamp) {
                        ultimoTimestamp = item.timestamp;
                    }
                });
                document.getElementById('status').innerText = 'Nova atualização recebida!';
            } else {
                document.getElementById('status').innerText = 'Sem novas atualizações.';
            }
        })
        .catch(err => {
            console.error('Erro na verificação:', err);
            document.getElementById('status').innerText = 'Erro na conexão.';
        });
}
