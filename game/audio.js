/* Gobble Dash — sound.js: tiny WebAudio synth. No audio files, no network.
   Every effect is built from oscillators + noise, composed on the fly. */
(function () {
  'use strict';

  var ctx = null;
  var muted = false;
  var musicTimer = null;
  var musicStep = 0;

  // A cheerful autumn fiddle-ish loop, one note at a time.
  var MELODY = [
    392, 0, 440, 523, 587, 523, 440, 392,
    330, 0, 392, 440, 494, 440, 392, 330,
    294, 0, 330, 392, 440, 392, 330, 294,
    262, 294, 330, 0, 392, 0, 330, 0
  ];

  function audioContext() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, when, slideTo) {
    var ac = audioContext();
    if (!ac || muted) return;
    var t0 = ac.currentTime + (when || 0);
    var osc = ac.createOscillator();
    var gain = ac.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol || 0.18, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noiseBurst(dur, vol, lowpass) {
    var ac = audioContext();
    if (!ac || muted) return;
    var t0 = ac.currentTime;
    var len = Math.floor(ac.sampleRate * dur);
    var buf = ac.createBuffer(1, len, ac.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = ac.createBufferSource();
    src.buffer = buf;
    var filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass || 1200;
    var gain = ac.createGain();
    gain.gain.setValueAtTime(vol || 0.2, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    src.start(t0);
  }

  function gobble() {
    // The turkey's signature: three quick descending clucks.
    tone(520, 0.07, 'square', 0.10, 0, 380);
    tone(460, 0.07, 'square', 0.10, 0.09, 340);
    tone(400, 0.10, 'square', 0.12, 0.18, 280);
  }

  function jumpSound() { tone(280, 0.18, 'sine', 0.16, 0, 620); }
  function slideSound() { noiseBurst(0.16, 0.10, 900); }
  function cornSound() { tone(880, 0.08, 'triangle', 0.16); tone(1320, 0.12, 'triangle', 0.12, 0.06); }
  function thudSound() { noiseBurst(0.22, 0.28, 500); tone(140, 0.22, 'sawtooth', 0.18, 0, 70); }
  function spottedSound() { tone(700, 0.09, 'square', 0.14, 0, 900); tone(900, 0.09, 'square', 0.14, 0.10, 1100); }
  function fanfareSound() {
    var notes = [523, 659, 784, 1047];
    for (var i = 0; i < notes.length; i++) tone(notes[i], 0.22, 'triangle', 0.18, i * 0.13);
    tone(1319, 0.5, 'triangle', 0.16, 0.55);
  }
  function caughtSound() {
    var notes = [392, 370, 349, 311];
    for (var i = 0; i < notes.length; i++) tone(notes[i], 0.3, 'sawtooth', 0.12, i * 0.22);
  }

  function startMusic() {
    if (musicTimer || muted) return;
    musicTimer = setInterval(function () {
      var note = MELODY[musicStep % MELODY.length];
      musicStep++;
      if (note) tone(note, 0.22, 'triangle', 0.05);
    }, 170);
  }

  function stopMusic() {
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  }

  function toggleMute() {
    muted = !muted;
    if (muted) stopMusic();
    return muted;
  }

  window.GobbleSound = {
    unlock: audioContext,
    gobble: gobble,
    jump: jumpSound,
    slide: slideSound,
    corn: cornSound,
    thud: thudSound,
    spotted: spottedSound,
    fanfare: fanfareSound,
    caught: caughtSound,
    startMusic: startMusic,
    stopMusic: stopMusic,
    toggleMute: toggleMute,
    isMuted: function () { return muted; }
  };
})();
