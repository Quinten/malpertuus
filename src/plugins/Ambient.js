import config from '../../package';
import music from '../utils/music.js';
import seedrandom from 'seedrandom';

const musicKey = 'music-' + config.name;

let isOn = false;
let savedSetting = localStorage.getItem(musicKey);
if (savedSetting === 'on') {
    isOn = true;
}

let bpm = 138;

let sheets = [
    {
        melody: [
            '4F4','2e4','6F4', '4G4', '2e4', '10C4', '2C4', '6C5', '2G4', '6F4', '2e4', '10C4', '8-',
            '4F4','2e4','6F4', '4G4', '2e4', '10C4', '2C4', '6e5', '2C5', '6G4', '2F4', '10e4', '8-',
        ],
        bass: [
            '4C3', '4G3', '8b4', '4C3', '4e3', '8A4', '4C3', '4e3', '8a3', '4C3', '4e3', '4G3', '4e3'
        ]
    },
    {
        melody: [
            '4E4','2C4','6B4', '4G4', '2E4', '10C5', '2B5', '6G4', '2B4', '6G4', '2E4', '10C5', '8-',
            '4E5','2C4','6B4', '4G4', '2E4', '10C5', '2B5', '6G4', '2E4', '6C4', '2B4', '10G5', '8-',
        ],
        bass: [
            '4E3', '4C3', '8B3', '4G4', '4E4', '8C4', '4B3', '4G3', '8E3', '4C3', '4B4', '4G4', '4G3'
        ]
    },
    {
        melody: [
            '4D4','2E4','6F4', '4g4', '2e4', '10A5', '2B5', '6D4', '2E4', '6F4', '2g4', '10A5', '8-',
            '4B5','2D4','6E4', '4g4', '2F4', '10A5', '2B5', '6D4', '2E4', '6g4', '2F4', '10A5', '8-',
        ],
        bass: [
            '4E3', '4F3', '8g3', '4B4', '4A4', '8A4', '4D3', '4E3', '8F3', '4g3', '4B4', '4A4', '4D3'
        ]
    },
    {
        melody: [
            '4e4','2G4','6a4', '4b5', '2e4', '10G4', '2a4', '6b5', '2e4', '6G4', '2a4', '10b5', '8-',
            '4e4','2G4','6a4', '4b5', '2e4', '10G4', '2a4', '6G4', '2e4', '6a4', '2b5', '10a4', '8-',
        ],
        bass: [
            '4e3', '4G3', '8a3', '4b4', '4b4', '8a3', '4G3', '4e3', '8e3', '4G3', '4a3', '4b4', '4G3'
        ]
    }
];

class Ambient extends Phaser.Plugins.BasePlugin
{
    constructor (pluginManager)
    {
        super(pluginManager);
        this.ctx = undefined;
        this.seed = null;
        this.triedSeed = null;
    }

    play(seed)
    {
        this.triedSeed = seed;
        if (!isOn || this.seed === seed) {
            return;
        }
        this.seed = seed;
        if (this.ctx !== undefined) {
            this.ctx.close();
        }

        let s = 0;
        let bpm = 138;

        if (seed !== undefined) {
            let rnd = seedrandom(seed);
            s = Math.floor(rnd() * sheets.length);
            bpm = 80 + Math.floor(rnd() * 80);
        } else {
            seed = 'Born in the maze';
        }

        let {melody, bass} = sheets[s];
        //let {melody, bass} = sheets[3];
        let shuffle = true;

        this.ctx = music.playSong({melody, bass, bpm, shuffle, seed});
    }

    stop()
    {
        if (this.ctx !== undefined) {
            this.ctx.close();
            this.ctx = undefined;
            this.seed = null;
        }
    }

    get isOn() {
        return isOn;
    }

    set isOn(value) {
        isOn = value;
        localStorage.setItem(musicKey, (value) ? 'on' : 'off');
        if (value) {
            this.play(this.triedSeed || 'Born in the maze');
        } else {
            this.stop();
        }
    }
}

export default Ambient;
