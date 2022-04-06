class Parachute extends Phaser.GameObjects.Container {

    constructor(scene, x, y) {

        let sprite = scene.add.sprite(0, 0, 'parachute');

        super(scene, x, y, [sprite]);

        this.scene = scene;

        /*
        this.particles = this.scene.add.particles('particles');
        this.particles.setDepth(1);
        this.particlesEmitter = this.particles.createEmitter({
            frame: [8, 9, 10, 11],
            x: this.x,
            y: this.y,
            speed: { min: 32, max: 64},
            angle: { min: 270, max: 270 },
            scale: { start: 1, end: 1 },
            alpha: { start: 1, end: 0 },
            lifespan: 2000,
            gravityY: 0,
            frequency: -1,
            rotate: { min: 0, max: 0 }
        });
        */

        scene.sys.displayList.add(this);
        this.setDepth(2);
        this.visible = false;
    }

    show() {
        this.visible = true;
        this.isShowing = true;
        this.showTimer = 0;
    }

    update(time, delta, player){
        if (this.visible) {
            player.body.velocity.y = Math.min(
                player.body.velocity.y,
                player.jumpPower / 4
            );
            this.setPosition(player.x, player.y);
            if (player.body.onFloor() || player.canSwim || player.isClimbing || player.isGripping) {
                this.visible = false;
                player.status.parachuting = false;
            }
        }
        //this.particlesEmitter.setPosition(this.x - 12 + Math.floor(Math.random() * 24), this.y - 16);
    }
}

export default Parachute;
