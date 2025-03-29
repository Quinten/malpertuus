const cInnerR = 8;
const cOuterR = 48;
const cTotalR = cInnerR + cOuterR;

class Cursors extends Phaser.GameObjects.Sprite {

    constructor(scene, x, y) {
        super(scene, x, y, 'cursors', 0);
        scene.add.existing(this);
        this.scene.events.on('touchstart', goPointer => {
            if (goPointer.x < this.x - cTotalR || goPointer.y < this.y - cTotalR || goPointer.x > this.x + cTotalR || goPointer.y > this.y + cTotalR) {
                return;
            }
            let left = (goPointer.x < this.x - cInnerR);
            let up = (goPointer.y < this.y - cInnerR);
            let right = (goPointer.x > this.x + cInnerR);
            let down = (goPointer.y > this.y + cInnerR);
            let f = 0;
            if (left) {
                f += 6;
                this.emulateEvent('left', 'down');
            }
            if (up) {
                f += 1;
                this.emulateEvent('up', 'down');
            }
            if (right) {
                f += 3;
                this.emulateEvent('right', 'down');
            }
            if (down) {
                f += 2;
                this.emulateEvent('down', 'down');
            }
            this.setFrame(f);
            let moveListener = movePointer => {
                if (movePointer !== goPointer) {
                    return;
                }
                let mLeft = (movePointer.x < this.x - cInnerR);
                let mUp = (movePointer.y < this.y - cInnerR);
                let mRight = (movePointer.x > this.x + cInnerR);
                let mDown = (movePointer.y > this.y + cInnerR);
                let mf = 0;
                if (mLeft) {
                    mf += 6;
                    if (!left) {
                        this.emulateEvent('left', 'down');
                    }
                } else {
                    if (left) {
                        this.emulateEvent('left', 'up');
                    }
                }
                if (mUp) {
                    mf += 1;
                    if (!up) {
                        this.emulateEvent('up', 'down');
                    }
                } else {
                    if (up) {
                        this.emulateEvent('up', 'up');
                    }
                }
                if (mRight) {
                    mf += 3;
                    if (!right) {
                        this.emulateEvent('right', 'down');
                    }
                } else {
                    if (right) {
                        this.emulateEvent('right', 'up');
                    }
                }
                if (mDown) {
                    mf += 2;
                    if (!down) {
                        this.emulateEvent('down', 'down');
                    }
                } else {
                    if (down) {
                        this.emulateEvent('down', 'up');
                    }
                }
                this.setFrame(mf);
                left = mLeft;
                up = mUp;
                right = mRight;
                down = mDown;
            };
            let upListener = upPointer => {
                if (upPointer !== goPointer) {
                    return;
                }
                this.setFrame(0);
                if (left) {
                    this.emulateEvent('left', 'up');
                }
                if (up) {
                    this.emulateEvent('up', 'up');
                }
                if (right) {
                    this.emulateEvent('right', 'up');
                }
                if (down) {
                    this.emulateEvent('down', 'up');
                }
                this.scene.events.off('touchend', upListener);
                this.scene.events.off('touchmove', moveListener);
            };
            this.scene.events.on('touchend', upListener);
            this.scene.events.on('touchmove', moveListener);
        });
    }

    emulateEvent(key, e) {
        this.scene.scene.manager.scenes.forEach(scene => {
            if (scene.controls.active) {
                scene.controls.events.emit('any' + e);
                scene.controls.cursors[key] = (e === 'down');
                scene.controls.events.emit(key + e);
            }
        });
    }
}

class EscButton extends Phaser.GameObjects.Sprite {

    constructor(scene, x, y) {
        super(scene, x, y, 'esc_button', 0);
        this.setInteractive();
        scene.add.existing(this);
        this.on('pointerdown', goPointer => {
            this.setFrame(1);
            this.emulateEvent('esc', 'down');
            let listener = pointer => {
                if (pointer !== goPointer) {
                    return;
                }
                this.setFrame(0);
                this.emulateEvent('esc', 'up');
                this.scene.input.off('pointerup', listener);
            };
            this.scene.input.on('pointerup', listener);
        });
    }

    emulateEvent(key, e) {
        this.scene.scene.manager.scenes.forEach(scene => {
            if (scene.controls.active) {
                scene.controls.events.emit('any' + e);
                scene.controls[key + 'Down'] = (e === 'down');
                scene.controls.events.emit(key + e);
            }
        });
    }
}

class LetterButton extends Phaser.GameObjects.Sprite {

    constructor(scene, x, y, nFrame, key) {
        super(scene, x, y, 'letter_button', nFrame);
        this.nFrame = nFrame;
        this.key = key;
        scene.add.existing(this);
        this.scene.events.on('touchstart', goPointer => {
            if (goPointer.x < this.x - (this.width / 2 + 7) || goPointer.x > this.x + (this.width / 2 + 7) || goPointer.y < this.y - (this.height / 2 + 7) || goPointer.y > this.y + (this.height / 2 + 7)) {
                return;
            }
            this.setFrame(this.nFrame + 4);
            this.emulateEvent(this.key, 'down');
            let listener = pointer => {
                if (pointer !== goPointer) {
                    return;
                }
                this.setFrame(this.nFrame);
                this.emulateEvent(this.key, 'up');
                this.scene.events.off('touchend', listener);
            };
            this.scene.events.on('touchend', listener);
        });
    }

