import config from '../../package';

import levels from '../levels';

const storageKey = 'level-' + config.name;

let highestLevel = 0;
let savedHighestLevel = localStorage.getItem(storageKey);
savedHighestLevel = Number(atob(savedHighestLevel));
if (!isNaN(savedHighestLevel) && (savedHighestLevel > 0) && (savedHighestLevel < levels.length)) {
    savedHighestLevel = Math.round(savedHighestLevel);
    highestLevel = savedHighestLevel;
}

let currentLevel = highestLevel;
currentLevel = 0;

class LevelStats extends Phaser.Plugins.BasePlugin {

    get currentLevel() {
        return currentLevel;
    }

    get highestLevel() {
        return highestLevel;
    }

    set currentLevel(value) {
        let newCurrentLevel = value;
        newCurrentLevel = Number(value);
        if (!isNaN(newCurrentLevel) && (newCurrentLevel >= 0) && (newCurrentLevel < levels.length)) {
            newCurrentLevel = Math.round(newCurrentLevel);
            currentLevel = newCurrentLevel;
        }
    }

    // increments the level with 1 and
    // returns wether or not the game is complete
    levelUp() {
        let value = currentLevel + 1;
        if (value >= levels.length) {
            currentLevel = 0;
            return true;
        }
        if (value > highestLevel) {
            value = Math.round(value);
            highestLevel = value;
            localStorage.setItem(storageKey, btoa(String(highestLevel)));
        }
        currentLevel = value;
        return false;
    }
}

export default LevelStats;
