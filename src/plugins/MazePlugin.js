import generator from 'generate-maze';

class MazePlugin extends Phaser.Plugins.BasePlugin
{
    constructor (pluginManager)
    {
        super(pluginManager);

        this.tileTypes = [
            {top: true, right: true, bottom: true, left: true},
            {top: false, right: false, bottom: false, left: false},
            {top: true, right: false, bottom: true, left: false},
            {top: false, right: true, bottom: false, left: true},

            {top: false, right: true, bottom: false, left: false},
            {top: false, right: false, bottom: false, left: true},
            {top: true, right: false, bottom: false, left: false},
            {top: false, right: false, bottom: true, left: false},

            {top: false, right: false, bottom: true, left: true},
            {top: true, right: false, bottom: false, left: true},
            {top: true, right: true, bottom: false, left: false},
            {top: false, right: true, bottom: true, left: false},

            {top: false, right: true, bottom: true, left: true},
            {top: true, right: false, bottom: true, left: true},
            {top: true, right: true, bottom: false, left: true},
            {top: true, right: true, bottom: true, left: false}
        ];

        this.mirrors = [
            0,
            1,
            2,
            3,
            5,
            4,
            6,
            7,
            11,
            10,
            9,
            8,
            12,
            15,
            14,
            13
        ];

        this.topLeftMapping = [0, 1, 2, 4, 4, 1, 6, 7, 7, 6, 10, 11, 11, 2, 10, 15];
        this.bottomRightMapping = [0, 1, 2, 5, 1, 5, 6, 7, 8, 9, 6, 7, 8, 13, 14, 2];

        this.maze = undefined;
        this.gridWidth = 0;
        this.gridHeight = 0;

        this.prefabKeys = [
            ['d'], // run and jump
            ['d', 'v', 'k', 'h', 'j'], // anything goes
            ['v'], // wall jump
            ['s'], // swim
            ['k'], // climb
            ['z'], // open swim
            ['h'], // rope gun
            ['j', 'd'] // double jump
        ];

        // smallest exits for the edges
        this.prefabKeysExits = [
            ['t'], // run and jump
            ['t', 'w', 'c', 'g', 'i'], // anything goes
            ['w'], // wall jump
            ['s'], // swim
            ['c'], // climb
            ['s'], // open swim, but not used
            ['g'], // rope gun
            ['i', 't'] // double jump
        ];

        this.itemTileIds = {
            'parachute': 130,
            'vendingmachine': 131,
            'map': 132,
            'scuba tank': 133,
            'flippers': 134,
            'wall jump socks': 135,
            'climbing belt': 136,
            'slide grip gloves': 145,
            'rope gun': 146,
            'rune': 147,
            'falling platform': 148,
            'double jump suspenders': 149,
            'postcard': 150
        };

        this.inverseDir = {
            top: 'bottom',
            bottom: 'top',
            left: 'right',
            right: 'left'
        };

        this.powerups = [
            'parachute',
            'rope gun',
            'double jump suspenders',
            'scuba tank',
            'flippers',
            'wall jump socks',
            'climbing belt',
            'slide grip gloves'
        ];

        this.imgLayers = [
            'bg',
            'solid',
            'up',
            'topping',
            'falling',
            'climb',
            'swim',
            'spikes'
        ];

        this.imgSeed = {
            bg: 0,
            solid: 0,
            up: 0,
            topping: 0,
            falling: 0,
            climb: 0,
            swim: 0,
            spikes: 0
        };

        var bgTypes = [
            {up: 0, right: 0, down: 0, left: 0},
            {up: 1, right: 0, down: 1, left: 0},
            {up: 0, right: 1, down: 0, left: 1},
            {up: 1, right: 1, down: 1, left: 1},
            {up: 1, right: 1, down: 0, left: 0},
            {up: 0, right: 1, down: 1, left: 0},
            {up: 0, right: 0, down: 1, left: 1},
            {up: 1, right: 0, down: 0, left: 1},
            {up: 1, right: 1, down: 0, left: 1},
            {up: 1, right: 1, down: 1, left: 0},
            {up: 0, right: 1, down: 1, left: 1},
            {up: 1, right: 0, down: 1, left: 1}
        ];

        var bgOptions = [[],[]];

        // top left: 1 option with all types
        // start bg
        bgOptions[0][0] = [
            [0,1,2,3,4,5,6,7,8,9,10,11]
        ];

        // top right: 2 options considering left
        bgOptions[1][0] = [
            [0,1,4,5,9],
            [2,3,6,7,8,10,11]
        ];
        // bottom left: 2 options depending on top
        bgOptions[0][1] = [
            [0,2,5,6,10],
            [1,3,4,7,8,9,11]
        ];
        // bottom right: 4 options depending on left and top
        // 0 0, 1 0, 0 1, 1 1
        bgOptions[1][1] = [];
        bgOptions[1][1][0] = [];
        bgOptions[1][1][1] = [];
        bgOptions[1][1][0][0] = [0,5];
        bgOptions[1][1][1][0] = [2,6,10];
        bgOptions[1][1][0][1] = [1,4,9];
        bgOptions[1][1][1][1] = [3,7,8,11];

        this.bgPattern = {
            bgTypes,
            bgOptions
        };

        this.prng = Math.random;
    }

