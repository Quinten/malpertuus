import Screen from './Screen';
import Player from '../sprites/Player.js';
import FlashMessage from '../sprites/FlashMessage.js';

import world from '../world';
world.maps.forEach((map) => {
    let key = map.fileName.replace('../scratch/', '').replace('.tmx', '');
    map.key = key;
});

let shuffleArray = (arr) => {
    let newArr = [];
    let oldArr = [...arr];
    while (oldArr.length) {
        newArr.push(oldArr.splice(
            Math.floor(Math.random() * oldArr.length),
            1
        )[0]);
    }
    return newArr;
};

class Level extends Screen {

    constructor (config)
    {
        super((config) ? config : { key: 'level', physics: {
            arcade: {
                tileBias: 12,
                gravity: { y: 512 },
                debug: false
            }
        }});

        this.isLevel = true;

        this.isSplitForTwoPlayer = false;

        this.pauseOverlayAlpha = 0.65;

        this.mapKey = 'map';

        this.camLerp = 1;

        this.bottlesNeeded = 500;
        this.bottlesFound = 0;
        this.daysSurvived = 0;
    }

    create()
    {
        super.create();

        world.maps.forEach((map) => {
            let key = map.fileName.replace('../scratch/', '').replace('.tmx', '');
            if (key == this.mapKey) {
                this.mapWorldX = map.x;
                this.mapWorldY = map.y;
            }
        });

        this.map = this.make.tilemap({ key: this.mapKey });

        this.tiles = [];
        this.map.tilesets.forEach((tileset) => {
            this.tiles.push(
                this.map.addTilesetImage(tileset.name, tileset.name, 8, 8, 0, 0)
            );
        });

        this.layers = [];
        this.map.layers.forEach((origLayer, index) => {
            let layer = this.map.createLayer(index, this.tiles, 0, 0);
            layer.setDepth(index > 1 ? 4 : 0); // player is at 3
            this.layers.push(layer);
            // only up collisions
            this.map.setCollisionByProperty({collideUp: true}, true, true, index);
            this.map.forEachTile(this.setCollisionOnlyUp, this, 0, 0, this.map.width, this.map.height, undefined, index);
            // collide all
            this.map.setCollisionByProperty({collideAll: true}, true, true, index);
        });

        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

        if (!this.startPoint) {
            this.startPoint = {
                //x: this.map.widthInPixels / 2 - 128,
                x: 40 * 8,
                //y: this.map.heightInPixels / 2 - 128,
                y: 35 * 8,
                facing: 'left'
            };
            this.idlePoint = {...this.startPoint};
            this.idleKey = this.mapKey;
        }

        this.inners = [];

        // the player
        this.player = new Player(this, this.startPoint.x, this.startPoint.y, 'player', 0, this.startPoint.facing);
        this.cameras.main.startFollow(this.player, true, this.camLerp, this.camLerp);


        this.layers.forEach(layer => {
            this.physics.add.collider(this.player, layer);
        });

        this.setObjectPositionsFromMap();

        this.controls.events.once('escup', () => {
            this.nextScene = 'menu';
            this.startNextWait = 0;
            this.startNext();
            this.sfx.play('pop');
        }, this);

        this.controls.events.once('helpup', () => {
            this.scene.manager.keys.help.nextScene = 'level';
            this.scene.manager.keys.help.backText = 'Back to game';
            this.nextScene = 'help';
            this.startNextWait = 0;
            this.startNext();
            this.sfx.play('pop');
        }, this);

        // disable it for the jam
        /*
        this.other = undefined;
        if (!this.isSplitForTwoPlayer) {
            this.controls.events.once('secup', () => {
                this.splitForTwoPlayer();
            });
        } else {
            this.splitForTwoPlayer();
        }
        this.bcontrols.start();
        */

        this.flashMessage = new FlashMessage(this, 0, 0);
        this.time.delayedCall(this.fadeTime, e => {
            this.flashMessage.showText('Press ? for help');
        }, [], this);

        this.swimCels = [];
        /*
        let swimCels = this.puzzleMap.cels.filter(cel => cel.k === 's' || cel.k === 'z');
        if (swimCels.length > 0) {
            this.swimCels = swimCels;
            // bubbles
            this.bubbles = this.add.particles('particles');
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
                            let tile = this.layer.getTileAtWorldXY(x, y);
                            if (tile && tile.properties.swimable) {
                                return true;
                            }
                            return false;
                        }
                    }
                }
            });
            this.bubblesEmitter.flow(5, 1);
        }
        */

        this.levelTime = 0;
    }

