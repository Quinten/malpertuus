import Screen from './Screen';

class EndScreen extends Screen {

    constructor (config)
    {
        super((config) ? config : { key: 'endscreen' });
        this.centerText = 'There is no end to malpertuus.';
        this.autoFade = true;
        this.nextScene = 'menu';
        this.fadeTime = 2000;
        this.autoFadeWait = 2000;
    }
}

export default EndScreen;
