import config from '../package';

import 'phaser';

import Sfx from './plugins/Sfx.js';
import Ambient from './plugins/Ambient.js';
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
        }
    },
    plugins: {
        scene: [
            { key: 'simplePlatformerControls', plugin: SimplePlatformerControls, mapping: 'controls' },
            { key: 'secondaryPlatformerControls', plugin: SecondaryPlatformerControls, mapping: 'bcontrols' }
        ],
        global: [
            { key: 'state', plugin: State, mapping: 'state', start: true },
            { key: 'sfx', plugin: Sfx, mapping: 'sfx', start: true },
            { key: 'ambient', plugin: Ambient, mapping: 'ambient', start: true }
        ]
    },
    input: {
        gamepad: true,
        queue: true
    },
    scene: scenes
};

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
// check if the domain is ok and start game
var addressToCheck = '';
try {
    // we are not in an iframe
    addressToCheck = window.top.location.href;
} catch(e) {
    // we are in an iframe
    addressToCheck = document.referrer;
}
if (__u.d.indexOf(btoa(parseUri(addressToCheck).domain)) > -1) {
    window.game = new Phaser.Game(gameConfig);
    gifrecorder.init();
} else {
    ['click', 'keyup'].forEach(ev => {
        window.addEventListener(ev, e => {
            window.top.location = atob(__u.r);
        });
    });
}
