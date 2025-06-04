// www/js/index.js

document.addEventListener('deviceready', onDeviceReady, false);

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

    // 3) Iniciar o polling para buscar atualizações a cada 10 segundos
    setInterval(verificarAtualizacoes, 10000);
}

// ===== Função que força a solicitação de permissão =====
function solicitarPermissaoNotificacao() {
    // 1) Primeiro, checa se o plugin está disponível
    if (
        cordova &&
        cordova.plugins &&
        cordova.plugins.notification &&
        cordova.plugins.notification.local
    ) {
        // 2) Verifica se já existe permissão
        cordova.plugins.notification.local.hasPermission(function (granted) {
            console.log('Permissão existente (local):', granted);
            // Se não existe permissão, pede ao sistema
            if (!granted) {
                cordova.plugins.notification.local.requestPermission(function (grantedRequest) {
                    console.log('Permissão solicitada (local):', grantedRequest);
                    if (!grantedRequest) {
                        // Caso o usuário negue, mostramos um aviso simples.
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
                // Exemplo de notificação manual: redireciona para pagina.html?msg=manual
                enviarNotificacao('Atualização manual disparada!', 'pagina.html?msg=manual');
            }
        })
        .catch(err => {
            console.error('Erro ao disparar:', err);
        });
}

// ===== Verifica atualizações no backend =====
function verificarAtualizacoes() {
    const url = `https://api-cordova.vercel.app/updates?since=${ultimoTimestamp}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.nova) {
                data.atualizacoes.forEach(item => {
                    // Aqui, como o backend (mysql/postgres/etc) retornou só { id, mensagem, timestamp },
                    // construímos localmente o link interno com base em item.id:
                    const linkInterno = `pagina.html?idEvento=${item.id}`;

                    enviarNotificacao(item.mensagem, linkInterno);

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