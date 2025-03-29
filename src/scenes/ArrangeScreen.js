import Menu from './Menu';

class ArrangeScreen extends Menu {

    constructor (config)
    {
        super((config) ? config : { key: 'arrange' });
        this.centerText = 'Press menu button\n\n    when done';
        this.nextScene = 'menu';
        this.menu = [];
    }

    create ()
    {
        super.create();
        this.scene.get('visualmobilecontrols').startRearrange();
        this.controls.events.once('escup', () => {
            this.scene.get('visualmobilecontrols').stopRearrange();
            this.startNextWait = 0;
            this.startNext();
            this.sfx.play('click');
        }, this);
    }

    resizeField(w, h)
    {
        super.resizeField(w, h);
        if (this.menuText) {
            this.menuText.y = h / 2 + 64;
            this.menuText.x = w / 2 - 64;
        }
    }
}

export default ArrangeScreen;
