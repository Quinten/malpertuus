let mobileControlsInit = false;

class Screen extends Phaser.Scene {

    constructor (config)
    {
        if (config) {
            config.active = false;
            config.visible = false;
        }
        super((config) ? config : { key: 'screen', active: false, visible: false });

        this.nextScene = 'level';

        // common elements
        this.centerText = undefined;
        this.bg = undefined;

        // types of user interaction
        this.autoFade = false;
        this.clickFade = false;
        this.escFade = false;

        // optional timing
        this.fadeTime = 750;
        this.autoFadeWait = 1500;
        this.startNextWait = 0;

        this.pauseOverlayAlpha = 1;
    }

    create ()
    {
        this.cameras.main.setRoundPixels(true);

        this.nextStart = false;

        this.controls.start();

        if (this.centerText) {
            this.centerTextField = this.add.dynamicBitmapText(0, 0, 'napie-eight-font', this.centerText);
            this.centerTextField.setOrigin(0.5, 0.5);
            this.centerTextField.setScrollFactor(0);
            this.centerTextField.setTint(window.fgColor.color);
        }

        if (this.bg) {
            this.bgImage = this.add.image(this.scale.width / 2, this.scale.height / 2, this.bg);
        }

        this.resizeField(this.scale.width, this.scale.height);

        if (this.autoFade) {
            this.cameras.main.once('cameraflashcomplete', (camera) => {
                this.time.delayedCall(this.autoFadeWait, this.startNext, [], this);
            }, this);
        } else if (this.clickFade) {
            this.controls.events.once('aup', this.tapUp, this);
            this.input.once('pointerdown', this.tapUp, this);
        } else if (this.escFade) {
            this.controls.events.once('escup', this.tapUp, this);
        }
        this.cameras.main.flash(this.fadeTime, fadeColor.r, fadeColor.g, fadeColor.b);
    }

    resizeField(w, h)
    {
        if (this.centerTextField) {
            this.centerTextField.x = w / 2;
            this.centerTextField.y = h / 2;
        }
        if (this.bgImage) {
            this.bgImage.x = w / 2;
            this.bgImage.y = h / 2;
        }
        if (this.pauseTextField) {
            this.pauseTextField.x = w / 2;
            this.pauseTextField.y = h / 2;
        }
        if (this.pauseOverlay) {
            this.pauseOverlay.clear();
            this.pauseOverlay.fillStyle(window.bgColor.color, 1);
            this.pauseOverlay.fillRect(0, 0, this.scale.width, this.scale.height);
        }
    }

    tapUp(pointer)
    {
        if (this.nextStart) {
            return;
        }
        this.startNext();
        this.sfx.play('pop', 8);
        if (pointer.wasTouch && !mobileControlsInit) {
            mobileControlsInit = true;
            this.scene.launch('visualmobilecontrols');
        }
    }

    startNext()
    {
        if (this.nextStart) {
            return;
        }
        this.nextStart = true;
        this.cameras.main.once('camerafadeoutcomplete', (camera) => {
            this.scene.manager.keys[this.nextScene].controls.resetBools();
            this.scene.start(this.nextScene);
        }, this);
        this.time.delayedCall(this.startNextWait, () => {
            this.cameras.main.fadeOut(this.fadeTime, fadeColor.r, fadeColor.g, fadeColor.b);
        }, [], this);
    }

    onGamePause()
    {
        if (!this.pauseTextField) {
            this.pauseTextField = this.add.dynamicBitmapText(this.scale.width / 2, this.scale.height / 2, 'napie-eight-font', 'Game is paused\n\nclick anywhere\n\nto continue...');
            this.pauseTextField.setOrigin(0.5, 0.5);
            this.pauseTextField.setScrollFactor(0);
            this.pauseTextField.setTint(window.fgColor.color);
            this.pauseTextField.setDepth(12);
        }
        if (!this.pauseOverlay) {
            this.pauseOverlay = this.add.graphics();
            this.pauseOverlay.setScrollFactor(0);
            this.pauseOverlay.setDepth(11);
            this.pauseOverlay.setAlpha(this.pauseOverlayAlpha);
            this.pauseOverlay.clear();
            this.pauseOverlay.fillStyle(window.bgColor.color, 1);
            this.pauseOverlay.fillRect(0, 0, this.scale.width, this.scale.height);
        }
    }

    onGameResume()
    {
        if (this.pauseTextField) {
            this.pauseTextField.destroy();
            this.pauseTextField = undefined;
        }
        if (this.pauseOverlay) {
            this.pauseOverlay.destroy();
            this.pauseOverlay = undefined;
        }
    }

    get mobileControlsActive()
    {
        return mobileControlsInit;
    }
}

export default Screen;
