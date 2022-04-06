class Preloader extends Phaser.Scene {

    constructor ()
    {
        super({ key: 'preloader', active: false, visible: false });
    }

    preload ()
    {
        this.sys.canvas.style.display = 'block';

        // just a preload bar in graphics
        let progress = this.add.graphics();
        this.load.on('progress', (value) => {
            progress.clear();
            progress.lineStyle(2, window.fgColor.color, 1);
            progress.strokeRect(Math.floor((this.scale.width / 2) - 132), Math.floor((this.scale.height / 2) - 20), 264, 40);
            progress.fillStyle(window.fgColor.color, 1);
            progress.fillRect(Math.floor((this.scale.width / 2) - 128), Math.floor((this.scale.height / 2) - 16), 256 * value, 32);
        });
        this.load.on('complete', () => {
            progress.destroy();
        });

        let importAllImages = (r) => {
            r.keys().forEach((k) => {
                let name = k.replace('./', '').replace('.png', '');
                this.load.image(name, r(k));
            });
        };
        importAllImages(require.context('../assets/images/', false, /\.(png)$/));

        let importAllSprites = (r) => {
            r.keys().forEach((k) => {
                let parts = k.split('/');
                let sizes = parts[1].split('x');
                let w = Number(sizes[0]);
                let h = Number(sizes[1]);
                let name = parts[2].replace('.png', '');
                this.load.spritesheet(name, r(k), { frameWidth: w, frameHeight: h });
            });
        };
        importAllSprites(require.context('../assets/sprites/', true, /\.(png)$/));

        let importAllTilemaps = (r) => {
            r.keys().forEach((k) => {
                let name = k.replace('./', '').replace('.json', '');
                let data = r(k);
                this.cache.tilemap.add(name, {format: 1, data: data});
            });
        };
        importAllTilemaps(require.context('../assets/tilemaps/', false, /\.(json)$/));

        /*
        let importAllMusic = (r) => {
            r.keys().forEach((k) => {
                let name = k.replace('./', '').replace('.mp3', '');
                this.load.audio(name, r(k));
            });
        };
        importAllMusic(require.context('../assets/music/', false, /\.(mp3)$/));
        */

        let importAllAudioSprites = (r) => {
            r.keys().forEach((k) => {
                let name = k.replace('./', '').replace('.mp3', '');
                this.load.audio(name, r(k));
            });
        };
        importAllAudioSprites(require.context('../assets/audiosprites/', false, /\.(mp3)$/));

        let importAllAudioSpriteData = (r) => {
            r.keys().forEach((k) => {
                let name = k.replace('./', '').replace('.json', '');
                this.cache.json.add(name, r(k));
            });
        };
        importAllAudioSpriteData(require.context('../assets/audiosprites/', false, /\.(json)$/));

    }

    create ()
    {
        let fontConfig = {
            image: 'napie-eight-font',
            width: 8,
            height: 8,
            chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ .,!?#abcdefghijklmnopqrstuvwxyz@:;^%&1234567890*\'"`[]/\\~+-=<>(){}_|$',
            charsPerRow: 16,
            spacing: { x: 0, y: 0 }
        };
        this.cache.bitmapFont.add('napie-eight-font', Phaser.GameObjects.RetroFont.Parse(this, fontConfig));

        /*
        this.load.on('complete', () => {
            this.load.off('complete');
            this.ambient.allMusicLoaded = true;
        }, this);
        this.load.audio('music2', 'assets/music2.mp3');
        this.load.audio('music3', 'assets/music3.mp3');
        this.load.start();
        */

        this.scene.start('startscreen');
    }

    /*
    onGamePause()
    {
        if (!this.pauseTextField) {
            this.pauseTextField = this.add.text(this.scale.width / 2, this.scale.height / 2, 'Game is paused\nclick anywhere\nto continue...');
            this.pauseTextField.setOrigin(0.5, 0.5);
            this.pauseTextField.setScrollFactor(0);
            this.pauseTextField.setTint(window.fgColor.color);
            this.pauseTextField.setDepth(12);
        }
        if (!this.pauseOverlay) {
            this.pauseOverlay = this.add.graphics();
            this.pauseOverlay.setScrollFactor(0);
            this.pauseOverlay.setDepth(11);
            this.pauseOverlay.setAlpha(0.65);
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
    */
}

export default Preloader;
