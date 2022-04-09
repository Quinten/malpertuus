import Screen from './Screen';
import Player from '../sprites/Player.js';
import FlashMessage from '../sprites/FlashMessage.js';

import world from '../world';
world.maps.forEach((map) => {
    let key = map.fileName.replace('../scratch/', '').replace('.tmx', '');
    map.key = key;
});

class Level extends Screen {

    constructor (config)
    {
        super((config) ? config : { key: 'level', physics: {
            arcade: {
                tileBias: 12,
                gravity: { y: 512 },
                debug: false
            },
            matter: {
                debug: false,
                gravity: { y: 0.5 }
            }
        }});

        this.isLevel = true;

        this.inventory = ['homeblock'];
        //this.inventory = ['homeblock', 'flippers', 'climbing belt', 'wall jump socks', 'slide grip gloves', 'scuba tank', 'parachute', 'rope gun'];
        this.purse = [];

        this.isSplitForTwoPlayer = false;

        this.pauseOverlayAlpha = 0.65;

        this.dustColor = 0xeef0f2;
        this.mapKey = 'map';
    }

    create()
    {
        this.cameras.main.setBackgroundColor('#ddffdd');

        super.create();

        //this.mapKey = 'map';
        //this.idleKey = 'debug';

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
            this.tiles.push(this.map.addTilesetImage(tileset.name, tileset.name, 8, 8, 0, 0));
        });

        //this.bglayer = this.map.createLayer(0, this.tiles, 0, 0);
        //this.layer = this.map.createLayer(1, this.tiles, 0, 0);
        this.layer = this.map.createLayer(0, this.tiles, 0, 0);
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.matter.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels)

        // only up collisions
        this.map.setCollisionByProperty({collideUp: true});
        this.map.forEachTile(this.setCollisionOnlyUp, this, 0, 0, this.map.width, this.map.height);

        // collide all
        this.map.setCollisionByProperty({collideAll: true});

        this.climbLayer = this.layer;
        //this.cameras.main.setBackgroundColor(this.puzzleMap.bg);

        if (!this.startPoint) {
            this.startPoint = {
                //x: this.map.widthInPixels / 2 - 128,
                x: 40 * 8,
                //y: this.map.heightInPixels / 2 - 128,
                y: 36 * 8,
                facing: 'left'
            };
            this.idlePoint = {...this.startPoint};
            this.idleKey = this.mapKey;
        }

        this.inners = [];

        // the player
        this.player = new Player(this, this.startPoint.x, this.startPoint.y, 'player', 0, this.startPoint.facing);
        this.cameras.main.startFollow(this.player, true, 0.5, 0.5);
        this.physics.add.collider(this.player, this.layer);

        /*
        this.controls.events.on('yup', () => {
            this.scene.launch('inventory');
            this.scene.pause('level');
        });
        */

        this.controls.events.once('escup', () => {
            this.nextScene = 'menu';
            this.startNextWait = 0;
            this.startNext();
            this.sfx.play('click');
        }, this);

        this.controls.events.once('helpup', () => {
            this.scene.manager.keys.help.nextScene = 'level';
            this.scene.manager.keys.help.backText = 'Back to game';
            this.nextScene = 'help';
            this.startNextWait = 0;
            this.startNext();
            this.sfx.play('click');
        }, this);

        this.other = undefined;
        if (!this.isSplitForTwoPlayer) {
            this.controls.events.once('secup', () => {
                this.splitForTwoPlayer();
            });
        } else {
            this.splitForTwoPlayer();
        }
        this.bcontrols.start();

        this.flashMessage = new FlashMessage(this, 0, 0);
        this.time.delayedCall(this.fadeTime, e => {
            this.flashMessage.showText('Press ? for help');
        }, [], this);

        //console.log(this);
        /*
        if (this.mapKey === 'mount-hop') {
            this.ambient.isOn = true;
        }
        */
        //this.ambient.play(this.mapKey);

        this.dust.addOnePixelDust({ count: 20, alpha: 1, tint: this.dustColor });

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
        this.physics.add.collider(this.other, this.layer);
        this.cameras.main.startFollow((this.player.status.isTikkie) ? this.player : this.other, true, 0.5, 0.5);
        this.player.setCollideWorldBounds(!this.player.status.isTikkie);
        this.other.setCollideWorldBounds(this.player.status.isTikkie);
    }

    otherPlayerOverlap()
    {
        if (this.otherOverlapTimer > 1000) {
            this.player.status.isTikkie = !this.player.status.isTikkie;
            this.other.status.isTikkie = !this.player.status.isTikkie;
            this.cameras.main.shake(250, 0.03);
            this.sfx.play('click');
            this.otherOverlapTimer = 0;
            this.cameras.main.startFollow((this.player.status.isTikkie) ? this.player : this.other, true, 0.5, 0.5);
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
            //if (this.mapKey === 'map') {
            //    this.gameOver();
            //} else {
                this.gotoNextMap(leader);
                return;
            //}
        }

        // update player
        this.player.update(this.controls, time, delta);

        if (this.other) {
            this.other.update(this.bcontrols, time, delta);
            this.otherOverlapTimer = this.otherOverlapTimer + delta;
        }

        // save position when idle
        /*
        if (this.player.body.onFloor()
            && this.player.alive
            && !this.controls.left
            && !this.controls.right
            && !this.player.isClimbing
            && !this.player.status.isSwimming
            && this.mapKey !== 'map'
        ) {
            let colTile = this.layer.getTileAtWorldXY(this.player.body.x + 4, this.player.body.y + 18);
            if (colTile !== null && (colTile.properties.collideUp || colTile.properties.collideAll)) {
                this.startPoint = {
                    x: this.player.x,
                    y: this.player.y,
                    facing: this.player.facing
                }
                this.idlePoint = {...this.startPoint};
                this.idleKey = this.mapKey;
                localforage.setItem(
                    'start A',
                    {
                        map: this.mapKey,
                        startPoint: this.startPoint,
                        homePoint: this.homePoint,
                        purse: this.purse,
                        inventory: this.inventory
                    }
                );
            }
        }
        */
    }

    /*
    async unsetProgress()
    {
        this.purse = [];
        this.inventory = ['homeblock'];
        if (this.homePoint !== undefined) {
            this.startPoint = {
                x: this.homePoint.x,
                y: this.homePoint.y,
                facing: this.homePoint.facing
            };
            this.mapKey = this.homePoint.map;
            await localforage.setItem(
                'start A',
                {
                    map: this.mapKey,
                    startPoint: this.startPoint,
                    homePoint: this.homePoint,
                    purse: this.purse,
                    inventory: this.inventory
                }
            );
        }
    }
    */

    gameOver()
    {
        if (this.nextStart) {
            return;
        }

        /*
        let permadeath = this.state.permadeath;

        if (this.mapKey !== this.idleKey) {
            permadeath = false;
        }

        if (this.mapKey !== 'mount-hop' && this.mapKey !== 'sandbox') {
            this.startPoint = {...this.idlePoint};
            this.mapKey = this.idleKey;
        }

        if (permadeath) {
            this.nextScene = 'mazeunload';
            this.unsetProgress();
        } else {
            if (this.levelTime < 500) {
                this.useHomeBlock();
                return;
            }
            this.nextScene = 'level';
        }
        */
        this.nextScene = 'level'; //tmp
        this.startNextWait = 500;
        this.fadeTime = 1500;
        this.startNext();
        this.ambient.stop();
    }

    /*
    useHomeBlock()
    {
        if (this.nextStart) {
            return;
        }

        this.player.doHomeBlockThing();
        if (this.other) {
            this.other.doHomeBlockThing();
        }

        this.sfx.play('homeblock');

        this.startPoint = {
            x: this.homePoint.x,
            y: this.homePoint.y,
            facing: this.homePoint.facing
        };
        this.mapKey = this.homePoint.map;

        this.fadeTime = 1500;
        this.startNextWait = 500;
        this.nextScene = 'level';
        this.startNext();
        this.ambient.stop();
    }
    */

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
        /*
        let playerWorldX = this.puzzleMap.x * 256 + Math.round(leader.x + px);
        let playerWorldY = this.puzzleMap.y * 256 + Math.round(leader.y + py);
        let res = this.slot.puzzle.some((map) => {
            if (playerWorldX > map.x * 256
                && playerWorldX < (map.x + map.w) * 256
                && playerWorldY > (map.y) * 256
                && playerWorldY < (map.y + map.h) * 256
            ) {
                //console.log('map x y', map.x, map.y);
                this.mapKey = map.k;
                this.startPoint = {
                    x: playerWorldX - map.x * 256,
                    y: playerWorldY - map.y * 256,
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
                return true;
            }
            return false;
        });
        */
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
        //this.scene.stop('inventory');
        //this.scene.stop('minimap');
        //this.scene.stop('mazescroll');
        this.scene.resume('level');
    }

    onGamePause()
    {
        //this.scene.stop('inventory');
        //this.scene.stop('minimap');
        //this.scene.stop('mazescroll');
        super.onGamePause();
    }

    /*
    setObjectPositionsFromMap()
    {
        if (!this.map) {
            return;
        }
        this.runePoints = [];
        let layer = this.map.getLayer(3);
        layer.data.forEach((row) => {
            row.forEach((tile) => {
                if (tile.index > -1) {
                    if (tile.properties.player && !this.startPoint) {
                        this.startPoint = {x: tile.pixelX, y: tile.pixelY, facing: tile.properties.facing};
                    }
                    if (tile.properties.rune) {
                        this.runePoints.push({x: tile.pixelX + 4, y: tile.pixelY + 8});
                    }
                }
            });
        });
    }
    */

    /*
    gotoMountHop()
    {
        this.idlePoint = {...this.startPoint};
        this.idleKey = this.mapKey;
        localforage.setItem(
            'start A',
            {
                map: this.mapKey,
                startPoint: this.startPoint,
                homePoint: this.homePoint,
                purse: this.purse,
                inventory: this.inventory
            }
        );

        this.fadeTime = 150;
        this.nextScene = 'level';
        this.startPoint = undefined;
        this.mapKey = 'mount-hop';
        this.startNext();
        //this.ambient.stop();
    }
    */

    completeGame()
    {
        this.fadeTime = 150;
        this.nextScene = 'endscreen';
        this.startNext();
        this.ambient.stop();
    }
}

export default Level;
