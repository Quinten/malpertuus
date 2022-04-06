import config from '../../package';

const stateKey = 'state-' + config.name;

const glue = 'hw';
const prefix = 'Ghw1hwThwzhwE';

let permadeath = true;
let canChangePermadeath = false;
let username = '';
let seed = '';
let activeSeed = '';
let worldstoryIndex = 0;

let savedValue = localStorage.getItem(stateKey);
if (savedValue !== null) {
    let state = JSON.parse(atob(savedValue.replace(new RegExp('^' + prefix.split(glue).join('')), '')));
    if (state.permadeath === false) {
        permadeath = false;
    }
    if (state.canChangePermadeath === true) {
        canChangePermadeath = true;
    }
    if (state.username !== undefined) {
        username = state.username;
    }
    if (state.seed !== undefined) {
        seed = state.seed;
    }
    if (state.activeSeed !== undefined) {
        activeSeed = state.activeSeed;
    }
    if (state.worldstoryIndex !== undefined) {
        worldstoryIndex = state.worldstoryIndex;
    }
}

if (document.monetization) {
    document.monetization.addEventListener(
        'monetizationstart',
        _ => {
            canChangePermadeath = true;
        }
    );
}

class State extends Phaser.Plugins.BasePlugin
{
    constructor (pluginManager)
    {
        super(pluginManager);
    }

    get username() {
        if (username === '') {
            return 'stranger';
        }
        return username;
    }

    get canChangePermadeath() {
        return canChangePermadeath;
    }

    get permadeath() {
        return permadeath;
    }

    set permadeath(value) {
        if (canChangePermadeath) {
            permadeath = value;
            this.saveState();
        } else {
            permadeath = false;
        }
    }

    get seed() {
        return seed;
    }

    set seed(value) {
        seed = value;
        this.saveState();
    }

    get activeSeed() {
        return activeSeed;
    }

    set activeSeed(value) {
        activeSeed = value;
        this.saveState();
    }

    get worldstoryIndex() {
        return worldstoryIndex;
    }

    set worldstoryIndex(value) {
        worldstoryIndex = value;
        this.saveState();
    }

    saveState()
    {
        let state = {permadeath, username, seed, activeSeed, worldstoryIndex};
        if (canChangePermadeath) {
            state.canChangePermadeath = true;
        }
        let value = prefix.split(glue).join('') + btoa(JSON.stringify(state));
        localStorage.setItem(stateKey, value);
    }
}

export default State;
