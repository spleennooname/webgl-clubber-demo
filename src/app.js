'use strict';

import './js/raf.js';

import './styles/styles.scss';

import vs from './glsl/vert.glsl';
import fs from './glsl/frag.glsl';
import ps from './glsl/post.glsl';

// import Clubber from 'clubber';
// import { AudioContext } from 'standardized-audio-context';
import GPUTools from './GPUTools';
/* import IosUnlock from './iosUnlock'; */

//import webAudioTouchUnlock from './webAudioTouchUnlock';

import { TweenMax } from 'gsap';
import * as twgl from 'twgl.js';

const IS_LOG = true;

let canvas,
  gl,
  positionBuffer,
  iosUnlock,
  rafID = -1,
  source,
  gpuTools,
  pixelRatio = 0,
  displayWidth,
  displayHeight,
  audioContext,
  analyser,
  programInfo,
  stats,
  numPoints,
  heightArray,
  state;

let now = 0,
  t = 0,
  then = 0,
  fps = 60,
  interval = 1000 / fps;

let bufferSize = 512;

const tracks = ['577151343', '396848079', '92039697'];

let cover,
  audio,
  clubber,
  bands = {},
  iMusicSub = [0.0, 0.0, 0.0, 0.0],
  iMusicLow = [0.0, 0.0, 0.0, 0.0],
  iMusicMid = [0.0, 0.0, 0.0, 0.0],
  iMusicHigh = [0.0, 0.0, 0.0, 0.0];

const CLIENT_ID = '56c4f3443da0d6ce6dcb60ba341c4e8d';

function demo() {
  // canvas
  canvas = document.querySelector('#canvas');

  try {
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  } catch (err) {
    console.warn('no WebGL in da house.');
    return;
  }

  if (!gl) {
    throw 'no WebGL in da house.';
    return;
  }

  // audio el
  audio = document.querySelector('#audio');
  audio.crossOrigin = 'anonymous';
  audio.loop = true;
  audio.volume = 0;

  canvas.addEventListener('webglcontextlost', lost, false);
  canvas.addEventListener('webglcontextrestored', restore, false);

  // device pointers
  /* canvas.addEventListener('mousemove', setPos, false);
  canvas.addEventListener('mouseleave', () => {
    mouse = [0.5, 0.5];
  });
  canvas.addEventListener('mousedown', e => {
    console.log(e);
  });
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('touchstart', setTouch, { passive: false });
  canvas.addEventListener('touchmove', setTouch, { passive: false }); */
  // cover click
  cover = document.querySelector('.cover');
  cover.addEventListener('click', event => {
    start();
  });

  initGL();
  //gl.getExtension('WEBGL_lose_context').restoreContext();
  //gl.getExtension('WEBGL_lose_context').loseContext();
}

function initGL() {
  gpuTools = new GPUTools();

  const gpu = gpuTools.getBestGPUSettings();
  bufferSize = gpu.bufferSize;
  fps = 50; //gpu.fps; try max fps
  pixelRatio = gpu.ratio;

  interval = 1000 / fps;

  stats = new Stats();
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.domElement);

  gl = twgl.getContext(canvas, { depth: false, antialiasing: true });

  programInfo = twgl.createProgramInfo(gl, [vs, fs]);

  positionBuffer = twgl.createBufferInfoFromArrays(gl, {
    position: { data: [-1, -1, -1, 4, 4, -1], numComponents: 2 },
  });

  gl.useProgram(programInfo.program);
  twgl.setBuffersAndAttributes(gl, programInfo, positionBuffer);
}

function run() {
  now = window.performance.now();
  let delta = now - then;
  if (delta > interval) {
    then = now - (delta % interval);
    let t = now / 1000;
    stats.begin();
    render(t);
    stats.end();
  }
  rafID = requestAnimationFrame(run);
}

function resize() {
  // Lookup the size the browser is displaying the canvas in CSS pixels
  // and compute a size needed to make our drawingbuffer match it in
  // device pixels.
  //const aspectRatio = window.innerWidth / window.innerHeight;
  //console.log( aspectRatio)
  displayWidth = bufferSize; //Math.floor(canvas.clientWidth * pixelRatio);
  displayHeight = bufferSize; //Math.floor(canvas.clientHeight * pixelRatio);
  // Check if the canvas is not the same size.
  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    // Make the canvas the same size
    canvas.width = displayHeight;
    canvas.height = displayHeight;
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  }
}

