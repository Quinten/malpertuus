let shownMessages = [];

class FleshMessage extends Phaser.GameObjects.Container {

    constructor(scene, x, y) {

        let text = scene.add.dynamicBitmapText(16, 16, 'napie-eight-font', '');
        let graphics = scene.add.graphics();
        graphics.fillStyle(window.bgColor.color, 1);

        super(scene, 0, -64, [graphics, text]);

        this.scene = scene;

        this.text = text;
        this.text.visible = false;
        this.graphics = graphics;
        this.graphics.visible = false;

        this.textToShow = undefined;
        this.showTimer = 3000;

        scene.sys.displayList.add(this);
        this.setDepth(7);

        this.setScrollFactor(0, 0);

    }

    showText(textToShow) {
        if (shownMessages.indexOf(textToShow) > -1) {
            return;
        }
        shownMessages.push(textToShow);
        this.textToShow = textToShow;
        this.text.text = textToShow;
        this.text.setTint(0x26292c);
        this.text.visible = true;
        this.graphics.clear();
        this.graphics.fillStyle(window.bgColor.color, 1);
        this.graphics.fillRect(this.text.x - 3, this.text.y - 5, this.text.width + 6, this.text.height + 8);
        this.graphics.fillRect(this.text.y - 4, this.text.y - 4, this.text.width + 8, this.text.height + 6);
        //this.graphics.fillRect(0, 0, 1, 8); // stick
        this.graphics.visible = true;
        this.y = -64;
        this.scene.tweens.add({
            targets: this,
            y: 0,
            duration: 500,
            ease: 'Back.easeOut',
            yoyo: true,
            repeat: 0,
            hold: 6000
        });
    }
}

export default FleshMessage;
