'use strict';

import './js/raf.js';

import './styles/styles.scss';

import vs from './glsl/vert.glsl';
import fs from './glsl/frag.glsl';
import ps from './glsl/post.glsl';

//import Clubber from 'clubber';
import GPUTools from './GPUTools';
import { TweenMax } from 'gsap';
import * as twgl from 'twgl.js';

const IS_LOG = false;

let canvas,
  gl,
  GPUTier,
  positionBuffer,
  rafID = -1,
  gpuTools,
  pixelRatio = 0,
  displayWidth,
  displayHeight,
  programInfo,
  stats;

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

  // audio el
  audio = document.getElementById('audio');
  audio.crossOrigin = 'anonymous';

  // cover click
  cover = document.querySelector('.cover');
  cover.addEventListener('click', event => {
    start();
  });

  initGL();

  //gl.getExtension('WEBGL_lose_context').restoreContext();
  //gl.getExtension('WEBGL_lose_context').loseContext();
}

function initClubber() {
  clubber = new Clubber({
    size: 2048, // Samples for the fourier transform. The produced frequency bins will be 1/2 that.
  });

  bands = {
    sub: clubber.band({
      from: 1,
      to: 32,
      smooth: [0.1, 0.1, 0.1, 0.1], // Exponential smoothing factors for each of the four returned values
      adapt: [1, 1, 1, 1],
      low: 64,
      high: 128,
    }),

    low: clubber.band({
      from: 32,
      to: 48,
      smooth: [0.1, 0.1, 0.1, 0.1], // Exponential smoothing factors for each of the four returned values
      adapt: [1, 1, 1, 1],
      low: 64,
      high: 128,
    }),

    mid: clubber.band({
      from: 48,
      to: 64,
      smooth: [0.1, 0.1, 0.1, 0.1],
      adapt: [1, 1, 1, 1],
      low: 64,
      high: 128,
    }),

    high: clubber.band({
      from: 64,
      to: 96,
      smooth: [0.1, 0.1, 0.1, 0.1],
      adapt: [1, 1, 1, 1],
      low: 64,
      high: 128,
    }),
  };

  clubber.context.resume();

}

function initGL() {
  gpuTools = new GPUTools();

  const gpu = gpuTools.getBestGPUSettings();
  bufferSize = gpu.bufferSize;
  fps = gpu.fps;
  pixelRatio = gpu.ratio;

  interval = 1000 / fps;

  stats = new Stats();
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.domElement);

  gl = twgl.getContext(canvas, { depth: false, antialiasing: false });

  programInfo = twgl.createProgramInfo(gl, [vs, fs]);

  positionBuffer = twgl.createBufferInfoFromArrays(gl, {
    position: { data: [-1, -1, -1, 4, 4, -1], numComponents: 2 },
  });

  gl.useProgram(programInfo.program);
  twgl.setBuffersAndAttributes(gl, programInfo, positionBuffer);

  if (IS_LOG) {
    document.querySelector('.log').innerHTML =
      'devicePixelRatio=' +
      window.devicePixelRatio +
      ' tier=' +
      GPUTier.tier +
      ' type=' +
      GPUTier.type +
      '<br/>' +
      'applied: ' +
      'px ratio: ' +
      pixelRatio +
      ', fps: ' +
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
      '(buffer size: ' +
      bufferSize +
      ')';
  }
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
  if (audio.readyState !== 4) {
    return;
  }

  resize();

  clubber.update();
  //console.log(audio.readyState, clubber.notes);

  bands.low(iMusicLow);
  bands.sub(iMusicSub);
  bands.high(iMusicHigh);
  bands.mid(iMusicMid);

  twgl.setUniforms(programInfo, {
    iMusicSub: iMusicSub,
    iMusicLow: iMusicLow,
    iMusicMid: iMusicMid,
    iMusicHigh: iMusicHigh,
    iGlobalTime: clubber.time / 1000,
    iResolution: [displayWidth, displayHeight],
  });

  twgl.bindFramebufferInfo(gl, null);
  twgl.drawBufferInfo(gl, positionBuffer, gl.TRIANGLES);
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
  initGL();
}

function bindTrax(index = 0) {
  audio.src = 'https://api.soundcloud.com/tracks/' + tracks[index] + '/stream?client_id=' + CLIENT_ID;
  audio
    .play()
    .then(() => {
      console.log('play&run', audio.src);
      then = window.performance.now();
      initClubber();
      console.log(clubber.context.state);
      clubber.listen(audio);
      clubber.context.resume();
      console.log(clubber.context.state);
      run();
    })
    .catch(error => {
      console.warn(error);
    });
}

function start() {
  cover.removeEventListener('click', start);
  TweenMax.to(cover, 0.35, { autoAlpha: 0 });
  bindTrax(2);
}

demo();