    emulateEvent(key, e) {
        this.scene.scene.manager.scenes.forEach(scene => {
            if (scene.controls.active) {
                scene.controls.events.emit('any' + e);
                scene.controls[key + 'Down'] = (e === 'down');
                scene.controls.events.emit(key + e);
            }
        });
    }
}

const useA = true;
const useB = false;
const useX = false;
const useY = false;

class VisualMobileControls extends Phaser.Scene {

    constructor (config)
    {
        super((config) ? config : { key: 'visualmobilecontrols', active: false, visible: false });
    }

    create()
    {
        this.cameras.main.setRoundPixels(true);

        this.oneDown = false;
        this.twoDown = false;

        this.input.addPointer(1);

        this.cursors = new Cursors(this, 0, 0);
        this.cursorsOffset = {x: 48, y: 64};

        this.escButton = new EscButton(this, 0, 0);

        if (useA) {
            this.aButton = new LetterButton(this, 0, 0, 0, 'a');
            this.aButtonOffset = {x: 48, y: 64};
        }
        if (useB) {
            this.bButton = new LetterButton(this, 0, 0, 1, 'b');
            this.bButtonOffset = {x: 88, y: 48};
        }
        if (useX) {
            this.xButton = new LetterButton(this, 0, 0, 2, 'x');
            this.xButtonOffset = {x: 88, y: 88};
        }
        if (useY) {
            this.yButton = new LetterButton(this, 0, 0, 3, 'y');
            this.yButtonOffset = {x: 48, y: 104};
        }

        this.rearranging = false;

        this.resizeField(this.scale.width, this.scale.height);
    }

    update()
    {
        if (this.rearranging)
        {
            return;
        }
        if (this.input.pointer1.isDown)
        {
            if (!this.oneDown)
            {
                this.events.emit('touchstart', this.input.pointer1);
            } else {
                this.events.emit('touchmove', this.input.pointer1);
            }
            this.oneDown = true;
        } else {
            if (this.oneDown)
            {
                this.events.emit('touchend', this.input.pointer1);
            }
            this.oneDown = false;
        }
        if (this.input.pointer2.isDown)
        {
            if (!this.twoDown)
            {
                this.events.emit('touchstart', this.input.pointer2);
            } else {
                this.events.emit('touchmove', this.input.pointer2);
            }
            this.twoDown = true;
        } else {
            if (this.twoDown)
            {
                this.events.emit('touchend', this.input.pointer2);
            }
            this.twoDown = false;
        }
    }

    resizeField(w, h)
    {
        this.cursors.x = this.cursorsOffset.x;
        this.cursors.y = h - this.cursorsOffset.y;
        this.escButton.x = w - 24;
        this.escButton.y = 24;
        if (this.aButton) {
            this.aButton.x = w - this.aButtonOffset.x;
            this.aButton.y = h - this.aButtonOffset.y;
        }
        if (this.bButton) {
            this.bButton.x = w - this.bButtonOffset.x;
            this.bButton.y = h - this.bButtonOffset.y;
        }
        if (this.xButton) {
            this.xButton.x = w - this.xButtonOffset.x;
            this.xButton.y = h - this.xButtonOffset.y;
        }
        if (this.yButton) {
            this.yButton.x = w - this.yButtonOffset.x;
            this.yButton.y = h - this.yButtonOffset.y;
        }
    }

    startRearrange()
    {
        this.rearranging = true;
        this.cursors.setInteractive({ draggable: true });
        this.cursors.on('drag', (pointer, dragX, dragY) => {
            this.cursors.x = dragX;
            this.cursors.y = dragY;
            this.cursorsOffset.x = this.cursors.x;
            this.cursorsOffset.y = this.scale.height - this.cursors.y;
        });
        if (this.aButton) {
            this.aButton.setInteractive({ draggable: true });
            this.aButton.on('drag', (pointer, dragX, dragY) => {
                this.aButton.x = dragX;
                this.aButton.y = dragY;
                this.aButtonOffset.x = this.scale.width - this.aButton.x;
                this.aButtonOffset.y = this.scale.height - this.aButton.y;
            });
        }
        if (this.bButton) {
            this.bButton.setInteractive({ draggable: true });
            this.bButton.on('drag', (pointer, dragX, dragY) => {
                this.bButton.x = dragX;
                this.bButton.y = dragY;
                this.bButtonOffset.x = this.scale.width - this.bButton.x;
                this.bButtonOffset.y = this.scale.height - this.bButton.y;
            });
        }
        if (this.xButton) {
            this.xButton.setInteractive({ draggable: true });
            this.xButton.on('drag', (pointer, dragX, dragY) => {
                this.xButton.x = dragX;
                this.xButton.y = dragY;
                this.xButtonOffset.x = this.scale.width - this.xButton.x;
                this.xButtonOffset.y = this.scale.height - this.xButton.y;
            });
        }
        if (this.yButton) {
            this.yButton.setInteractive({ draggable: true });
            this.yButton.on('drag', (pointer, dragX, dragY) => {
                this.yButton.x = dragX;
                this.yButton.y = dragY;
                this.yButtonOffset.x = this.scale.width - this.yButton.x;
                this.yButtonOffset.y = this.scale.height - this.yButton.y;
            });
        }
    }

    stopRearrange()
    {
        this.rearranging = false;
        this.cursors.disableInteractive();
        if (this.aButton) {
            this.aButton.disableInteractive();
        }
        if (this.bButton) {
            this.bButton.disableInteractive();
        }
        if (this.xButton) {
            this.xButton.disableInteractive();
        }
        if (this.yButton) {
            this.yButton.disableInteractive();
        }
    }
}

export default VisualMobileControls;
