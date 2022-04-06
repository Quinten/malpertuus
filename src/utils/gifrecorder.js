import icon from '../assets/game-icon.png';

let optionMap = {
    '55': {
        icon: true,
        width: 315,
        height: 250
    },
    '57': {
        icon: false,
        width: 420,
        height: 210
    },
    '48': {
        icon: false,
        width: 512,
        height: 512
    }
};

let isRecording = false;
let origCanvas;
let bufferCanvas;
let ctx;
let frameCount = 0;
let nFrames = 180;
let frameDelta = 0;
let frameDeltaMax = 30;
let gif;
let img;

let record = (options) => {
    if (isRecording) {
        return;
    }

    if (bufferCanvas !== undefined) {
        bufferCanvas.remove();
    }

    if (img !== undefined) {
        img.remove();
    }

    gif = new GIF({
        workers: 2,
        quality: 5
    });
    gif.on('finished', (blob) => {
        img = document.createElement('img');
        img.src = URL.createObjectURL(blob);
        img.style.position = 'fixed';
        img.style.top = 0;
        img.style.left = 0;
        img.style.display = 'block';
        document.querySelector('body').appendChild(img);
    });


    origCanvas = document.querySelector('canvas');
    bufferCanvas = document.createElement('canvas');
    bufferCanvas.width = options.width;
    bufferCanvas.height = options.height;
    ctx = bufferCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    bufferCanvas.style.imageRendering = 'pixelated';

    bufferCanvas.style.position = 'fixed';
    bufferCanvas.style.top = 0;
    bufferCanvas.style.left = 0;
    bufferCanvas.style.display = 'block';
    document.querySelector('body').appendChild(bufferCanvas);

    if (options.icon) {
        let iconImg = document.createElement('img');
        iconImg.onload = function () {
            gif.addFrame(iconImg, {
                copy: true,
                delay: 40
            });
            isRecording = true;
            frameCount = 0;
        };
        iconImg.src = icon;
    } else {
        isRecording = true;
        frameCount = 0;
    }
};

let capture = (renderer, time, delta) => {
    if (!isRecording) {
        return;
    }
    frameDelta = frameDelta + delta;
    if (frameDelta < frameDeltaMax) {
        return;
    }
    ctx.drawImage(origCanvas,
        Math.floor(origCanvas.width / 2 - bufferCanvas.width / 4),
        Math.floor(origCanvas.height / 2 - bufferCanvas.height / 4),
        Math.ceil(bufferCanvas.width / 2),
        Math.ceil(bufferCanvas.height / 2),
        0, 0,
        bufferCanvas.width,
        bufferCanvas.height
    );

    gif.addFrame(bufferCanvas, {
        copy: true,
        delay: frameDelta
    });

    frameDelta = 0;
    frameCount = frameCount + 1;
    if (frameCount >= nFrames) {
        isRecording = false;
        gif.render();
    }
};

let init = () => {
    window.addEventListener('keyup', (e) => {
        if (optionMap[String(e.keyCode)] !== undefined) {
            record(optionMap[String(e.keyCode)]);
        }
    });
};

export default Object.freeze({
    init,
    capture
});