function render(time) {
  /*   if (audio.readyState !== 4) {
    return;
  } */

  resize();

  analyser.getByteFrequencyData(heightArray);

  if (clubber) {
    clubber.update(null, heightArray, false);

    bands.low(iMusicLow);
    bands.sub(iMusicSub);
    bands.high(iMusicHigh);
    bands.mid(iMusicMid);
  }

  twgl.setUniforms(programInfo, {
    iMusicSub: iMusicSub,
    iMusicLow: iMusicLow,
    iMusicMid: iMusicMid,
    iMusicHigh: iMusicHigh,
    iGlobalTime: time,
    iResolution: [displayWidth, displayHeight],
  });
  twgl.bindFramebufferInfo(gl, null);
  twgl.drawBufferInfo(gl, positionBuffer, gl.TRIANGLES);

  if (IS_LOG) {
    document.querySelector('.log').innerHTML =
      'devicePixelRatio=' +
      window.devicePixelRatio +
      ' tier=' +
      gpuTools.gpuTier.levelTier +
      ' type=' +
      gpuTools.gpuTier.type +
      '<br/>' +
      'applied: ' +
      'pixel ratio=' +
      pixelRatio +
      ', fps=' +
      fps +
      '<br/>' +
      '(' +
      window.innerWidth +
      ',' +
      window.innerHeight +
      ')' +
      '<br/>' +
      '(' +
      canvas.width +
      ',' +
      canvas.height +
      ')' +
      '<br/>' +
      '(bufferSize: ' +
      bufferSize +
      ')' +
      '<br/>' +
      analyser.frequencyBinCount +
      ':' +
      audioContext.state +
      '<br/>' +
      time;
    //'+<br/>' +
    //heightArray;
    //+ clubber.time;
  }
}

function stop() {
  rafID = cancelAnimationFrame(run);
}

function destroy() {
  stop();
}

function lost(e) {
  console.warn('lost');
  event.preventDefault();
  stop();
}

function restore(e) {
  console.warn('restored');
  demo();
}

function initAudio() {}

function start() {
  cover.removeEventListener('click', start);

  TweenMax.to(cover, 0.5, { autoAlpha: 0 });

  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();

  numPoints = analyser.frequencyBinCount;

  analyser.fftSize = 1024;
  heightArray = new Uint8Array(numPoints);
  //console.log(numPoints, heightArray);

  audio.addEventListener('canplay', event => {
    document.querySelector('.log').innerHTML += '<br/>set audiocontext on canplay';
    try {
      source = audioContext.createMediaElementSource(audio);
      source.connect(analyser);

      analyser.connect(audioContext.destination);

      clubber = new Clubber({
        context: audioContext,
        analyser: analyser,
      });

      bands = {
        sub: clubber.band({
          from: 1,
          to: 32,
          smooth: [0.1, 0.1, 0.1, 0.1],
          /* low: 64,
          high: 128, */
        }),

        low: clubber.band({
          from: 32,
          to: 48,
          smooth: [0.1, 0.1, 0.1, 0.1],
          /*  low: 64,
          high: 128, */
        }),

        mid: clubber.band({
          from: 48,
          to: 64,
          smooth: [0.1, 0.1, 0.1, 0.1],
          /*  low: 64,
          high: 128, */
        }),

        high: clubber.band({
          from: 64,
          to: 96,
          smooth: [0.1, 0.1, 0.1, 0.1],
          /* low: 64,
          high: 128, */
        }),
      };
    } catch (e) {
      console.log(e.toString());
    }
  });
  audio.addEventListener('error', function(e) {
    console.log(e.toString());
  });

  //audio.src = 'https://api.soundcloud.com/tracks/' + tracks[2] + '/stream?client_id=' + CLIENT_ID;
  //audio.src = 'https://greggman.github.io/doodles/sounds/DOCTOR VOX - Level Up.mp3';
  audio.src = 'mp3/Bagatelleop119n1.mp3';
  audio.play();

  TweenMax.to(audio, 3, { volume: 0.75 });
  then = window.performance.now();
  run();

  /*  webAudioTouchUnlock(audioContext).then(
    unlocked => {
      if (unlocked) {
        document.querySelector('.log').innerHTML += '<br/>ios: unlocked context ' + audioContext.state;
      } else {
        document.querySelector('.log').innerHTML += '<br/>no-ios: unlocked context ' + audioContext.state;
      }

      } catch (e) {
        document.querySelector('.log').innerHTML += '<br/>' + e.toString();
      }
    },
    reason => {
      document.querySelector('.log').innerHTML += '<br/>error: ' + reason.toString();
    }
  ); */
}

demo();
