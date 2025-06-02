document.addEventListener('deviceready', onDeviceReady, false);

let ultimoTimestamp = Date.now();

function onDeviceReady() {
    console.log('Cordova está pronto');
    setInterval(verificarAtualizacoes, 10000); // Verifica a cada 10 segundos
}

// ✅ Notificação na barra
function enviarNotificacao(mensagem) {
    if (cordova && cordova.plugins && cordova.plugins.notification) {
        cordova.plugins.notification.local.schedule({
            title: 'Atualização',
            text: mensagem,
            foreground: true, // Mostra notificação mesmo com o app aberto
        });
    } else {
        alert(mensagem); // Fallback caso o plugin não esteja disponível
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
