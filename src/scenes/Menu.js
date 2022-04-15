import Screen from './Screen';
import packageConfig from '../../package';

class Menu extends Screen {

    constructor (config)
    {
        super((config) ? config : { key: 'menu' });
        this.menu = [
            {
                text: 'play ' + packageConfig.title,
                action: 'level'
            },
            {
                text: t => (this.sfx.isOn) ? 'sound: on' : 'sound: off',
                action: e => this.sfx.isOn = !this.sfx.isOn
            },
            {
                text: t => (this.ambient.isOn) ? 'music: on' : 'music: off',
                action: e => this.ambient.isOn = !this.ambient.isOn
            },
            {
                text: 'how to play',
                action: e => {
                    this.scene.manager.keys.help.nextScene = 'menu';
                    this.scene.manager.keys.help.backText = 'Back to menu';
                    this.nextScene = 'help';
                    this.startNext();
                }
            }
        ];
        this.menuIndex = 0;
        this.menuText = undefined;
    }

    create ()
    {
        super.create();

        this.controls.events.on('aup', this.tapUp, this);
        this.controls.events.on('upup', this.menuUp, this);
        this.controls.events.on('downup', this.menuDown, this);

        this.menuIndex = 0;

        this.menuText = this.add.dynamicBitmapText(this.scale.width / 2 - 48, this.scale.height / 2, 'napie-eight-font', this.getMenuText());
        this.menuText.setTint(window.fgColor.color);

        this.ambient.play(packageConfig.title);

        this.resizeField(this.scale.width, this.scale.height);
    }

    menuUp()
    {
        if (this.nextStart) {
            return;
        }
        this.menuIndex--;
        if (this.menuIndex < 0) {
            this.menuIndex = this.menu.length - 1;
        }
        this.menuText.text = this.getMenuText();
        this.sfx.play('uimove', 8);
    }

    menuDown()
    {
        if (this.nextStart) {
            return;
        }
        this.menuIndex++;
        if (this.menuIndex >= this.menu.length) {
            this.menuIndex = 0;
        }
        this.menuText.text = this.getMenuText();
        this.sfx.play('uimove', 8);
    }

    getMenuText()
    {
        let text = '';
        if (this.menu) {
            this.menu.forEach(function (item, index) {
                let label = item.text;
                if (typeof label === 'function') {
                    label = label();
                }
                if (this.menuIndex === index) {
                    text = text + '> ' + label.toUpperCase();
                } else {
                    text = text + '  ' + label;
                }
                text += `\n\n`;
            }.bind(this));
        }
        return text;
    }

    resizeField(w, h)
    {
        super.resizeField(w, h);
        if (this.menuText) {
            this.menuText.x = w / 2 - 48;
            this.menuText.y = h / 2;
        }
    }

    tapUp()
    {
        let action = this.menu[this.menuIndex].action;

        if (typeof action === 'string') {
            this.nextScene = action;
            this.startNext();
        }
        if (typeof action === 'function') {
            action();
            this.menuText.text = this.getMenuText();
        }
        this.sfx.play('click');
    }
}

export default Menu;