    splitForTwoPlayer()
    {
        this.isSplitForTwoPlayer = true;
        this.other = new Player(this, this.player.x, this.player.y - 16, 'player', 0, 'left', 'b');
        this.otherOverlapTimer = 0;
        this.physics.add.overlap(this.other, this.player, this.otherPlayerOverlap, undefined, this);
        this.layers.forEach(layer => {
            this.physics.add.collider(this.other, layer);
        });
        this.cameras.main.startFollow((this.player.status.isTikkie) ? this.player : this.other, true, this.camLerp, this.camLerp);
        this.player.setCollideWorldBounds(!this.player.status.isTikkie);
        this.other.setCollideWorldBounds(this.player.status.isTikkie);
    }

    otherPlayerOverlap()
    {
        if (this.otherOverlapTimer > 1000) {
            this.player.status.isTikkie = !this.player.status.isTikkie;
            this.other.status.isTikkie = !this.player.status.isTikkie;
            this.cameras.main.shake(250, 0.03);
            this.sfx.play('pop');
            this.otherOverlapTimer = 0;
            this.cameras.main.startFollow((this.player.status.isTikkie) ? this.player : this.other, true, this.camLerp, this.camLerp);
            this.player.setCollideWorldBounds(!this.player.status.isTikkie);
            this.other.setCollideWorldBounds(this.player.status.isTikkie);
        }
    }

    update(time, delta)
    {
        this.levelTime = this.levelTime + delta;
        if (this.player === undefined || this.player.body === undefined) {
            return;
        }
        if (this.bubblesEmitter && this.bubblesEmitter.active) {
            let swimCel = this.swimCels[Math.floor(Math.random() * this.swimCels.length)];
            if (swimCel) {
                this.bubblesEmitter.setPosition(swimCel.mapX * 256 + Math.floor(Math.random() * 256), swimCel.mapY * 256 + Math.floor(Math.random() * 256));
            }
        }

        let leader = this.player;
        if (this.other && !this.player.status.isTikkie) {
            leader = this.other;
        }
        if (leader.y > this.map.heightInPixels
            || leader.y < 0
            || leader.x > this.map.widthInPixels
            || leader.x < 0
            && leader.alive
        ) {
            this.gotoNextMap(leader);
            return;
        }

        // update player
        this.player.update(this.controls, time, delta);

        if (this.other) {
            this.other.update(this.bcontrols, time, delta);
            this.otherOverlapTimer = this.otherOverlapTimer + delta;
        }

        // save position when idle
        if (this.player.body.onFloor()
            && this.player.alive
            && !this.controls.left
            && !this.controls.right
            && !this.player.isClimbing
            && !this.player.status.isSwimming
        ) {
            this.layers.forEach(layer => {
                let colTile = layer.getTileAtWorldXY(this.player.body.x + 4, this.player.body.y + 18);
                if (colTile !== null && (colTile.properties.collideUp || colTile.properties.collideAll)) {
                    this.startPoint = {
                        x: this.player.x,
                        y: this.player.y,
                        facing: this.player.facing
                    }
                }
            });
        }
    }

    setCollisionOnlyUp(tile)
    {
        if (tile.collideUp) {
            tile.collideDown = false;
            tile.collideLeft = false;
            tile.collideRight = false;
        }
    }