    start()
    {
        //console.log('MazePlugin started...');
    }

    generate(w = 32, h = 32) {
        this.gridWidth = w;
        this.gridHeight = h;
        if (this.prng === Math.random) {
            this.maze = generator(
                this.gridWidth,
                this.gridHeight,
                true
            );
        } else {
            this.maze = generator(
                this.gridWidth,
                this.gridHeight,
                true,
                this.prng.int32()
            );
        }
        let homeX = 16;
        let homeY = 16;
        this.openAllWallsOfCel(homeX, homeY);
        let homeCel = this.maze[homeY][homeX];
        homeCel.home = true;
        homeCel.level = 0;
        this.homeCel = homeCel;

        this.openAllWallsOfCel(homeX - 2, homeY - 2);
        this.openAllWallsOfCel(homeX + 2, homeY - 2);
        this.openAllWallsOfCel(homeX + 2, homeY + 2);
        this.openAllWallsOfCel(homeX - 2, homeY + 2);

        this.openAllWallsOfCel(homeX - 4, homeY - 0);
        this.openAllWallsOfCel(homeX + 0, homeY - 4);
        this.openAllWallsOfCel(homeX + 4, homeY + 0);
        this.openAllWallsOfCel(homeX - 0, homeY + 4);

        for (let col of this.maze) {
            for (let cel of col) {
                for (let t = 0; t < this.tileTypes.length; t++) {
                    if ((cel.top == this.tileTypes[t].top) && (cel.right == this.tileTypes[t].right) && (cel.bottom == this.tileTypes[t].bottom) && (cel.left == this.tileTypes[t].left)) {
                        cel.type = t;
                        cel.rEnter = {
                            top: [],
                            right: [],
                            bottom: [],
                            left: []
                        };
                        cel.rExit = {
                            top: [],
                            right: [],
                            bottom: [],
                            left: []
                        };
                        if (cel.level !== 0) {
                            cel.level = 1;
                        }
                    }
                }
            }
        }

        this.runnerPaths = [];

        // create 2 seas
        this.sendRunner('empty sea north', 20, 3);
        this.sendRunner('empty sea south', 20, 3);

        let scenario = this.generateScenario();

        //console.log(scenario);

        scenario.forEach((line, index) => {
            this.sendRunner(line.item, Math.floor((scenario.length - index) / scenario.length * 14) + 6, line.level);
        });

        /*
        this.sendRunner('ancient maze scroll', 20, 3);
        this.sendRunner('parachute', 12, 6);
        this.sendRunner('rope gun', 12, 3);
        this.sendRunner('double jump suspenders', 20, 3);
        this.sendRunner('scuba tank', 12, 2);
        this.sendRunner('slide grip gloves', 10, 2);
        this.sendRunner('flippers', 8, 2);
        this.sendRunner('wall jump socks', 8, 4);
        this.sendRunner('climbing belt', 6, 0);
        */

        this.sendRunner('vendingmachine');

        // safe area around homecel/homeblock
        this.maze[homeCel.y - 1][homeCel.x].level = 0;
        this.maze[homeCel.y + 1][homeCel.x].level = 0;
        this.maze[homeCel.y][homeCel.x - 1].level = 0;
        this.maze[homeCel.y][homeCel.x + 1].level = 0;

        return this.maze;
    }

    generateScenario()
    {
        // 0 --> run and jump
        // 1 --> anything goes
        // 2 --> wall jump
        // 3 --> swim
        // 4 --> climb
        // 5 --> open swim
        // 6 --> rope gun


        let scenario =  [];
        // power ups
        let dropItems = [
            {
                item: 'parachute',
                levels: [2, 3, 4, 7]
            },
            {
                item: 'rope gun',
                levels: [2, 3, 4, 7]
            },
            {
                item: 'double jump suspenders',
                levels: [2, 3, 4, 6]
            },
            {
                item: 'scuba tank',
                levels: [2, 4, 6, 7]
            },
            {
                item: 'flippers',
                levels: [2, 4, 6, 7]
            },
            {
                item: 'wall jump socks',
                levels: [4, 3, 6, 7]
            },
            {
                item: 'climbing belt',
                levels: [2, 3, 6, 7]
            },
            {
                item: 'slide grip gloves',
                levels: [2, 3, 4, 6, 7]
            }
        ];

        dropItems = this.shuffleArray(dropItems);

        // epic items
        dropItems.push({
                item: 'ancient maze scroll',
                levels: [2, 3, 4, 6, 7]
            }
        );
        dropItems.push({
                item: 'postcard',
                levels: [2, 3, 4, 6, 7]
            }
        );

        let dependecies = [
            [],
            ['wall jump socks', 'climbing belt', 'rope gun', 'double jump suspenders'],
            ['wall jump socks'],
            ['flippers', 'scuba tank'],
            ['climbing belt'],
            ['flippers', 'scuba tank'],
            ['rope gun'],
            ['double jump suspenders']
        ];

        let pickLevel = (levels) => {
            if (levels.length === 0) {
                return 0;
            }
            let level = levels.splice(
                Math.floor(this.prng() * levels.length),
                1
            )[0];
            if (dependecies[level].every(item => scenario.some(line => line.item === item))) {
                if (scenario.some(line => line.level === level)) {
                    if (levels.length === 0) {
                        return level;
                    } else {
                        let newLevel = pickLevel(levels);
                        if (newLevel !== 0) {
                            return newLevel;
                        }
                    }
                }
                return level;
            }
            return pickLevel(levels);
        };

        dropItems.forEach(dropItem => {
            scenario.push({
                item: dropItem.item,
                level: pickLevel(this.shuffleArray(dropItem.levels))
            });
        });

        scenario.reverse();

        return scenario;
    }

