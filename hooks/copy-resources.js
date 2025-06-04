#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Garante que sempre usamos a raiz do projeto, não importa o parâmetro passado
// __dirname aponta para hooks/, então um nível acima é a raiz do projeto
const projectRoot = path.resolve(__dirname, '..');

// Lista de arquivos a copiar, com caminhos sempre relativos a projectRoot
const filesToCopy = [
    // Ícone principal do app (mipmap)
    {
        src: path.join(projectRoot, 'resources', 'icon.png'),
        dest: path.join(projectRoot, 'platforms', 'android', 'app', 'src', 'main', 'res', 'mipmap-hdpi', 'icon.png')
    },
    {
        src: path.join(projectRoot, 'resources', 'icon.png'),
        dest: path.join(projectRoot, 'platforms', 'android', 'app', 'src', 'main', 'res', 'mipmap-mdpi', 'icon.png')
    },
    {
        src: path.join(projectRoot, 'resources', 'icon.png'),
        dest: path.join(projectRoot, 'platforms', 'android', 'app', 'src', 'main', 'res', 'mipmap-xhdpi', 'icon.png')
    },
    {
        src: path.join(projectRoot, 'resources', 'icon.png'),
        dest: path.join(projectRoot, 'platforms', 'android', 'app', 'src', 'main', 'res', 'mipmap-xxhdpi', 'icon.png')
    },
    {
        src: path.join(projectRoot, 'resources', 'icon.png'),
        dest: path.join(projectRoot, 'platforms', 'android', 'app', 'src', 'main', 'res', 'mipmap-xxxhdpi', 'icon.png')
    },

    // Ícone de notificação (drawable)
    {
        src: path.join(projectRoot, 'resources', 'ic_stat_notification.png'),
        dest: path.join(projectRoot, 'platforms', 'android', 'app', 'src', 'main', 'res', 'drawable-mdpi', 'ic_stat_notification.png')
    },
    {
        src: path.join(projectRoot, 'resources', 'ic_stat_notification.png'),
        dest: path.join(projectRoot, 'platforms', 'android', 'app', 'src', 'main', 'res', 'drawable-hdpi', 'ic_stat_notification.png')
    },
    {
        src: path.join(projectRoot, 'resources', 'ic_stat_notification.png'),
        dest: path.join(projectRoot, 'platforms', 'android', 'app', 'src', 'main', 'res', 'drawable-xhdpi', 'ic_stat_notification.png')
    },
    {
        src: path.join(projectRoot, 'resources', 'ic_stat_notification.png'),
        dest: path.join(projectRoot, 'platforms', 'android', 'app', 'src', 'main', 'res', 'drawable-xxhdpi', 'ic_stat_notification.png')
    },
    {
        src: path.join(projectRoot, 'resources', 'ic_stat_notification.png'),
        dest: path.join(projectRoot, 'platforms', 'android', 'app', 'src', 'main', 'res', 'drawable-xxxhdpi', 'ic_stat_notification.png')
    },

    // Som da notificação
    {
        src: path.join(projectRoot, 'resources', 'notification.mp3'),
        dest: path.join(projectRoot, 'platforms', 'android', 'app', 'src', 'main', 'res', 'raw', 'notification.mp3')
    }
];

filesToCopy.forEach(file => {
    const srcfile = file.src;
    const destfile = file.dest;
    const destdir = path.dirname(destfile);

    if (fs.existsSync(srcfile)) {
        if (!fs.existsSync(destdir)) {
            fs.mkdirSync(destdir, { recursive: true });
        }
        fs.copyFileSync(srcfile, destfile);
        console.log(`✔ Copied ${srcfile} to ${destfile}`);
    } else {
        console.warn(`⚠ File ${srcfile} does not exist`);
    }
});
