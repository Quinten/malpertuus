import Parachute from '../sprites/Parachute.js';
import music from '../utils/music.js';

let status = {};

class Player extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y, key, frame, facing, playerKey = '') {
        super(scene, x, y, key, frame);
        scene.physics.world.enable(this);
        scene.add.existing(this);

        this.playerKey = playerKey;
        if (status['status' + playerKey] === undefined) {
            status['status' + playerKey] = {
                isTikkie: playerKey === 'b',
                isSwimming: false,
                isScubaDiving: false,
                swimTimer: 0,
                parachuting: false,
                ghost: false
            };
        }
        this.status = status['status' + playerKey];

        this.setDepth(3);
        this.setSize(8, 16, true);
        this.setOffset(12, 14, true);
        this.setCollideWorldBounds(false);
        this.body.allowGravity = true;

        // tweak stuff
        this.speedMax = 96;
        this.speedChange = 8;
        this.jumpPower = 192;
        this.climbSpeed = 48;

        // not tweakable
        this.facing = facing || 'left';
        this.idle = false;
        this.moveSpeed = 0;
        this.jumpTimer = 0;
        this.canDoubleJump = false;
        this.prepDoubleJump = false;
        this.ani = 'idle-left';
        this.alive = true;
        this.canClimb = false;
        this.isClimbing = false;
        this.canDrop = true;
        this.prepDrop = false;

        this.canSwim = false;
        this.swimTimerMax = 20000;

        var animations = [
            { key: 'idle-left', start: 5, end: 5 },
            { key: 'idle-right', start: 0, end: 0 },
            { key: 'run-left', start: 6, end: 8 },
            { key: 'run-right', start: 1, end: 3 },
            { key: 'jump-left', start: 9, end: 9 },
            { key: 'jump-right', start: 4, end: 4 },
            { key: 'climb-idle', start: 10, end: 10 },
            { key: 'climb', start: 10, end: 13 },
            { key: 'slide-left', start: 14, end: 14 },
            { key: 'slide-right', start: 15, end: 15 },
            { key: 'swim', start: 16, end: 19 },
            { key: 'swim-idle', start: 16, end: 16 },
            { key: 'ghost', start: 20, end: 20 },
            { key: 'walljump-left', start: 21, end: 21 },
            { key: 'walljump-right', start: 22, end: 22 },
            { key: 'doublejump-left', start: 25, end: 26 },
            { key: 'doublejump-right', start: 23, end: 24 },
            { key: 'parachute-left', start: 28, end: 28 },
            { key: 'parachute-right', start: 27, end: 27 },
            { key: 'ropeswing-left', start: 30, end: 30 },
            { key: 'ropeswing-right', start: 29, end: 29 }
        ];
        animations.forEach(this.addAnim.bind(this));

        this.staminaBarOuter = this.scene.add.image(this.scene.cameras.main.width / 2, (this.playerKey === '') ? 8 : 16, 'staminabar-outer');
        this.staminaBarOuter.setScrollFactor(0);
        this.staminaBarOuter.setDepth(5);
        this.staminaBarOuter.setTint((this.playerKey === '') ? 0x736372 : 0x6a7363);
        this.staminaBarOuter.visible = false;
        this.staminaBarInner = this.scene.add.image(this.scene.cameras.main.width / 2 - 78, (this.playerKey === '') ? 8 : 16, 'staminabar-inner');
        this.staminaBarInner.setScrollFactor(0);
        this.staminaBarInner.setDepth(5);
        this.staminaBarInner.setTint((this.playerKey === '') ? 0x736372 : 0x6a7363);
        this.staminaBarInner.setOrigin(0, 0.5);
        this.staminaBarInner.visible = false;

        // bubbles
        this.bubbles = this.scene.add.particles('particles');
        this.bubblesEmitter = this.bubbles.createEmitter({
            frame: [0, 1, 2, 3],
            x: 200,
            y: 300,
            speed: { min: 32, max: 64},
            angle: { min: 270, max: 270 },
            scale: { start: 1, end: 1 },
            alpha: [0.45, 0.35, 0.25, 0.15],
            lifespan: 4000,
            gravityY: 0,
            frequency: -1,
            rotate: { min: 0, max: 0 },
            deathZone: {
                type: 'onLeave',
                source: {
                    contains: (x, y) => {
                        let tile = this.scene.layer.getTileAtWorldXY(x, y);
                        if (tile && tile.properties.swimable) {
                            return true;
                        }
                        return false;
                    }
                }
            }
        });