    sendRunner(item, perimeter = 1, level = 0, dirs = ['top', 'right', 'bottom', 'left']) {
        if (!this.homeCel || !this.maze) {
            return false;
        }
        let x = this.homeCel.x;
        let y = this.homeCel.y;
        dirs = this.shuffleArray(dirs);
        let move = {
            top: () => {
                y = y - 1;
            },
            right: () => {
                x = x + 1;
            },
            bottom: () => {
                y = y + 1;
            },
            left: () => {
                x = x - 1;
            }
        };
        let cel = this.homeCel;
        let path = [cel];
        let fullPath = [cel];
        let dropped = false;
        while (!dropped) {
            let nextDir = dirs.find((dir) => {
                return (!cel[dir]
                    && cel.rExit[dir].indexOf(item) === -1
                    && cel.rEnter[dir].indexOf(item) === -1
                );
            });
            if (nextDir === undefined) {
                nextDir = dirs.find((dir) => {
                    return (!cel[dir]
                        && cel.rExit[dir].indexOf(item) === -1
                        && cel.rEnter[dir].indexOf(item) > -1
                    );
                });
                path.pop();
            }
            if (nextDir === undefined) {
                // start popping the path
                cel = path.pop();
                if (
                    cel === this.homeCel
                    && !Object.keys(
                        this.homeCel.rExit
                    ).some((dir) =>
                        this.homeCel.rExit[dir]
                            .indexOf(item) === -1
                    )
                ) {
                    dropped = true;
                    console.log(item + ' not dropped');
                    if (this.powerups.indexOf(item) > -1) {
                        this.game.scene.keys.level.inventory.push(item);
                        console.log('moved to inventory');
                    }
                    return false;
                }
            } else {
                move[nextDir]();
                cel.rExit[nextDir].push(item);
                cel = this.maze[y][x];
                path.push(cel);
                fullPath.push(cel);
                /*
                dirs.push(dirs.splice(
                    dirs.indexOf(nextDir),
                    1
                )[0]);
                */
                cel.rEnter[this.inverseDir[nextDir]].push(item);
                if (
                    Math.abs(cel.x - this.homeCel.x) > perimeter
                    || Math.abs(cel.y - this.homeCel.y) > perimeter
                    || cel.x === 0
                    || cel.y === 0
                    || cel.x === 31
                    || cel.y === 31
                ) {
                    if (cel.i === undefined) {
                        dropped = true;
                        if (item.indexOf('empty') !== 0) {
                            cel.i = this.itemTileIds[item];
                            cel.item = item;
                            //console.log(item + ' dropped', cel);
                        }
                    } else {
                        perimeter += 1;
                    }
                }
            }
        }
        fullPath.forEach((cel) => {
            cel.level = level;
        });
        if (item.indexOf('empty') !== 0) {
            this.runnerPaths.push({
                item: item,
                level: level,
                path: fullPath
            });
        }
        return true;
    }

    openAllWallsOfCel(x, y)
    {
        let cel = this.maze[y][x];
        cel.top = false;
        cel.bottom = false;
        cel.right = false;
        cel.left = false;
        this.maze[y - 1][x].bottom = false;
        this.maze[y + 1][x].top = false;
        this.maze[y][x - 1].right = false;
        this.maze[y][x + 1].left = false;
    }

    openTopLeft()
    {
        this.maze[0][0].type = this.topLeftMapping[this.maze[0][0].type];
    }

    openBottomRight()
    {
        this.maze[this.gridHeight - 1][this.gridWidth - 1].type = this.bottomRightMapping[this.maze[this.gridHeight - 1][this.gridWidth - 1].type];
    }

    generateMapPuzzle(
        width = 32,
        height = 32,
        levelWidth = 4,
        levelHeight = 4,
        prefabWidth = 32,
        prefabHeight = 32,
        tileWidth = 8,
        tileHeight = 8
    ) {
        let puzzle = [];
        let x = 0;
        while (x < width) {
            let w = levelWidth;
            let y = 0;
            while (y < height) {
                let h = levelHeight;
                if (
                    height - y === levelHeight * 1.5
                    || this.prng() > .5
                    && height - y > levelHeight * 2
                ) {
                    h += levelHeight / 2;
                }
                let k = btoa('' + this.prng());
                let map = {x, y, w, h, k,
                    coinPositions: [],
                    vendingMachinePoints: [],
                    runePoints: [],
                    fallingPlatformPoints: []
                };
                puzzle.push(map);
                y += h;
            }
            x += levelWidth;
        }
        let mergeMaps = (mw, mh) => {
            let left = true;
            while (left) {
                let delA;
                let delB;
                let newMap;
                left = puzzle.some((mapA, a) => {
                    if (
                        mapA.w !== levelWidth
                        || mapA.h !== levelHeight
                    ) {
                        return false;
                    }
                    return puzzle.some((mapB, b) => {
                        if (
                            mapB.w !== levelWidth
                            || mapB.h !== levelHeight
                        ) {
                            return false;
                        }
                        if (
                            mapB.y !== mapA.y + mh
                            || mapB.x !== mapA.x + mw
                        ) {
                            return false;
                        }
                        delA = a;
                        delB = b;
                        newMap = {
                            x: mapA.x,
                            y: mapA.y,
                            w: levelWidth + mw,
                            h: levelHeight + mh,
                            k: btoa('' + this.prng()),
                            coinPositions: [],
                            vendingMachinePoints: [],
                            runePoints: [],
                            fallingPlatformPoints: []
                        };
                        return true;
                    });
                });
                if (newMap) {
                    puzzle.splice(Math.max(delA, delB), 1);
                    puzzle.splice(Math.min(delA, delB), 1);
                    puzzle.push(newMap);
                }
            }
        }
        mergeMaps(levelWidth, 0);
        mergeMaps(0, levelHeight);

        return puzzle;
    }

