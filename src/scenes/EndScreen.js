import Screen from './Screen';

class EndScreen extends Screen {

    constructor (config)
    {
        super((config) ? config : { key: 'endscreen' });
        this.autoFade = true;
        this.nextScene = 'level';
        this.fadeTime = 2000;
        this.autoFadeWait = 2000;
    }

    create()
    {
        let nDays = this.scene.manager.keys.level.daysSurvived;
        if (nDays === 1) {
            this.centerText = 'You survived 1 day';
        } else {
            this.centerText = 'You survived ' + nDays + ' days';
        }
        super.create();
    }
}

export default EndScreen;
