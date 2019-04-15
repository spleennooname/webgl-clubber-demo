'use strict';

import './js/raf.js';

import './styles/styles.scss';

import vs from './glsl/vert.glsl';
import fs from './glsl/frag.glsl';
import ps from './glsl/post.glsl';

import Clubber from 'clubber';
import { getGPUTier } from 'detect-gpu';
import { TweenMax } from 'gsap';
import * as twgl from 'twgl.js';

const IS_LOG = false;

let canvas,
  gl,
  GPUTier,
  positionBuffer,
  rafID = -1,
  pixelRatio = 0,
  displayWidth,
  displayHeight,
  programInfo,
  stats;

let mouse = [];

let now = 0,
  t = 0,
  then = 0,
  fps = 60,
  interval = 1000 / fps;

let SIZE = 512;

const tracks = ['577151343', '396848079'];


let cover,
  audio,
  clubber,
  bands = {},
  iMusicSub = [0.0, 0.0, 0.0, 0.0],
  iMusicLow = [0.0, 0.0, 0.0, 0.0],
  iMusicMid = [0.0, 0.0, 0.0, 0.0],
  iMusicHigh = [0.0, 0.0, 0.0, 0.0];

let CLIENT_ID = '56c4f3443da0d6ce6dcb60ba341c4e8d',
  AUDIO_URL = 'https://api.soundcloud.com/tracks/396848079/stream?client_id=' + CLIENT_ID;

// utils

function getGPU() {
  const a = GPUTier.tier.split('_');
  return {
    levelTier: parseInt(a[3], 10),
    isMobile: a.findIndex(k => k === 'MOBILE') !== -1,
    isDesk: a.findIndex(k => k === 'DESKTOP') !== -1,
  };
}

function getBestGPUSettings() {
  let fps = 33;
  let size = 320;
  let ratio = 1;
  let gpu = getGPU();
  if (gpu.isMobile) {
    if ( gpu.levelTier <= 1) {
      size = 320;
      fps = 33;
    }
    else
    if (gpu.levelTier <= 2) {
      size = 400;
      fps = 33;
    }
    else
    if (gpu.levelTier >= 3) {
      size = 512;
      fps = 60;
      ratio = window.devicePixelRatio;
    }
  }
  else
  if (gpu.isDesk) {
    fps = 60;
    size = 512;
  }
  return {
    fps: fps,
    size: size,
    ratio: ratio
  }
}

function setMousePos(e) {
  mouse[0] = e.clientX / gl.canvas.clientWidth;
  mouse[1] = 1 - e.clientY / gl.canvas.clientHeight;
}

function handleTouch(e) {
  e.preventDefault();
  setMousePos(e.touches[0]);
}

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
  canvas.addEventListener('mousemove', setMousePos);
  canvas.addEventListener('mouseleave', () => {
    mouse = [0.5, 0.5];
  });
  canvas.addEventListener('mousedown', e => {
    console.log(e);
  });
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('touchstart', handleTouch, { passive: false });
  canvas.addEventListener('touchmove', handleTouch, { passive: false });

  // audio el
  audio = document.getElementById('audio');
  audio.crossOrigin = 'anonymous';

  // cover click
  cover = document.querySelector('.cover');
  cover.addEventListener('click', event => {
    play();
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
      template: '3270',
      from: 5,
      to: 32,
      smooth: [0.1, 0.1, 0.1, 0.1], // Exponential smoothing factors for each of the four returned values
    }),

    low: clubber.band({
      from: 32,
      to: 48,
      smooth: [0.1, 0.1, 0.1, 0.1], // Exponential smoothing factors for each of the four returned values
    }),

    mid: clubber.band({
      from: 48,
      to: 64,
      smooth: [0.1, 0.1, 0.1, 0.1],
    }),

    high: clubber.band({
      from: 64,
      to: 160,
      smooth: [0.1, 0.1, 0.1, 0.1],
    }),
  };
}

function initGL() {

  GPUTier = getGPUTier({
    mobileBenchmarkPercentages: [15, 35, 30, 20], // (Default) [TIER_0, TIER_1, TIER_2, TIER_3]
    desktopBenchmarkPercentages: [15, 35, 30, 20], // (Default) [TIER_0, TIER_1, TIER_2, TIER_3]
  });

  const gpu = getBestGPUSettings();
  SIZE = gpu.size;
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
      SIZE +
      ')';
  }
  then = window.performance.now();

  run();
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
  displayWidth = SIZE; //Math.floor(canvas.clientWidth * pixelRatio);
  displayHeight = SIZE; //Math.floor(canvas.clientHeight * pixelRatio);
  // Check if the canvas is not the same size.
  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    // Make the canvas the same size
    canvas.width = displayHeight;
    canvas.height = displayHeight;
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  }
}

function render(time) {

  resize();

  if (clubber) {
    clubber.update();

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
}

function start() {
  stop();
  then = window.performance.now();
  run();
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

function play() {
  cover.removeEventListener('click', play);
  TweenMax.to(cover, 0.35, { autoAlpha: 0 });
  audio.src = 'https://api.soundcloud.com/tracks/'+ tracks[0] + '/stream?client_id=' + CLIENT_ID;
  const p = audio.play();
  p.then(() => {
    initClubber();
    clubber.listen(audio);
    clubber.update();
  });
}

demo();
