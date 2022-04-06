import seedrandom from 'seedrandom';

let notes = 'AbBCdDeEFgGa';

let playNote = (node, note, start, bpm = 120, shape = 'square') => {

    if (node.context.state === 'closed') {
        return;
    }

    let noteName = note.replace(/\d/g, '');
    let noteRate = note.match(/^\d+/g);
    noteRate = (noteRate) ? +noteRate[0] : 4;
    let octave = note.match(/\d+$/g);
    octave = (octave) ? +octave[0] : 4;

    let length = 15 / bpm * noteRate;

    let noteIndex = notes.indexOf(noteName);
    if (noteIndex === -1) {
        // a pause in between the notes
        return length;
    }

    let detune = noteIndex * 100 + 1200 * (octave - 4);

    let o = node.context.createOscillator();
    o.connect(node);

    o.frequency.value = 440;
    o.detune.value = detune;
    o.type = shape;

    node.gain.setValueAtTime(0, start);
    node.gain.linearRampToValueAtTime(0.2, start + length * 0.03);
    node.gain.setValueAtTime(0.2, start + length * 0.3);
    node.gain.linearRampToValueAtTime(0, start + length * 1.5);

    o.start(start);
    o.stop(start + length * 1.5);

    return length;
};

let lowPassFilter;
let startFrequency = 920;

let startMuffle = () => {
    if (lowPassFilter) {
        lowPassFilter.frequency.value = 280;
    }
    startFrequency = 280;
};

let stopMuffle = () => {
    if (lowPassFilter) {
        lowPassFilter.frequency.value = 920;
    }
    startFrequency = 920;
};

let playSong = (options = {}) => {

    let {melody, bass, bpm = 120, shuffle = false, seed = 'Born in the maze'} = options;

    if (shuffle) {
        rnd = seedrandom(seed);
        melody = shuffleArray(melody);
        bass = shuffleArray(bass);
    }

    let ctx = new AudioContext();

    let biquadFilter = ctx.createBiquadFilter();
    biquadFilter.connect(ctx.destination);
    biquadFilter.type = 'lowpass';
    biquadFilter.frequency.value = startFrequency;
    lowPassFilter = biquadFilter;

    let musicVolume = ctx.createGain();
    musicVolume.connect(biquadFilter);
    musicVolume.gain.value = 0.4;

    let delayEffect = ctx.createDelay(60 / bpm);
    delayEffect.delayTime.value = 60 / bpm;
    let delayVolume = ctx.createGain();
    delayVolume.gain.value = 0.15;
    delayVolume.connect(musicVolume);
    delayEffect.connect(delayVolume);

    let noteNodes = [0, 1, 2, 3, 4, 5, 6, 7].map(() => {
        let node = ctx.createGain();
        node.connect(musicVolume);
        node.connect(delayEffect);
        return node;
    });
    let index = 0;

    let nextNote = 0;
    let nextNoteTick = 0;

    let nextPluck = 0;
    let nextPluckTick = 0;

    let anticipate = 60 / bpm * 7;

    let scheduleNotes = () => {
        if (ctx.state === 'closed') {
            return;
        }
        if (ctx.currentTime > nextNoteTick + 1 || ctx.currentTime > nextPluckTick + 1) {
            nextNote = 0;
            nextPluck = 0;
            nextNoteTick = nextPluckTick = ctx.currentTime;
        }
        if (melody) {
            if (ctx.currentTime > nextNoteTick - anticipate) {
                let noteLength = playNote(noteNodes[index], melody[nextNote], nextNoteTick, bpm, 'square');
                index = (index + 1) % noteNodes.length;
                nextNote = (nextNote + 1) % melody.length;
                nextNoteTick += noteLength;
                if (shuffle) {
                    if (nextNote === 0) {
                        melody = shuffleArray(melody);
                    }
                }
            }
        }
        if (bass) {
            if (ctx.currentTime > nextPluckTick - anticipate) {
                let pluckLength = playNote(noteNodes[index], bass[nextPluck], nextPluckTick, bpm, 'triangle');
                index = (index + 1) % noteNodes.length;
                nextPluck = (nextPluck + 1) % bass.length;
                nextPluckTick += pluckLength;
                if (shuffle) {
                    if (nextPluck === 0) {
                        bass = shuffleArray(bass);
                    }
                }
            }
        }
        requestAnimationFrame(scheduleNotes);
    };
    scheduleNotes();

    return ctx;
};

let rnd = seedrandom('Born in the maze');

let shuffleArray = (arr) => {
    let newArr = [];
    let oldArr = [...arr];
    while (oldArr.length) {
        newArr.push(oldArr.splice(
            Math.floor(rnd() * oldArr.length),
            1
        )[0]);
    }
    return newArr;
};

export default Object.freeze({
    playSong,
    startMuffle,
    stopMuffle
});
