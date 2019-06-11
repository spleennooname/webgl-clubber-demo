'use strict';

import './js/raf.js';

import './styles/styles.scss';

import vs from './glsl/vert.glsl';
import fs from './glsl/frag.glsl';
import ps from './glsl/post.glsl';

import Clubber from 'clubber';
//import { AudioContext } from 'standardized-audio-context';
import GPUTools from './GPUTools';

import { TweenMax } from 'gsap';
import * as twgl from 'twgl.js';

const IS_LOG = false;

let canvas,
  gl,
  positionBuffer,
  iosUnlock,
  rafID = -1,
  fb1,
  fb2,
  tmp,
  texture,
  source,
  gpuTools,
  pixelRatio = 0,
  displayWidth,
  displayHeight,
  audioContext,
  analyser,
  programInfo,
  postInfo,
  stats,
  numPoints,
  frequencyData,
  state;

let now = 0,
  t = 0,
  then = 0,
  fps = 60,
  interval = 1000 / fps;

let bufferSize = 512;

const tracks = [
  '310025963', // unkle remix
  '80365115', // kraftw
  '577151343',
  '396848079',
  '92039697',
];

let cover,
  audio,
  clubber,
  bands = {},
  iMusicSub = [0.0, 0.0, 0.0, 0.0],
  iMusicLow = [0.0, 0.0, 0.0, 0.0],
  iMusicMid = [0.0, 0.0, 0.0, 0.0],
  iMusicHigh = [0.0, 0.0, 0.0, 0.0],
  smoothArray = [.1, .1, .1, .1],
  adaptArray = [0.5, .6, 1, 1];

const CLIENT_ID = '56c4f3443da0d6ce6dcb60ba341c4e8d';

/**
                      +1
                      |
                      |
                      |
                      |
                      |
  -1 ------------------------------------ +1
                      |
                      |
                      |
                      |
                      |
                      -1
  */
const plane = {
  data: [-1, -1, 0, +1, -1, 0, -1, +1, 0, -1, +1, 0, +1, -1, 0, +1, +1, 0],
  numComponents: 3,
};

const bigTriangle = {
  data: [-1, -1, -1, 4, 4, -1],
  numComponents: 2,
};

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

  // cover click
  cover = document.querySelector('.cover');
  TweenMax.to(cover.querySelector('.t'), 3.0, { autoAlpha: 1 });
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
  fps = 60; //gpu.fps; try max fps
  pixelRatio = gpu.ratio;

  interval = 1000 / fps;

  /*  stats = new Stats();
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.domElement); */

  gl = twgl.getContext(canvas, { antialiasing: true });

  fb1 = twgl.createFramebufferInfo(gl, null, bufferSize, bufferSize);
  fb2 = twgl.createFramebufferInfo(gl, null, bufferSize, bufferSize);

  programInfo = twgl.createProgramInfo(gl, [vs, fs]);
  postInfo = twgl.createProgramInfo(gl, [vs, ps]);

  positionBuffer = twgl.createBufferInfoFromArrays(gl, {
    position: bigTriangle,
  });
}

function run() {
  now = window.performance.now();
  let delta = now - then;
  if (delta > interval) {
    then = now - (delta % interval);
    let t = now / 1000;
    //stats.begin();
    render(t);
    //stats.end();
  }
  rafID = requestAnimationFrame(run);
}

function resize() {
  // Lookup the size the browser is displaying the canvas in CSS pixels
  // and compute a size needed to make our drawingbuffer match it in
  // device pixels.
  //const aspectRatio = window.innerWidth / window.innerHeight;
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

  // copy current frequency dta from analyser to frequencyData array
  // values are in dB units 0..255
  // https://webaudio.github.io/web-audio-api/#dom-analysernode-getbytefrequencydata
  // https://stackoverflow.com/questions/14789283/what-does-the-fft-data-in-the-web-audio-api-correspond-to

  // db = energia su unita di tempo
  // 10.log( p/p0)^2
  analyser.getByteFrequencyData(frequencyData);

  if (clubber) {
    clubber.update(null, frequencyData, false);
    bands.low(iMusicLow);
    bands.sub(iMusicSub);
    bands.high(iMusicHigh);
    bands.mid(iMusicMid);
  }

  gl.useProgram(programInfo.program);
  twgl.setBuffersAndAttributes(gl, programInfo, positionBuffer);
  twgl.setUniforms(programInfo, {
    iMusicSub: iMusicSub,
    iMusicLow: iMusicLow,
    iMusicMid: iMusicMid,
    iMusicHigh: iMusicHigh,
    iGlobalTime: time,
    uTexture: fb1.attachments[0], //1st initially empty
    iResolution: [displayWidth, displayHeight],
  });
  twgl.bindFramebufferInfo(gl, fb2);
  twgl.drawBufferInfo(gl, positionBuffer, gl.TRIANGLES);

  // draw fb2 in canvas
  gl.useProgram(postInfo.program);
  twgl.setBuffersAndAttributes(gl, postInfo, positionBuffer);
  twgl.setUniforms(postInfo, {
    uTime: time,
    uResolution: [displayWidth, displayHeight],
    uTexture: fb2.attachments[0],
  });
  twgl.bindFramebufferInfo(gl, null);
  twgl.drawBufferInfo(gl, positionBuffer, gl.TRIANGLES);

  // ping-pong buffers
  tmp = fb1;
  fb1 = fb2;
  fb2 = tmp;

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
      time +
      '<br/>';
    //'+<br/>' +
    //frequencyData;
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
  analyser.fftSize = 2048;
  // bins frequency from anal. half fft size 2048 / 2
  numPoints = analyser.frequencyBinCount;

  frequencyData = new Uint8Array(numPoints);
  // 2^8 = 0..255
  //console.log(numPoints, frequencyData);

  audio.addEventListener('canplay', event => {
    //document.querySelector('.log').innerHTML += '<br/>set audiocontext on canplay';
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
          template: '0123',
          from: 1,
          to: 32,
         /*  low: 1,
          high: 127, */
          smooth: smoothArray,
          adapt: adaptArray,
        }),

        low: clubber.band({
          template: '0123',
          from: 33,
          to: 48,
          /* low: 1,
          high:127, */
          smooth: smoothArray,
          adapt: adaptArray,
        }),

        mid: clubber.band({
          template: '0123',
          from: 49,
          to: 64,
         /*  low: 1,
          high: 127, */
          smooth: smoothArray,
          adapt: adaptArray,
        }),

        high: clubber.band({
          template: '0123',
          from: 65,
          to: 127,
          /* low: 1,
          high: 127, */
          smooth: smoothArray,
          adapt: adaptArray,
        }),
      };
    } catch (e) {
      console.log(e.toString());
    }
  });
  audio.addEventListener('error', function(e) {
    console.log(e.toString());
  });

  //audio.src = 'https://api.soundcloud.com/tracks/' + tracks[0] + '/stream?client_id=' + CLIENT_ID;
  //audio.src = 'https://greggman.github.io/doodles/sounds/DOCTOR VOX - Level Up.mp3';
  // audio.src = 'mp3/Bagatelleop119n1.mp3';
  audio.src = 'mp3/unkle.mp3';
  //audio.src = 'mp3/Ar.Mour (Feat. Elliott Power & Miink).mp3';
  audio.crossOrigin = 'anonymous';
  audio.play();

  TweenMax.to(audio, 3, { volume: 0.7 });
  then = window.performance.now();
  run();
}

demo();
