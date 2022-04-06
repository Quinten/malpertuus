class SimplePlatformerControls extends Phaser.Plugins.ScenePlugin {

    constructor (scene, pluginManager) {
        super(scene, pluginManager);
        this.xbox = Phaser.Input.Gamepad.Configs.XBOX_360;
        this.up = false;
        this.right = false;
        this.down = false;
        this.left = false;
        this.aDown = false;
        this.bDown = false;
        this.xDown = false;
        this.yDown = false;
        this.events = new Phaser.Events.EventEmitter();
        this.input = this.scene.input;
        this.cursors = {
            up: false,
            left: false,
            right: false,
            down: false
        };
        this.playerKey = '';
        this.keyBoolMap = {
            '13': 'a',
            '81': 'a',
            '65': 'a',
            '32': 'a',
            '67': 'b',
            '66': 'b',
            '88': 'x',
            '89': 'y',
            '73': 'y',
            '82': 'y',
            '27': 'esc',
            '77': 'esc',
            '191': 'help'
        };
        this.keyCursorMap = {
            '38': 'up',
            '40': 'down',
            '37': 'left',
            '39': 'right'
        };
        this.buttonBoolMap = {
            '0': 'a',
            '1': 'b',
            '2': 'x',
            '3': 'y',
            '8': 'esc',
            '9': 'help'
        };
        this.buttonCursorMap = {
            '12': 'up',
            '13': 'down',
            '14': 'left',
            '15': 'right'
        };
    }

    start() {

        this.input.gamepad.on('down', (pad, button, index) => {
            if (this.playerKey === 'b') {
                if (pad.index === 0) {
                    return;
                }
            } else {
                if (pad.index === 1) {
                    return;
                }
            }
            this.events.emit('anydown');
            let p = String(button.index);
            if (this.buttonBoolMap[p] !== undefined) {
                this[this.buttonBoolMap[p] + 'Down'] = true;
                this.events.emit(this.buttonBoolMap[p] + 'down');
            }
        }, this);

        if (this.playerKey === '') {
            this.onKeyDown = (e) => {
                this.events.emit('anydown');
                let p = String(e.keyCode);
                if (this.keyBoolMap[p] !== undefined) {
                    this[this.keyBoolMap[p] + 'Down'] = true;
                    this.events.emit(this.keyBoolMap[p] + 'down');
                }
                if (this.keyCursorMap[p] !== undefined) {
                    this.cursors[this.keyCursorMap[p]] = true;
                    this.events.emit(this.keyCursorMap[p] + 'down');
                    e.preventDefault();
                }
            };

            this.input.keyboard.on('keydown', this.onKeyDown);

        }

        this.input.gamepad.on('up', (pad, button, index) => {
            if (this.playerKey === 'b') {
                if (pad.index === 0) {
                    return;
                }
            } else {
                if (pad.index === 1) {
                    this.events.emit('secup');
                    return;
                }
            }
            this.events.emit('anyup');
            let p = String(button.index);
            if (this.buttonBoolMap[p] !== undefined) {
                this[this.buttonBoolMap[p] + 'Down'] = false;
                this.events.emit(this.buttonBoolMap[p] + 'up');
            }
            if (this.buttonCursorMap[p] !== undefined) {
                this.events.emit(this.buttonCursorMap[p] + 'up');
            }
        }, this);

        if (this.playerKey === '') {
            this.onKeyUp = (e) => {
                this.events.emit('anyup');
                let p = String(e.keyCode);
                if (this.keyBoolMap[p] !== undefined) {
                    this[this.keyBoolMap[p] + 'Down'] = false;
                    this.events.emit(this.keyBoolMap[p] + 'up');
                }
                if (this.keyCursorMap[p] !== undefined) {
                    this.cursors[this.keyCursorMap[p]] = false;
                    this.events.emit(this.keyCursorMap[p] + 'up');
                    e.preventDefault();
                }
            };

            this.input.keyboard.on('keyup', this.onKeyUp);
        }

        this.scene.events.on('preupdate', this.preUpdate, this);
        this.scene.events.on('shutdown', this.shutdown, this);

    }

    preUpdate()
    {
        let input = this.input;
        let i = (this.playerKey === 'b') ? 1 : 0;
        if (input.gamepad && input.gamepad.gamepads && input.gamepad.gamepads[i]) {
            let buttons = input.gamepad.gamepads[i].buttons;
            this.up = this.cursors.up || buttons[this.xbox.UP].pressed;
            this.right = this.cursors.right || buttons[this.xbox.RIGHT].pressed;
            this.down = this.cursors.down || buttons[this.xbox.DOWN].pressed;
            this.left = this.cursors.left || buttons[this.xbox.LEFT].pressed;
        } else if (this.playerKey === '') {
            this.up = this.cursors.up;
            this.right = this.cursors.right;
            this.down = this.cursors.down;
            this.left = this.cursors.left;
        }
    }

    shutdown()
    {
        this.input.gamepad.off('down');
        this.input.gamepad.off('up');
        this.input.keyboard.off('keydown', this.onKeyDown);
        this.input.keyboard.off('keyup', this.onKeyUp);
        ['a', 'b', 'x', 'y', 'up', 'down', 'left', 'right', 'esc', 'any', 'sec', 'help'].forEach(p => {
            this.events.off(p + 'up');
            this.events.off(p + 'down');
        });
        this.scene.events.off('preupdate', this.preUpdate);
        this.scene.events.off('shutdown', this.shutdown);
    }
}

export default SimplePlatformerControls;
