import './styles.css';

import config from '../package';

import 'phaser';

import DustPhaserPlugin from 'dust-phaser-plugin';

import Sfx from './plugins/Sfx.js';
import Ambient from './plugins/Ambient.js';
import LevelStats from './plugins/LevelStats.js';
import SimplePlatformerControls from './plugins/SimplePlatformerControls.js';
import SecondaryPlatformerControls from './plugins/SecondaryPlatformerControls.js';
import State from './plugins/State.js';

let scenes = [];
let importScenes = (r) => {
    r.keys().forEach((k) => {
        scenes.push(r(k).default);
    });
};
importScenes(require.context('./scenes/', false, /\.(js)$/));

import gifrecorder from './utils/gifrecorder.js';

let prePreLoader = document.getElementById('loading');
if (prePreLoader && prePreLoader.parentNode) {
    prePreLoader.parentNode.removeChild(prePreLoader);
}

window.fadeColor = Phaser.Display.Color.HexStringToColor(config.bgColor);
window.bgColor = Phaser.Display.Color.HexStringToColor(config.bgColor);
window.fgColor = Phaser.Display.Color.HexStringToColor(config.fgColor);

window.maxWidth = 960;
window.maxHeight = 960;

let wZoom = Math.max(2, Math.ceil(window.innerWidth / window.maxWidth));
let hZoom = Math.max(2, Math.ceil(window.innerHeight / window.maxHeight));
let zoom = Math.max(wZoom, hZoom);

let gameConfig = {
    type: Phaser.WEBGL,
    audio: {
        disableWebAudio: !(window.AudioContext || window.webkitAudioContext)
    },
    backgroundColor: config.bgColor,
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.NONE,
        width: Math.ceil(window.innerWidth / zoom),
        height: Math.ceil(window.innerHeight / zoom),
        zoom: zoom
    },
    physics: {
        default: 'arcade',
        arcade: {
            tileBias: 12,
            gravity: { y: 512 },
            debug: false
        },
        matter: {
            debug: false,
            gravity: { y: 0.5 }
        }
    },
    plugins: {
        scene: [
            { key: 'DustPlugin', plugin: DustPhaserPlugin, mapping: 'dust' },
            { key: 'simplePlatformerControls', plugin: SimplePlatformerControls, mapping: 'controls' },
            { key: 'secondaryPlatformerControls', plugin: SecondaryPlatformerControls, mapping: 'bcontrols' }
        ],
        global: [
            { key: 'state', plugin: State, mapping: 'state', start: true },
            { key: 'sfx', plugin: Sfx, mapping: 'sfx', start: true },
            { key: 'ambient', plugin: Ambient, mapping: 'ambient', start: true },
            { key: 'levelstats', plugin: LevelStats, mapping: 'levelstats', start: true }
        ]
    },
    input: {
        gamepad: true,
        queue: true
    },
    scene: scenes
};

/*
// start game
let hostsString = `["0.0.0.0:3000","${config.name}.netlify.app","${config.name}.supernapie.com","quinten.github.io","${config.name}-kong.netlify.app","v6p9d9t4.ssl.hwcdn.net"]`;
console.log(btoa(hostsString));
let hosts = JSON.parse(hostsString);
//let hosts = JSON.parse(atob('WyIwLjAuMC4wOjMwMDAiLCJwaGFzZXItdGVtcGxhdGUubmV0bGlmeS5hcHAiLCJwaGFzZXItdGVtcGxhdGUuc3VwZXJuYXBpZS5jb20iLCJxdWludGVuLmdpdGh1Yi5pbyIsInBoYXNlci10ZW1wbGF0ZS1rb25nLm5ldGxpZnkuYXBwIiwidjZwOWQ5dDQuc3NsLmh3Y2RuLm5ldCJd'));
//console.log(hosts);
if (hosts.indexOf(window.location.host) > -1) {
    window.game = new Phaser.Game(gameConfig);
}
*/

// https://blog.stevenlevithan.com/archives/parseuri-split-url
function parseUri(sourceUri){
    var uriPartNames = ["source","protocol","authority","domain","port","path","directoryPath","fileName","query","anchor"],
        uriParts = new RegExp("^(?:([^:/?#.]+):)?(?://)?(([^:/?#]*)(?::(\\d*))?)((/(?:[^?#](?![^?#/]*\\.[^?#/.]+(?:[\\?#]|$)))*/?)?([^?#/]*))?(?:\\?([^#]*))?(?:#(.*))?").exec(sourceUri),
        uri = {};
    for(var i = 0; i < 10; i++){
        uri[uriPartNames[i]] = (uriParts[i] ? uriParts[i] : "");
    }
    if(uri.directoryPath.length > 0){
        uri.directoryPath = uri.directoryPath.replace(/\/?$/, "/");
    }

    return uri;
}

/*
if (JSON.parse(atob(
"WyIiLCJodHRwOi8vMC4wLjAuMDozMDAwLyIsImh0dHBzOi8vdjZwOWQ5dDQuc3NsLmh3Y2RuLm5ldC8iXQ=="
)).indexOf(document.referrer) > -1 || parseUri(document.referrer).domain === atob('djZwOWQ5dDQuc3NsLmh3Y2RuLm5ldA==')) {
    window.game = new Phaser.Game(gameConfig);
    //gifrecorder.init();
} else {
    window.addEventListener('click', function () {
        window.top.location = atob('aHR0cHM6Ly9zdXBlcm5hcGllLml0Y2guaW8vaG9wd29ybGQ=');
    });
    window.addEventListener('keyup', function () {
        window.top.location = atob('aHR0cHM6Ly9zdXBlcm5hcGllLml0Y2guaW8vaG9wd29ybGQ=');
    });
}
*/

window.game = new Phaser.Game(gameConfig);