    addMazeCelsToPuzzle(puzzle, maze) {
        puzzle.forEach((map) => {
            map.cels = [];
            let nY = 0;
            for (let y = map.y; y < map.y + map.h; y++) {
                let nX = 0;
                for (let x = map.x; x < map.x + map.w; x++) {
                    let cel = maze[y][x];
                    cel.mapX = nX;
                    cel.mapY = nY;
                    let k = this.prefabKeys[cel.level][Math.floor(
                        this.prng() * this.prefabKeys[cel.level].length
                    )];
                    /*
                    if (((nX === 0) && !cel.left)
                        || ((nY === 0) && !cel.top)
                        || ((nX === (map.w - 1)) && !cel.right)
                        || ((nY === (map.h - 1)) && !cel.bottom)
                    ) {
                    */
                    if ((nX === 0)
                        || (nY === 0)
                        || (nX === (map.w - 1))
                        || (nY === (map.h - 1))
                    ) {
                        k = this.prefabKeysExits[cel.level][Math.floor(
                            this.prng() * this.prefabKeysExits[cel.level].length
                        )];
                        cel.edge = true;
                    } else {
                        if (cel.level === 3) {
                            if ((cel.left || (!cel.left && maze[y][x - 1].level === 3)) && (cel.right || (!cel.right && maze[y][x + 1].level === 3)) && (cel.bottom || (!cel.bottom && maze[y + 1][x].level === 3))) {
                            k = this.prefabKeys[5][Math.floor(
                                this.prng() * this.prefabKeys[5].length
                            )];
                            }
                        }
                    }
                    cel.k = k;
                    if (cel.home) {
                        map.home = true;
                        this.startMap = map.k;
                    }
                    map.cels.push(cel);
                    nX = nX + 1;
                }
                nY = nY + 1;
            }
            let randomCel = this.shuffleArray(map.cels).find(
                cel => cel.i === undefined && cel.type > 11
            );
            if (randomCel === undefined) {
                randomCel = this.shuffleArray(map.cels).find(
                    cel => cel.i === undefined
                );
            }
            randomCel.i = this.itemTileIds['map'];
            randomCel.item = 'map';

            randomCel = this.shuffleArray(map.cels).find(
                cel => cel.i === undefined
            );
            randomCel.i = this.itemTileIds['vendingmachine'];
            randomCel.item = 'vendingmachine';

            randomCel = this.shuffleArray(map.cels).find(
                cel => cel.i === undefined && cel.level !== 3 && cel.type > 11
            );
            if (randomCel !== undefined) {
                randomCel.i = this.itemTileIds['rune'];
                randomCel.item = 'rune';
            }
        });
        return puzzle;
    }

