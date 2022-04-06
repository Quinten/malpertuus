import Menu from './Menu';

class HelpScreen extends Menu {

    constructor (config)
    {
        super((config) ? config : { key: 'help' });
        this.centerText = 'Cursors to run/move\n\nSpace/A to jump\n\n';
        this.backText = 'Back to menu';
        this.nextScene = 'menu';
        this.menu = [
            {
                text: t => this.backText,
                action: e => this.startNext()
            }
        ];
    }

    create ()
    {
        super.create();

        this.controls.events.once('escup', () => {
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

export default HelpScreen;