    gotoNextMap(leader)
    {
        if (this.nextStart) {
            return;
        }
        this.mapChanges = this.mapChanges + 1;
        leader.alive = false;
        leader.body.enable = false;
        let px = 2;
        if (leader.x < 0) {
            px = -2;
        }
        let py = 2;
        if (leader.y < 0) {
            py = -2;
        }
        let foundMap = false;
        world.maps.forEach((map) => {
            if (!foundMap
                && (this.mapWorldX + leader.x + px) > map.x
                && (this.mapWorldX + leader.x + px) < map.x + map.width
                && (this.mapWorldY + leader.y + py) > map.y
                && (this.mapWorldY + leader.y + py) < map.y + map.height
            ) {
                this.mapKey = map.key;
                this.startPoint = {
                    x: leader.x - (map.x - this.mapWorldX),
                    y: leader.y - (map.y - this.mapWorldY),
                    facing: leader.facing
                };
                if (leader.x < 0) {
                    this.startPoint.x = this.startPoint.x - 16;
                }
                if (leader.x > this.map.widthInPixels) {
                    this.startPoint.x = this.startPoint.x + 16;
                }
                if (leader.y < 0) {
                    this.startPoint.y = this.startPoint.y - 64;
                }
                if (leader.y > this.map.heightInPixels) {
                    this.startPoint.y = this.startPoint.y + 16;
                }
                foundMap = true;
            }
        });
        if (!foundMap) {
            if (leader.x < 0) {
                world.maps.sort((a, b) => b.x - a.x);
                world.maps.forEach((map) => {
                    if (!foundMap
                        && (this.mapWorldY + leader.y + py) > map.y
                        && (this.mapWorldY + leader.y + py) < map.y + map.height
                    ) {
                        this.mapKey = map.key;
                        this.startPoint = {
                            x: leader.x + map.width,
                            y: leader.y - (map.y - this.mapWorldY),
                            facing: leader.facing
                        };
                        foundMap = true;
                    }
                });
                this.startPoint.x = this.startPoint.x - 16;
            }
            if (leader.x > this.map.widthInPixels) {
                world.maps.sort((a, b) => a.x - b.x);
                world.maps.forEach((map) => {
                    if (!foundMap
                        && (this.mapWorldY + leader.y + py) > map.y
                        && (this.mapWorldY + leader.y + py) < map.y + map.height
                    ) {
                        this.mapKey = map.key;
                        this.startPoint = {
                            x: leader.x - this.map.widthInPixels,
                            y: leader.y - (map.y - this.mapWorldY),
                            facing: leader.facing
                        };
                        foundMap = true;
                    }
                });
                this.startPoint.x = this.startPoint.x + 16;
            }
            if (leader.y < 0) {
                world.maps.sort((a, b) => b.y - a.y);
                world.maps.forEach((map) => {
                    if (!foundMap
                        && (this.mapWorldX + leader.x + px) > map.x
                        && (this.mapWorldX + leader.x + px) < map.x + map.width
                    ) {
                        this.mapKey = map.key;
                        this.startPoint = {
                            x: leader.x - (map.x - this.mapWorldX),
                            y: leader.y + map.height,
                            facing: leader.facing
                        };
                        foundMap = true;
                    }
                });
                this.startPoint.y = this.startPoint.y - 64;
            }
            if (leader.y > this.map.heightInPixels) {
                world.maps.sort((a, b) => a.y - b.y);
                world.maps.forEach((map) => {
                    if (!foundMap
                        && (this.mapWorldX + leader.x + px) > map.x
                        && (this.mapWorldX + leader.x + px) < map.x + map.width
                    ) {
                        this.mapKey = map.key;
                        this.startPoint = {
                            x: leader.x - (map.x - this.mapWorldX),
                            y: leader.y - this.map.heightInPixels,
                            facing: leader.facing
                        };
                        foundMap = true;
                    }
                });
                this.startPoint.y = this.startPoint.y + 16;
            }
        }
        this.fadeTime = 0;
        this.startNextWait = 0;
        this.scene.restart();
    }

    onGameResume()
    {
        super.onGameResume();
        this.scene.resume('level');
    }

    onGamePause()
    {
        super.onGamePause();
    }

    setObjectPositionsFromMap()
    {
        if (!this.map) {
            return;
        }
        let bottlePositions = [];
        this.map.layers.forEach(layer => {
            layer.data.forEach((row) => {
                row.forEach((tile) => {
                    if (tile.index > -1) {
                        /*
                        if (tile.properties.player && !this.startPoint) {
                            this.startPoint = {x: tile.pixelX, y: tile.pixelY, facing: tile.properties.facing};
                        }
                        */
                        if (tile.properties.bottle) {
                            bottlePositions.push({x: tile.pixelX + 3, y: tile.pixelY});
                        }
                    }
                });
            });
        });

        bottlePositions = shuffleArray(bottlePositions);

        bottlePositions.forEach((tile, index) => {
            if (index > (500 + 25 * this.daysSurvived) - this.bottlesNeeded) {
                return;
            }
            let bottle = this.physics.add.sprite(tile.x, tile.y, 'bottle');
            bottle.body.allowGravity = false;
            bottle.setDepth(3);
            this.physics.add.overlap(bottle, this.player, (b, p) => {
                b.visible = false;
                b.body.enable = false;
                this.bottlesNeeded = this.bottlesNeeded - 1;
                this.bottlesFound = this.bottlesFound + 1;
                if (this.flashMessage.isShowing) {
                    this.flashMessage.showText('Found ' + this.bottlesFound + ' empty bottles.\n' + this.bottlesNeeded + ' to go...')
                } else {
                    this.bottlesFound = 1;
                    this.flashMessage.showText('Found 1 empty bottle.\n' + this.bottlesNeeded + ' to go...')
                }
                this.sfx.play('uimove', 8);
                if (this.bottlesNeeded <= 0) {
                    this.bottlesNeeded = 500;
                    this.daysSurvived = this.daysSurvived + 1;
                    this.completeGame();
                    this.flashMessage.resetMessages();
                }
            });
        });
    }

    completeGame()
    {
        this.fadeTime = 0;
        this.startNextWait = 0;
        this.nextScene = 'endscreen';
        this.startNext();
        //this.ambient.stop();
    }
}

export default Level;