        this.groundParticles = this.scene.add.particles('particles');
        this.groundParticlesEmitter = this.groundParticles.createEmitter({
            frame: [8, 9, 10, 11],
            x: 200,
            y: 300,
            speed: { min: 96, max: 160},
            angle: { min: 225, max: 315 },
            scale: { start: 2, end: 0 },
            lifespan: 1000,
            gravityY: 250,
            frequency: -1,
            rotate: { min: -540, max: 540 },
            tint: [ (this.playerKey === '') ? 0x736372 : 0x6a7363 ]
        });

        this.movementParticles = this.scene.add.particles('particles');
        this.movementParticlesEmitter = this.movementParticles.createEmitter({
            frame: [8, 9, 10, 11],
            x: 200,
            y: 300,
            speed: { min: 4, max: 8},
            angle: { min: 270, max: 270 },
            scale: { start: 1, end: 1 },
            alpha: { start: 0.35, end: 0},
            lifespan: 600,
            gravityY: 0,
            frequency: -1,
            rotate: [0, 90, 180, 270]
        });

        this.parachute = new Parachute(this.scene, 0, 0);
        this.parachute.visible = this.status.parachuting;
        let controls = (this.playerKey === '') ? this.scene.controls : this.scene.bcontrols;
        /*
        controls.events.on('xup', () => {
            if (this.scene.inventory.indexOf('parachute') > -1
                && !this.body.onFloor()
                && !this.status.isSwimming
                && !this.isClimbing
                && !this.isGripping
                && !this.status.parachuting
            ) {
                this.parachute.visible = true;
                this.status.parachuting = true;
                this.scene.sfx.play('pop');
            } else if (this.status.parachuting) {
                this.parachute.visible = false;
                this.status.parachuting = false;
            }
        });
        */

        this.scene.inners.push(this);

        this.ghost = this.scene.physics.add.sprite(x, y, 'player', 20);
        this.ghost.alpha = .5;
        this.ghost.visible = this.status.ghost;
        this.ghost.body.allowGravity = false;
        this.ghost.body.enable = false;
        this.ghost.setSize(8, 16, true);
        this.ghost.setOffset(12, 14, true);
        this.ghost.setCollideWorldBounds(true);
        this.scene.inners.push(this.ghost);

        if (this.status.ghost) {
            this.startGhosting();
        }

        //console.log(this);

        this.gripHook = this.scene.matter.add.sprite(x, y, 'particles', null, { isStatic: true });
        this.gripHook.visible = false;

        this.gripHandle = this.scene.matter.add.sprite(x, y, 'particles', null, { isStatic: false });
        this.gripHandle.visible = false;

        this.gripConstraint = this.scene.matter.add.constraint(this.gripHook, this.gripHandle, 100, 0.2);

        this.isGripping = false;
        this.gripTimer = 500;
        this.rope = this.scene.add.graphics({
            lineStyle: { width: 2, color: (this.playerKey === '') ? 0x736372 : 0x6a7363, alpha: 1 }
        });