    async createDataFromPuzzleMap({ map = undefined, shardW = 32, shardH = 32, maze = undefined} = {})
    {
        let data = [];
        let bg = [];
        let w = (map.w * shardW);
        let h = (map.h * shardH);
        for (let y = 0; y < h; y++) {
            let row = [];
            data.push(row);
            let bgrow = [];
            bg.push(bgrow);
            for (let x = 0; x < w; x++) {
                row.push(0);
                bgrow.push(0);
            }
        }
        map.cels.forEach((cel) => {
            if (cel.type !== undefined) {
                let key = (cel.k) ? cel.k : 't';
                //key = 'w';
                let completlyUnderwater = false;

                // will flood any narrow prefab
                if (cel.k === 's'
                    && ((!cel.top && cel.y > 0 && maze[cel.y - 1][cel.x].level === 3) || cel.top)
                    && ((!cel.left && cel.x > 0 && maze[cel.y][cel.x - 1].level === 3) || cel.left)
                    && ((!cel.bottom && cel.y < 31 && maze[cel.y + 1][cel.x].level === 3) || cel.bottom)
                    && ((!cel.right && cel.x < 31 && maze[cel.y][cel.x + 1].level === 3) || cel.right)
                ) {
                    completlyUnderwater = true;
                    let randomLevel = this.prefabKeysExits[Math.floor(this.prng() * this.prefabKeysExits.length)];
                    let randomKey = randomLevel[Math.floor(this.prng() * randomLevel.length)];
                    key = randomKey;
                }

                let mirrored = this.prng() > .5;
                let prefabIndex = (mirrored) ? this.mirrors[cel.type] : cel.type;
                let origLayers = this.game.cache.tilemap.entries.entries['prefab_' + key + '-' + prefabIndex].data.layers;
                let layerIndex = (cel.layer) ? cel.layer : Math.floor(this.prng() * origLayers.length);
                let origMap = origLayers[layerIndex].data;
                let prevT = 0;
                let itemDropped = cel.item === undefined;
                let tmpPlatforms = cel.type !== 1 && this.prng() > .7;
                for (let y = 0; y < shardH; y++) {
                    for (let x = 0; x < shardW; x++) {
                        let i = (y * shardW) + x;
                        if (mirrored) {
                            i = (y * shardW) + (shardW - 1 - x);
                        }
                        let newX = ((cel.x - map.x) * shardW) + x;
                        let newY = ((cel.y - map.y) * shardH) + y;
                        let t = origMap[i];
                        if (tmpPlatforms && t === 65) {
                            t = 149;
                        }
                        // flood water
                        if (completlyUnderwater && t !== 1) {
                            t = 137;
                        } else if (t !== 1 && ['s'].indexOf(key) > -1) {
                            //console.log(t);
                            if (!cel.top && cel.y > 0
                                && maze[cel.y - 1][cel.x].level === 3
                            ) {
                                if (x > 11 && x < 20 && y < 8) {
                                    t = 137;
                                }
                            }
                            if (!cel.left && cel.x > 0
                                && maze[cel.y][cel.x - 1].level === 3
                            ) {
                                if (y > 7 && y < 24 && x < 8) {
                                    t = 137;
                                }
                            }
                            if (!cel.bottom && cel.y < 31
                                && maze[cel.y + 1][cel.x].level === 3
                            ) {
                                if (y > 17) {
                                    t = 137;
                                }
                            }
                            if (!cel.right && cel.x < 31
                                && maze[cel.y][cel.x + 1].level === 3
                            ) {
                                if (y > 7 && y < 24 && x > 23) {
                                    t = 137;
                                }
                            }
                        }
                        // ceiling spikes
                        if (y === 0 && cel.mapY > 1 && origMap[i] === 1 && !data[newY - 1][newX]) {
                           data[newY - 1][newX] = 193;
                        }
                        // fallingPlatforms
                        if (t === 149) {
                            map.fallingPlatformPoints.push({
                                x: newX * 8 + 4,
                                y: newY * 8 + 4
                            });
                            t = 149;
                        }
                        // set items
                        if (origMap[i] === 129) {
                            if (cel.item !== undefined) {
                                if (cel.item === 'vendingmachine') {
                                    map.vendingMachinePoints.push({
                                        x: newX * 8 + ((mirrored) ? 8 : 0),
                                        y: newY * 8,
                                        flipped: mirrored
                                    });
                                } else if (cel.item === 'rune') {
                                    map.runePoints.push({
                                        x: newX * 8 + ((mirrored) ? 8 : 0),
                                        y: newY * 8 + 24
                                    });
                                } else {
                                    map.coinPositions.push({
                                        x: newX * 8 + ((mirrored) ? 8 : 0),
                                        y: newY * 8,
                                        item: cel.item
                                    });
                                }
                                itemDropped = true;
                            }
                            t = prevT;
                        }
                        // extend ladders from the map on top or the map below
                        //14, 15, 16, 17, 46, 47, 48, 49, 78, 79, 80, 81, 110, 111, 112, 113, 142, 143, 144, 145, 174, 175, 176, 177, 206, 207, 208, 209, 238, 239, 240, 241
                        if (newY === 0 && t === 0) {
                            if (cel.top === false && map.y > 0) {
                                let topCel = maze[map.y - 1][map.x + Math.floor(newX / shardW)];

                                if (topCel.k === 'c') {
                                    t = 73;
                                    if ([14, 46, 78, 110, 142, 174, 206, 238].indexOf(newX) > -1) {
                                        let sX = newX;
                                        while(sX < newX + 4) {
                                            let sY = newY;
                                            while(sY < newY + 8 && data[sY][sX] === 0) {
                                                data[sY][sX] = t;
                                                sY = sY + 1;
                                            }
                                            sX = sX + 1;
                                        }
                                    }
                                }
                            }
                        }
                        if (newY === h - 8 && t === 0) {
                            if (cel.bottom === false) {
                                let bottomCel = maze[map.y + map.h][map.x + Math.floor(newX / shardW)];
                                if (bottomCel !== undefined && bottomCel.k === 'c') {
                                    //console.log('found');
                                    if ([14, 46, 78, 110, 142, 174, 206, 238].indexOf(newX) > -1) {
                                        t = 73;
                                        let sX = newX;
                                        while(sX < newX + 4) {
                                            let sY = newY;
                                            while(sY < h && [0, 65, 149].indexOf(data[sY][sX]) > -1) {
                                                data[sY][sX] = t;
                                                sY = sY + 1;
                                            }
                                            sX = sX + 1;
                                        }
                                    }
                                }
                            }
                        }
                        if (t !== 0 && data[newY][newX] !== 73) {
                            data[newY][newX] = t;
                        }
                        prevT = t;
                    }
                }
                if (!itemDropped) {
                    console.log('item position tile missing in', cel.k, cel.type);
                }
                // extend ladders in open area's
                if (cel.k === 'k') {
                    if (!cel.top) {
                        if (['z'].indexOf(maze[cel.y - 1][cel.x].k) === -1) {
                            let sX = cel.mapX * 32 + 14;
                            while(sX < cel.mapX * 32 + 18) {
                                let sY = cel.mapY * 32 - 1;
                                while(
                                    sY > (cel.mapY * 32 - 5)
                                    && data[sY + 1][sX] === 73
                                    && data[sY][sX] === 0
                                ) {
                                    data[sY][sX] = 73;
                                    sY = sY - 1;
                                }
                                sX = sX + 1;
                            }
                        }
                    }
                    if (!cel.bottom) {
                        if (['z'].indexOf(maze[cel.y + 1][cel.x].k) === -1) {
                            let sX = cel.mapX * 32 + 14;
                            while(sX < cel.mapX * 32 + 18) {
                                let sY = (cel.mapY + 1) * 32;
                                while(
                                    sY < ((cel.mapY + 1) * 32 + 4)
                                    && data[sY - 1][sX] === 73
                                    && data[sY][sX] === 0
                                ) {
                                    data[sY][sX] = 73;
                                    sY = sY + 1;
                                }
                                sX = sX + 1;
                            }
                        }
                    }
                    if (!cel.right) {
                        if (['z'].indexOf(maze[cel.y][cel.x + 1].k) === -1) {
                            let sY = cel.mapY * 32 + 14;
                            while(sY < cel.mapY * 32 + 18) {
                                let sX = (cel.mapX + 1) * 32;
                                while(
                                    sX < ((cel.mapX + 1) * 32 + 4)
                                    && data[sY][sX] === 0
                                ) {
                                    data[sY][sX] = 73;
                                    sX = sX + 1;
                                }
                                sY = sY + 1;
                            }
                        }
                    }
                    if (!cel.left) {
                        if (['z'].indexOf(maze[cel.y][cel.x - 1].k) === -1) {
                            let sY = cel.mapY * 32 + 14;
                            while(sY < cel.mapY * 32 + 18) {
                                let sX = cel.mapX * 32 - 1;
                                while(
                                    sX > (cel.mapX * 32 - 5)
                                    && data[sY][sX] === 0
                                ) {
                                    data[sY][sX] = 73;
                                    sX = sX - 1;
                                }
                                sY = sY + 1;
                            }
                        }
                    }
                }
            }
        });
        let flatdata = [];
        let flatbg = [];
        let nextBgTile = (index) => {
            if (index === 0) {
                index = 225 + Math.floor(this.prng() * 16);
            }
            return index;
        };
        if (this.prng() > .5) {
            let bgPattern = [];
            nextBgTile = (index, x, y) => {
                if (bgPattern[y] === undefined) {
                    bgPattern[y] = [];
                }
                let bgOption;
                let {bgOptions, bgTypes} = this.bgPattern;
                if (x === 0 && y === 0) {
                    bgOption = bgOptions[0][0][0]
                } else if (y === 0) {
                    bgOption = bgOptions[1][0][bgPattern[0][x - 1].right];
                } else if (x === 0) {
                    bgOption = bgOptions[0][1][bgPattern[y - 1][0].down];
                } else {
                    bgOption = bgOptions[1][1][bgPattern[y][x - 1].right][bgPattern[y - 1][x].down];
                }
                let bgIndex = bgOption[Math.floor(this.prng() * bgOption.length)];
                bgPattern[y][x] = bgTypes[bgIndex];

                if (index === 0) {
                    index = 241 + bgIndex;
                }

                return index;
            };
        }

        let nextSolidTile = (x, y, w, h) => {
            let weight = 0;
            if (y === 0 || data[y - 1][x] === 1) {
                weight += 1;
            }
            if (x === (w - 1) || data[y][x + 1] === 1) {
                weight += 2;
            }
            if (y === (h - 1) || data[y + 1][x] === 1) {
                weight += 4;
            }
            if (x === 0 || data[y][x - 1] === 1) {
                weight += 8;
            }
            if (weight === 15) {
                if (y > 0 && x > 0 && data[y - 1][x - 1] !== 1) {
                    weight += 1;
                }
                if (y > 0 && x < (w - 1) && data[y - 1][x + 1] !== 1) {
                    weight += 2;
                }
                if (y < (h - 1) && x < (w - 1) && data[y + 1][x + 1] !== 1) {
                    weight += 3;
                }
                if (y < (h - 1) && x > 0  && data[y + 1][x - 1] !== 1) {
                    weight += 4;
                }
            }
            let tile = weight + 1;
            if (weight === 15) {
                tile = 21 + Math.floor(this.prng() * 12);
            }
            return tile;
        };

        //if (this.prng() > .5) {
        if (true) {
            let rightStops = [1, 2, 5, 6, 9, 10, 13, 14];
            let rightExtends = [5, 6, 13, 14, 18];
            let bottomStops = [1, 2, 3, 4, 9, 10, 11, 12];
            let bottomExtends = [3, 4, 11, 12, 18];
            let treshOne = Math.min(this.prng(), .2);
            let treshTwo = Math.min(this.prng(), .2);
            nextSolidTile = (x, y, w, h, j) => {
                let weight = 0;
                if (y === 0 || (data[y - 1][x] === 1
                    && bottomStops.indexOf(flatdata[j - w]) === -1)) {
                    weight += 1;
                }
                if (x === (w - 1) || (data[y][x + 1] === 1
                    && (this.prng() > treshOne || (y > 0 && bottomStops.indexOf(flatdata[j - w]) === -1)) && !(y > 0 && rightExtends.indexOf(flatdata[j - w]) > -1))) {
                    weight += 2;
                }
                if (y === (h - 1) || (data[y + 1][x] === 1
                    && (this.prng() > treshTwo || (x > 0 && rightStops.indexOf(flatdata[j - 1]) === -1)) && !(x > 0 && bottomExtends.indexOf(flatdata[j - 1]) > -1))) {
                    weight += 4;
                }
                if (x === 0 || (data[y][x - 1] === 1
                    && rightStops.indexOf(flatdata[j - 1]) === -1)) {
                    weight += 8;
                }
                if (weight === 15) {
                    if (y > 0 && x > 0 && (data[y - 1][x - 1] !== 1
                        || rightStops.indexOf(flatdata[j - w - 1]) > -1)) {
                        weight += 1;
                    }
                    if (y > 0 && x < (w - 1) && (data[y - 1][x + 1] !== 1
                        || rightExtends.indexOf(flatdata[j - w]) > -1)) {
                        weight += 2;
                    }
                    if (y < (h - 1) && x < (w - 1) && (data[y + 1][x + 1] !== 1)) {
                        weight += 3;
                    }
                    if (y < (h - 1) && x > 0  && (data[y + 1][x - 1] !== 1
                        || bottomExtends.indexOf(flatdata[j - 1]) > -1)) {
                        weight += 4;
                    }
                }
                let tile = weight + 1;
                if (weight === 15) {
                    tile = 21 + Math.floor(this.prng() * 12);
                }
                return tile;
            };
        }

        let nextSpikeTile = (x, y, w, h) => {
            let weight = 0;
            if (y === 0 || data[y - 1][x] === 1 || data[y - 1][x] === 193) {
                weight += 1;
            }
            if (x === (w - 1) || data[y][x + 1] === 1 || data[y][x + 1] === 193) {
                weight += 2;
            }
            if (y === (h - 1) || data[y + 1][x] === 1 || data[y + 1][x] === 193) {
                weight += 4;
            }
            if (x === 0 || data[y][x - 1] === 1 || data[y][x - 1] === 193) {
                weight += 8;
            }
            if (weight === 15) {
                if (y > 0 && x > 0 && data[y - 1][x - 1] !== 1 && data[y - 1][x - 1] !== 193) {
                    weight += 1;
                }
                if (y > 0 && x < (w - 1) && data[y - 1][x + 1] !== 1 && data[y - 1][x + 1] !== 193) {
                    weight += 2;
                }
                if (y < (h - 1) && x < (w - 1) && data[y + 1][x + 1] !== 1 && data[y + 1][x + 1] !== 193) {
                    weight += 3;
                }
                if (y < (h - 1) && x > 0 && data[y + 1][x - 1] !== 1 && data[y + 1][x - 1] !== 193) {
                    weight += 4;
                }
            }
            if ([7, 11, 13, 14].indexOf(weight) > -1) {
                weight = weight + (Math.round(this.prng()) * 16);
            }
            let tile = weight + 193;
            return tile;
        };

        let j = 0;

        let recurs = (x, sY, supportTile) => {
            while(sY < h && (data[sY][x] !== 1 && data[sY][x] !== 65)) {
                bg[sY][x] = supportTile;
                if (supportTile !== 36 && x > 0
                    && bg[sY][x - 1] === 0
                    && (sY === 0 || data[sY - 1][x - 1] === 1)
                ) {
                    recurs(x - 1, sY, 36);
                }
                if (supportTile !== 38 && x < (w - 1)
                    && bg[sY][x + 1] === 0
                    && (sY === 0 || data[sY - 1][x + 1] === 1)
                ) {
                    recurs(x + 1, sY, 38);
                }
                sY = sY + 1;
            }
        };

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                let tile = data[y][x];
                let bgTile = bg[y][x];

                /*
                // extend ladders from the map on top or the map below
                //14, 15, 16, 17, 46, 47, 48, 49, 78, 79, 80, 81, 110, 111, 112, 113, 142, 143, 144, 145, 174, 175, 176, 177, 206, 207, 208, 209, 238, 239, 240, 241
                if (y === 0 && tile === 0) {
                    let cel = maze[map.y][map.x + Math.floor(x / shardW)];
                    if (cel.top === false && map.y > 0) {
                        let topCel = maze[map.y - 1][map.x + Math.floor(x / shardW)];

                        if (topCel.k === 'c') {
                            tile = 73;
                            if ([14, 46, 78, 110, 142, 174, 206, 238].indexOf(x) > -1) {
                                let sX = x;
                                while(sX < x + 4) {
                                    let sY = y;
                                    while(sY < h && data[sY][sX] === 0) {
                                        data[sY][sX] = tile;
                                        sY = sY + 1;
                                    }
                                    sX = sX + 1;
                                }
                            }
                        }
                    }
                }
                if (y === h - 8 && tile === 0) {
                    let cel = maze[map.y + map.h - 1][map.x + Math.floor(x / shardW)];
                    if (cel.bottom === false) {
                        let bottomCel = maze[map.y + map.h][map.x + Math.floor(x / shardW)];

                        if (bottomCel !== undefined && bottomCel.k === 'c') {
                            //console.log('found');
                            if ([14, 46, 78, 110, 142, 174, 206, 238].indexOf(x) > -1) {
                                tile = 73;
                                let sX = x;
                                while(sX < x + 8) {
                                    let sY = y;
                                    while(sY < h && [0, 65, 149].indexOf(data[sY][sX]) > -1) {
                                        data[sY][sX] = tile;
                                        sY = sY + 1;
                                    }
                                    sX = sX + 1;
                                }
                            }
                        }
                    }
                }
                */

                // fill support tiles
                if (y === 0 && (tile === 0 || tile === 73)) {
                    let cel = maze[map.y][map.x + Math.floor(x / shardW)];
                    if (cel.top === false && map.y > 0) {
                        let topCel = maze[map.y - 1][map.x + Math.floor(x / shardW)];
                        if (topCel.k === 't') {
                            if ([14, 46, 78, 110, 142, 174, 206, 238].indexOf(x) > -1) {
                                recurs(x, y, 36);
                                bgTile = 36;
                            }
                            if ([16, 48, 80, 112, 144, 176, 208, 240].indexOf(x) > -1) {
                                recurs(x, y, 37);
                                bgTile = 37;
                            }
                        }
                    }
                }

                //autotiling oneSided
                if (tile === 65) {
                    tile = 33;
                    let supportTile = 36;
                    if (x === 0 || data[y][x - 1] === 65 || bg[y][x - 1] === 38) {
                        tile += 1;
                        supportTile += 1;
                    }
                    if (x !== (w - 1) && (data[y][x + 1] === 0 && bg[y][x + 1] !== 36) || bg[y][x + 1] === 37 || data[y][x + 1] === 1 || bg[y][x + 1] === 38) {
                        tile += 1;
                        supportTile += 1;
                    }
                    recurs(x, y + 1, supportTile);
                }

                // autotiling (solid)
                if (tile === 1) {
                    tile = nextSolidTile(x, y, w, h, j);
                }

                // autotiling (spikes)
                if (tile === 193) {
                    tile = nextSpikeTile(x, y, w, h, j);
                }

                // autotiling (climbable)
                if (tile === 73) {
                    let weight = 0;
                    if (y === 0 || data[y - 1][x] === 73) {
                        weight += 1;
                    }
                    if (x === (w - 1) || data[y][x + 1] === 73) {
                        weight += 2;
                    }
                    if (y === (h - 1) || data[y + 1][x] === 73 || data[y + 1][x] === 1) {
                        weight += 4;
                    }
                    if (x === 0 || data[y][x - 1] === 73) {
                        weight += 8;
                    }
                    if (weight === 15) {
                        if (y > 0 && x > 0 && data[y - 1][x - 1] !== 73) {
                            weight += 1;
                        }
                        if (y > 0 && x < (w - 1) && data[y - 1][x + 1] !== 73) {
                            weight += 2;
                        }
                        if (y < (h - 1) && x < (h - 1) && data[y + 1][x + 1] !== 73) {
                            weight += 3;
                        }
                        if (y < (h - 1) && x > 0  && data[y + 1][x - 1] !== 73) {
                            weight += 4;
                        }
                    }
                    tile = weight + 73;
                    if (weight === 15) {
                        tile = 93 + Math.floor(this.prng() * 4);
                    }
                }
                // assign tile
                flatdata[j] = tile;
                flatbg[j] = nextBgTile(bgTile, x, y);
                j++;
            }
        }
        //console.log(logX);
        return {tiledata: flatdata, bgdata: flatbg};
    }

    shuffleArray(arr) {
        let newArr = [];
        let oldArr = [...arr];
        while (oldArr.length) {
            newArr.push(oldArr.splice(
                Math.floor(this.prng() * oldArr.length),
                1
            )[0]);
        }
        return newArr;
    }

    createColorScheme() {
        let bgHue = this.prng();
        let sat = (7 + Math.floor(this.prng() * 20)) / 100;
        let bg = new Phaser.Display.Color.HSLToColor(
            bgHue,
            sat,
            .80
        );
        let toppingHue = bgHue + 1/3;
        if (toppingHue > 1) {
            toppingHue = toppingHue - 1;
        }
        let topping = new Phaser.Display.Color.HSLToColor(
            toppingHue,
            sat,
            .65
        );
        let spikesHue = toppingHue + 1/12;
        if (spikesHue > 1) {
            spikesHue = spikesHue - 1;
        }
        let spikes = new Phaser.Display.Color.HSLToColor(
            spikesHue,
            .07,
            .95
        );
        let solidHue = toppingHue + 1/3 + 1/24;
        if (solidHue > 1) {
            solidHue = solidHue - 1;
        }
        let solid = new Phaser.Display.Color.HSLToColor(
            solidHue,
            sat,
            .65
        );
        let upHue = solidHue - 1/12;
        if (upHue < 0) {
            upHue = upHue + 1;
        }
        let up = new Phaser.Display.Color.HSLToColor(
            upHue,
            sat,
            .70
        );
        return {
            bg,
            topping,
            solid,
            up,
            climb: topping,
            swim: topping,
            spikes,
            falling: topping
        };
    }
}


export default MazePlugin;