        /*
        controls.events.on('bdown', () => {
            if (this.scene.inventory.indexOf('rope gun') === -1 || this.isGripping || this.gripTimer < 500 || !this.scene || this.scene.mapKey === 'mount-hop') {
                return;
            }
            this.isGripping = true;
            this.gripTimer = 0;
            let pX = this.x;
            let pY = this.y;
            let dX = 0;
            if (controls.left) {
                dX = -1;
            } else if (controls.right) {
                dX = 1;
            }
            let dY = -1;
            let hit = false;
            while (!hit
                && pX > 0 && pX < this.scene.map.widthInPixels
                && pY > -64 && pY < this.scene.map.heightInPixels
            ) {
                pX = pX + dX;
                pY = pY + dY;
                let tile = this.scene.layer.getTileAtWorldXY(pX, pY);
                if (tile !== null && tile.properties.collideAll || pY < -60) {
                    hit = true;
                }
            }
            if (hit) {
                let d = Math.hypot(pX - this.x, pY - this.y);
                this.gripConstraint.length = d;
                this.gripHook.setPosition(pX, pY);
                this.gripHandle.setPosition(this.x, this.y);
                this.scene.sfx.play('thud', 4);
                this.movementParticlesEmitter.stop();
            }
        });

        controls.events.on('bup', () => {
            this.isGripping = false;
            this.rope.clear();
        });
        */

    }

    addAnim(anim)
    {
        let anims = this.anims.animationManager;
        let skins = ['', 'a', 'b', 'ab'];
        let s = 0;
        skins.forEach(skin => {
            if (!anims.get(anim.key + skin)) {
                anims.create({
                    key: anim.key + skin,
                    frames: anims.generateFrameNumbers('player', { start: anim.start + s, end: anim.end + s }),
                    frameRate: (anim.key === 'swim') ? 6 : 12,
                    repeat: -1
                });
            }
            s = s + 31;
        });
    }

    update(controls, time, delta)
    {
        this.parachute.update(time, delta, this);

        if (this.bubblesEmitter.active) {
            this.bubblesEmitter.setPosition(this.x - 4 + Math.floor(Math.random() * 9), this.y);
        }

        if (this.movementParticlesEmitter.active) {
            this.movementParticlesEmitter.setPosition(this.x + Math.floor(Math.random() * 9), this.y + 13);
        }

        if (!this.alive || !this.scene || !this.scene.layer) {
            if (this.body) {
                this.body.velocity.x = 0;
            }
            return;
        }

        if (this.status.ghost) {
            let other = this.scene.player;
            if (this.scene.other && this.playerKey === '') {
                other = this.scene.other;
            }
            let dx = other.x - this.ghost.x;
            let dy = other.y - this.ghost.y;
            let d = Math.sqrt(dx * dx + dy * dy);
            if (d < 6) {
                this.stopGhosting();
                return;
            }

            let oldSpeedX = this.ghost.body.velocity.x;
            let oldSpeedY = this.ghost.body.velocity.y;

            if (controls.left || controls.right || controls.up || controls.down) {
                this.ghost.body.setVelocityX(Math.min(oldSpeedX + this.speedChange, Math.max(oldSpeedX - this.speedChange, 0)));
                this.ghost.body.setVelocityY(Math.min(oldSpeedY + this.speedChange, Math.max(oldSpeedY - this.speedChange, 0)));
                if (controls.left) {
                    this.ghost.body.setVelocityX(Math.max(oldSpeedX - this.speedChange, -this.speedMax));
                } else if (controls.right) {
                    this.ghost.body.setVelocityX(Math.min(oldSpeedX + this.speedChange, this.speedMax));
                }
                if (controls.up) {
                    this.ghost.body.setVelocityY(Math.max(oldSpeedY - this.speedChange, -this.speedMax));
                } else if (controls.down) {
                    this.ghost.body.setVelocityY(Math.min(oldSpeedY + this.speedChange, this.speedMax));
                }
            } else {
                this.ghost.body.setVelocityX(dx * 0.6);
                this.ghost.body.setVelocityY(dy * 0.6);
            }
            return;
        }

        let touchTile = this.scene.layer.getTileAtWorldXY(this.body.x + 4, this.body.y + 8);
        if (touchTile !== null && touchTile.properties.spike
            && this.alive) {
            this.chop();
            this.checkIfGameOver();
            return;
        }

        if (!this.isGripping) {
            this.swim(controls, time, delta);
            if (!this.canSwim) {
                this.climb(controls, time, delta);
                if (!this.isClimbing) {
                    this.runAndJump(controls, time, delta);
                }
            }
        } else {
            if (this.gripConstraint.length < 8 || this.body.onWall()) {
                this.isGripping = false;
                this.gripTimer = 0;
                this.rope.clear();
            } else {
                this.gripConstraint.length = this.gripConstraint.length - 1;
                this.body.position.lerp(this.gripHandle.body.position, 1);
                this.body.velocity.lerp(this.gripHandle.body.velocity, 1);
                this.facing = (this.body.velocity.x <= 0) ? 'left' : 'right';
                this.ani = 'ropeswing-';
                this.ani = this.ani + this.facing;
                this.rope.clear().lineBetween(this.gripHook.x, this.gripHook.y, this.x, this.y)
            }
        }
        this.gripTimer = this.gripTimer + delta;

        // don't forget to animate :)
        this.anims.play(this.ani + ((this.status.isTikkie) ? 'a' : '') + this.playerKey, true);

        // crash onto the floor
        /*
        if (this.body.onFloor()
            && this.prevVelocityY > this.jumpPower * 2
            && this.alive) {
            this.kill();
            this.checkIfGameOver();
        }
        */
        this.prevVelocityY = this.body.velocity.y;

        if (this.scene.isSplitForTwoPlayer && !this.status.ghost) {
            if (!this.status.isTikkie
                && !Phaser.Geom.Rectangle.ContainsPoint(this.scene.cameras.main.worldView, this)) {
                this.startGhosting();
            }
        }
    }

    checkIfGameOver()
    {
        if (!this.scene.isSplitForTwoPlayer) {
            this.scene.gameOver();
        } else {
            if (this.playerKey === '') {
                if (this.scene.other.status.ghost) {
                    this.scene.gameOver();
                } else {
                    if (this.status.isTikkie) {
                        this.scene.otherOverlapTimer = 2000;
                        this.scene.otherPlayerOverlap();
                    }
                    this.startGhosting();
                }
            } else {
                if (this.scene.player.status.ghost) {
                    this.scene.gameOver();
                } else {
                    if (this.status.isTikkie) {
                        this.scene.otherOverlapTimer = 2000;
                        this.scene.otherPlayerOverlap();
                    }
                    this.startGhosting();
                }
            }
        }
    }

    startGhosting() {
        this.visible = false;
        this.body.enable = false;
        this.status.ghost = true;
        this.ghost.visible = true;
        this.ghost.body.enable = true;
        this.ghost.x = this.x;
        this.ghost.y = this.y;
        this.body.velocity.y = 0;
        this.prevVelocityY = 0;
        this.alive = true;
        this.movementParticlesEmitter.stop();
    }

    stopGhosting() {
        this.visible = true;
        this.body.enable = true;
        this.status.ghost = false;
        this.ghost.visible = false;
        this.ghost.body.enable = false;
        this.body.x = this.ghost.body.x;
        this.body.y = this.ghost.body.y - 16;
        this.body.velocity.y = 0;
        this.prevVelocityY = 0;
    }

    swim(controls, time, delta)
    {
        this.canSwim = false;

        let swimTiles = this.scene.layer.getTilesWithinWorldXY(this.body.x + 2, this.body.y, this.body.width - 4, this.body.height - 8);
        for (let swimTile of swimTiles) {
            if (swimTile.properties.swimable) {
                this.canSwim = true;
            }
        }
        //this.canSwim = true;

        if (this.canSwim) {

            this.moveSpeed = 0;
            this.body.allowGravity = false;

            let gravityUp = -16;

            if (!this.status.isSwimming) {
                this.status.swimTimer = 0;
                this.status.isSwimming = true;
                this.scene.sfx.play('splash', 4);
                this.groundParticlesEmitter.setTint([0xffffff]);
                this.groundParticlesEmitter.setAlpha([0.45, 0.35, 0.25, 0.15]);
                this.groundParticlesEmitter.explode(20, this.body.x + 4, this.body.bottom);
                this.bubblesEmitter.flow(150, 1);
                music.startMuffle();
                /*
                if (
                    this.scene.inventory.indexOf('flippers') === -1
                ) {
                    this.status.swimTimer = this.swimTimerMax;
                }
                if (
                    this.scene.inventory.indexOf('flippers') > -1
                    && this.scene.inventory.indexOf('scuba tank') > -1
                ) {
                */
                    this.status.isScubaDiving = true;
                /*
                }
                */
                this.movementParticlesEmitter.stop();
            }
            this.staminaBarOuter.visible = true;
            this.staminaBarInner.visible = true;
            this.staminaBarOuter.x = this.scene.cameras.main.width / 2;
            this.staminaBarInner.x = this.scene.cameras.main.width / 2 - 78;
            this.status.swimTimer = this.status.swimTimer + delta;

            if (this.status.isScubaDiving) {
                this.status.swimTimer = 0;
                this.bubblesEmitter.frequency = 50;
            }

            this.staminaBarInner.displayWidth = Math.min(Math.ceil((this.swimTimerMax - Math.min(this.status.swimTimer, this.swimTimerMax)) / this.swimTimerMax * 156), 156);

            if (this.status.swimTimer > this.swimTimerMax) {
                gravityUp = 16;
            }

            let oldSpeedX = this.body.velocity.x;
            let oldSpeedY = this.body.velocity.y;
            this.body.setVelocityX(Math.min(oldSpeedX + this.speedChange, Math.max(oldSpeedX - this.speedChange, 0)));
            this.body.setVelocityY(Math.min(oldSpeedY + this.speedChange, Math.max(oldSpeedY - this.speedChange, gravityUp)));
            if (this.body.velocity.y > this.jumpPower * 2) {
                this.body.setVelocityY(this.jumpPower * 2);
            }
            if (this.body.velocity.y < 0) {
                let checkTile = this.scene.layer.getTileAtWorldXY(this.body.x + 4, this.body.y - 10);
                if (checkTile === null || !checkTile.properties.swimable) {
                    //gravityUp = 16;
                    this.body.setVelocityY(-this.jumpPower);
                }
            }

            if (this.status.swimTimer > this.swimTimerMax + 3000) {
                this.bubblesEmitter.stop();
                this.choke();
                this.checkIfGameOver();
                return;
            }

            if (this.status.swimTimer > this.swimTimerMax) {
                this.ani = 'swim-idle';
                return;
            }

            if (controls.left) {
                this.body.setVelocityX(Math.max(oldSpeedX - this.speedChange, -this.speedMax));
            } else if (controls.right) {
                this.body.setVelocityX(Math.min(oldSpeedX + this.speedChange, this.speedMax));
            }
            if (controls.up) {
                this.body.setVelocityY(Math.max(oldSpeedY - this.speedChange, -this.speedMax));
            } else if (controls.down) {
                this.body.setVelocityY(Math.min(oldSpeedY + this.speedChange, this.speedMax));
            }
            this.ani = 'swim';

            if ((controls.aDown) && time > this.jumpTimer) {
                this.body.setVelocityY(-this.jumpPower);
                this.jumpTimer = time + 250;
            }

            //this.bubblesEmitter.setPosition(this.x - 4 + Math.floor(Math.random() * 9), this.y);

        } else {
            if (this.status.isSwimming) {
                this.status.isSwimming = false;
                this.status.isScubaDiving = false;
                this.staminaBarOuter.visible = false;
                this.staminaBarInner.visible = false;
                this.bubblesEmitter.stop();
                music.stopMuffle();
            }
        }
    }

    climb(controls, time, delta)
    {
        /*
        if (!this.scene.climbLayer
            || this.scene.inventory
                .indexOf('climbing belt') === -1) {
            return;
        }
        */
        this.canClimb = false;

        let climbTile = this.scene.climbLayer.getTileAtWorldXY(this.body.x + 4, this.body.y + 12);
        if (climbTile !== null && climbTile.properties.climbable) {
            this.canClimb = true;
        }

        if (this.isClimbing && (!this.canClimb || this.body.blocked.down)) {
            this.isClimbing = false;
            this.body.allowGravity = true;
            this.jumpTimer = time + 250;
        }

        if ((controls.up || (controls.down && !this.canDrop)) && time > this.jumpTimer) {
            if (this.canClimb && !this.isClimbing) {
                this.isClimbing = true;
                this.body.allowGravity = false;
                this.jumpTimer = time + 250;
                this.movementParticlesEmitter.stop();
            }
        }

        if (this.isClimbing) {

            this.ani = 'climb';

            if (controls.up) {
                let upTile = this.scene.climbLayer.getTileAtWorldXY(this.body.x + 4, this.body.y + 4);
                if (upTile !== null && upTile.properties.climbable) {
                    this.body.setVelocityY(-this.climbSpeed);
                } else {
                    this.body.setVelocityY(0);
                    let colTile = this.scene.layer.getTileAtWorldXY(this.body.x + 4, this.body.y + 12);
                    if (colTile !== null && colTile.properties.collideUp) {
                        this.body.setVelocityY(-this.jumpPower);
                        this.jumpTimer = time + 250;
                        this.isClimbing = false;
                        this.body.allowGravity = true;
                    }
                }
            } else if (controls.down) {
                this.body.setVelocityY(this.climbSpeed);
                this.prepDrop = false;
            } else {
                this.body.setVelocityY(0);
            }
            if (controls.left) {
                this.body.setVelocityX(-this.climbSpeed);
            } else if (controls.right) {
                this.body.setVelocityX(this.climbSpeed);
            } else {
                this.body.setVelocityX(0);
                if (this.body.velocity.y === 0) {
                    this.ani = 'climb-idle';
                }
            }

            if (controls.aDown && time > this.jumpTimer) {
                this.body.setVelocityY(-this.jumpPower);
                this.jumpTimer = time + 250;
                this.isClimbing = false;
                this.body.allowGravity = true;
            }
        }
    }

    runAndJump(controls, time, delta)
    {
        this.body.allowGravity = true;
        this.canDrop = false;

        if (controls.left) {

            this.body.velocity.x -= this.speedChange;
            this.body.velocity.x = Math.max(this.body.velocity.x, -this.speedMax);
            this.facing = 'left';
            this.idle = false;

        } else if (controls.right) {

            this.body.velocity.x += this.speedChange;
            this.body.velocity.x = Math.min(this.body.velocity.x, this.speedMax);
            this.facing = 'right';
            this.idle = false;

        } else {

            this.body.velocity.x += (0 - this.body.velocity.x) / 2;
            this.idle = true;

        }

        let onFloor = (this.body.onFloor() || this.body.touching.down);

        if (controls.aDown
            && (onFloor || (
                this.body.onWall()
                /*
                && this.scene.inventory
                    .indexOf('wall jump socks') > -1
                */
            )) && (time > this.jumpTimer))
        {
            this.body.setVelocityY(-this.jumpPower);
            this.jumpTimer = time + 250;

            if (this.body.blocked.left) {
                this.moveSpeed = this.speedMax;
                this.setVelocityX(this.moveSpeed);
                this.justWallJumped = true;
            } else if (this.body.blocked.right) {
                this.moveSpeed = -this.speedMax;
                this.setVelocityX(this.moveSpeed);
                this.justWallJumped = true;
            }
        } else if (controls.aDown
            && this.canDoubleJump && !onFloor && !this.body.onWall()
            && (time > this.jumpTimer)
        ) {
            this.body.setVelocityY(-this.jumpPower);
            this.jumpTimer = time + 250;
            this.canDoubleJump = false;
            this.justDoubleJumped = true;
        }

        if (onFloor) {

            let colTile = this.scene.layer.getTileAtWorldXY(this.body.x, this.body.y + 18);
            if ((colTile === null || (colTile !== null && !colTile.properties.collideAll))) {
                if (!controls.down) {
                    this.prepDrop = true;
                }
                if (controls.down && this.prepDrop && this.jumpTimer < time) {
                    this.body.checkCollision.down = false;
                    this.jumpTimer = time + 250;
                }
                this.canDrop = true;
            }
            colTile = this.scene.layer.getTileAtWorldXY(this.body.x + 8, this.body.y + 18);
            if ((colTile === null || (colTile !== null && !colTile.properties.collideAll)) && controls.down && this.canDrop && this.jumpTimer < time) {
                if (!controls.down) {
                    this.prepDrop = true;
                }
                if (controls.down && this.prepDrop && this.jumpTimer < time) {
                    this.body.checkCollision.down = false;
                    this.jumpTimer = time + 250;
                }
                this.canDrop = true;
            }

            if (this.idle) {

                if (this.facing === 'left') {
                    this.ani = 'idle-left';
                } else {
                    this.ani = 'idle-right';
                }
                this.movementParticlesEmitter.stop();

            } else {

                if (this.facing === 'left') {
                    this.ani = 'run-left';
                    this.movementParticlesEmitter.flow(1200, 1);
                } else {
                    this.ani = 'run-right';
                    this.movementParticlesEmitter.flow(1200, 1);
                }

            }

            //if (this.scene.inventory
            //        .indexOf('double jump suspenders') > -1) {
                this.prepDoubleJump = true;
            //}

        } else {

            if (this.body.blocked.left) {
                this.ani = 'slide-left';
                //if (
                //    this.scene.inventory.indexOf('slide grip gloves') > -1
                //) {
                    this.setVelocityY(Math.min(this.body.velocity.y, this.jumpPower));
                    this.movementParticlesEmitter.flow(900, 1);
                //}
            } else if (this.body.blocked.right) {
                this.ani = 'slide-right';
                //if (
                //    this.scene.inventory.indexOf('slide grip gloves') > -1
                //) {
                    this.setVelocityY(Math.min(this.body.velocity.y, this.jumpPower));
                    this.movementParticlesEmitter.flow(150, 1);
                //}

            } else {

                if (this.justWallJumped) {
                    this.ani = 'walljump-';
                } else if (this.justDoubleJumped) {
                    this.ani = 'doublejump-';
                } else if (this.status.parachuting) {
                    this.ani = 'parachute-';
                } else {
                    this.ani = 'jump-';
                }
                this.ani = this.ani + this.facing;
                this.movementParticlesEmitter.stop();
            }
            if (this.prepDoubleJump && !controls.aDown) {
                this.prepDoubleJump = false;
                this.canDoubleJump = true;
            }
        }
        if (this.jumpTimer < time) {
            this.body.checkCollision.down = true;
            this.justWallJumped = false;
            this.justDoubleJumped = false;
        }
    }

    choke()
    {
        if (!this.alive) {
            return;
        }
        this.alive = false;
        //this.visible = false;
        //this.body.enable = false;
        //this.scene.cameras.main.shake(250, 0.03);
        //this.groundParticlesEmitter.setTint([0xc75745, 0xaf4433, 0xd95641, 0xc75745, 0xaf4433, 0xd95641, 0xdcd5c1]);
        //this.groundParticlesEmitter.setAlpha([1]);
        //this.groundParticlesEmitter.explode(40, this.body.x + 4, this.body.bottom);
        this.scene.sfx.play('glitch');
    }

    chop()
    {
        if (!this.alive) {
            return;
        }
        this.alive = false;
        this.visible = false;
        this.body.enable = false;
        this.scene.cameras.main.shake(250, 0.03);
        //this.groundParticlesEmitter.setTint([0xc75745, 0xaf4433, 0xd95641, 0xc75745, 0xaf4433, 0xd95641, 0xdcd5c1]);
        this.groundParticlesEmitter.setTint([(this.playerKey === '') ? 0x736372 : 0x6a7363]);
        this.groundParticlesEmitter.setAlpha([1]);
        this.groundParticlesEmitter.explode(40, this.body.x + 4, this.body.bottom);
        this.scene.sfx.play('chop');
    }

    kill()
    {
        if (!this.alive) {
            return;
        }
        this.alive = false;
        this.visible = false;
        this.body.enable = false;
        this.scene.cameras.main.shake(250, 0.03);
        this.groundParticlesEmitter.setTint([(this.playerKey === '') ? 0x736372 : 0x6a7363]);
        this.groundParticlesEmitter.setAlpha([1]);
        this.groundParticlesEmitter.explode(20, this.body.x + 4, this.body.bottom);
        this.scene.sfx.play('splat');
    }

    doHomeBlockThing()
    {
        if (!this.alive) {
            return;
        }
        this.alive = false;
        this.visible = false;

        this.bubblesEmitter.setTint([(this.playerKey === '') ? 0x736372 : 0x6a7363]);
        this.bubblesEmitter.setDeathZone(undefined);
        this.bubblesEmitter.flow(50, 1);
    }
}

export default Player;
