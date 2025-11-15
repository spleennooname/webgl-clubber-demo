"use strict";

import "./styles/styles.scss";

import vs from "./glsl/vert.glsl";
import fs from "./glsl/frag.glsl";
import ps from "./glsl/post.glsl";

import { AudioContext } from "standardized-audio-context";
import GPUTools from "./GPUTools";

import { TweenMax } from "gsap";
import Stats from "stats.js";
import * as twgl from "twgl.js";
import {
  iMusicSub,
  iMusicLow,
  iMusicMid,
  iMusicHigh,
  getClubberBands,
  createClubber,
} from "./clubber.js";

const DEBUG = true;

let canvas;
let gl;
let positionBuffer;

let fb1;
let fb2;

let source;
let gpuTools;
let pixelRatio = 0;
let displayWidth;
let displayHeight;
let audioContext;
let analyser;
let programInfo;
let postInfo;
let stats;
let numPoints;
let frequencyData;
// let state
let now = 0;
// const t = 0
let then = 0;
let fps = 60;
let interval = 1000 / fps;
let rafID = -1;
let bufferSize = 512;

// const tracks = [
//   "310025963", // unkle remix
//   "80365115", // kraftw
//   "577151343",
//   "396848079",
//   "92039697",
// ];

let cover;
let audio;
let clubber;
let bands = {};

// const CLIENT_ID = '56c4f3443da0d6ce6dcb60ba341c4e8d'

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

/* const plane = {
  data: [-1, -1, 0, +1, -1, 0, -1, +1, 0, -1, +1, 0, +1, -1, 0, +1, +1, 0],
  numComponents: 3
} */

const bigTriangle = {
  data: [-1, -1, -1, 4, 4, -1],
  numComponents: 2,
};

function demo() {
  // canvas
  canvas = document.querySelector("#canvas");
  try {
    gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  } catch (err) {
    console.error("no WebGL in da house.");
    return;
  }
  // audio el
  audio = document.querySelector("#audio");
  audio.crossOrigin = "anonymous";
  audio.loop = true;
  audio.volume = 0;
  //
  canvas.addEventListener(
    "webglcontextlost",
    (event) => {
      console.warn("WebGL context lost");
      event.preventDefault();
      stop();
      // Context and resources will be cleaned up automatically
    },
    false
  );

  canvas.addEventListener(
    "webglcontextrestored",
    (event) => {
      console.warn("WebGL context restored - reinitializing");
      // Reinitialize WebGL components only
      initGL();
    },
    false
  );
  // cover click
  cover = document.querySelector(".cover");
  TweenMax.to(cover.querySelector(".t"), 3.0, { autoAlpha: 1 });
  cover.addEventListener("click", (event) => start());

  // Window resize handler
  window.addEventListener("resize", () => {
    needsResize = true;
  });

  initGL();
  // gl.getExtension('WEBGL_lose_context').restoreContext();
  // gl.getExtension('WEBGL_lose_context').loseContext();
}

function initGL() {
  gpuTools = new GPUTools();

  const gpu = gpuTools.getBestGPUSettings();
  bufferSize = gpu.bufferSize;
  fps = 60; // gpu.fps; try max fps
  pixelRatio = gpu.ratio;

  interval = 1000 / fps;

  stats = new Stats();
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.domElement);

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
  const delta = now - then;
  if (delta > interval) {
    then = now - (delta % interval);
    const t = now / 1000;
    stats.begin();
    render(t);
    stats.end();
  }
  rafID = window.requestAnimationFrame(run);
}

function resize() {
  // Lookup the size the browser is displaying the canvas in CSS pixels
  // and compute a size needed to make our drawingbuffer match it in
  // device pixels.
  // const aspectRatio = window.innerWidth / window.innerHeight;
  displayWidth = bufferSize; // Math.floor(canvas.clientWidth * pixelRatio);
  displayHeight = bufferSize; // Math.floor(canvas.clientHeight * pixelRatio);
  // Check if the canvas is not the same size.
  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    // Make the canvas the same size
    canvas.width = displayHeight;
    canvas.height = displayHeight;
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  }
}

// Rendering optimizations cache
let cachedResolution = [0, 0];
let needsResize = true;
let currentProgram = null; // Track current shader program to avoid redundant useProgram calls
let buffersSet = false; // Track if buffers are already set

function render(time) {
  /*   if (audio.readyState !== 4) {
    return;
  } */

  // Only resize when needed, not every frame
  if (needsResize) {
    resize();
    needsResize = false;
  }

  // Update audio data if available
  if (clubber) {
    // copy current frequency data from analyser to frequencyData array
    // values are in dB units 0..255
    // https://webaudio.github.io/web-audio-api/#dom-analysernode-getbytefrequencydata
    // https://stackoverflow.com/questions/14789283/what-does-the-fft-data-in-the-web-audio-api-correspond-to

    // db = energia su unita di tempo
    // 10.log( p/p0)^2
    analyser.getByteFrequencyData(frequencyData);
    clubber.update(null, frequencyData, false);
    bands.low(iMusicLow);
    bands.sub(iMusicSub);
    bands.high(iMusicHigh);
    bands.mid(iMusicMid);
  }

  // Update cached resolution only if changed
  if (
    cachedResolution[0] !== displayWidth ||
    cachedResolution[1] !== displayHeight
  ) {
    cachedResolution[0] = displayWidth;
    cachedResolution[1] = displayHeight;
  }

  // Pass 1: Render to framebuffer
  if (currentProgram !== programInfo.program) {
    gl.useProgram(programInfo.program);
    currentProgram = programInfo.program;
    buffersSet = false; // Need to reset buffers when program changes
  }

  // Set buffers only when program changes (they don't change)
  if (!buffersSet) {
    twgl.setBuffersAndAttributes(gl, programInfo, positionBuffer);
    buffersSet = true;
  }

  twgl.setUniforms(programInfo, {
    iMusicSub,
    iMusicLow,
    iMusicMid,
    iMusicHigh,
    iGlobalTime: time,
    uTexture: fb1.attachments[0], // 1st initially empty
    iResolution: cachedResolution,
  });
  twgl.bindFramebufferInfo(gl, fb2);
  twgl.drawBufferInfo(gl, positionBuffer, gl.TRIANGLES);

  // Pass 2: Render to screen
  if (currentProgram !== postInfo.program) {
    gl.useProgram(postInfo.program);
    currentProgram = postInfo.program;
    buffersSet = false; // Need to reset buffers for new program
  }

  // Set buffers only when program changes
  if (!buffersSet) {
    twgl.setBuffersAndAttributes(gl, postInfo, positionBuffer);
    buffersSet = true;
  }

  twgl.setUniforms(postInfo, {
    uTime: time,
    uResolution: cachedResolution,
    uTexture: fb2.attachments[0],
  });
  twgl.bindFramebufferInfo(gl, null);
  twgl.drawBufferInfo(gl, positionBuffer, gl.TRIANGLES);

  // Optimized ping-pong buffers swap (avoid temp variable)
  [fb1, fb2] = [fb2, fb1];

  if (DEBUG) {
    document.querySelector(".log").innerHTML =
      "devicePixelRatio=" +
      window.devicePixelRatio +
      " tier=" +
      gpuTools.gpuTier.levelTier +
      " type=" +
      gpuTools.gpuTier.type +
      "<br/>" +
      "applied: " +
      "pixel ratio=" +
      pixelRatio +
      ", fps=" +
      fps +
      "<br/>" +
      "(" +
      window.innerWidth +
      "," +
      window.innerHeight +
      ")" +
      "<br/>" +
      "(" +
      canvas.width +
      "," +
      canvas.height +
      ")" +
      "<br/>" +
      "(bufferSize: " +
      bufferSize +
      ")" +
      "<br/>" +
      analyser.frequencyBinCount +
      ":" +
      audioContext.state +
      "<br/>" +
      time +
      "<br/>";
    // '+<br/>' +
    // frequencyData;
    // + clubber.time;
  }
}

function cleanupAudioResources() {
  // Disconnect audio source if exists
  if (source) {
    try {
      source.disconnect();
    } catch (e) {}
    source = null;
  }

  // Close audio context if exists
  if (audioContext && audioContext.state !== "closed") {
    try {
      audioContext.close();
    } catch (e) {}
    audioContext = null;
  }

  // Clear audio references
  analyser = null;
  clubber = null;
  bands = {};
  frequencyData = null;

  // Remove audio event listeners
  if (audio) {
    audio.removeEventListener("canplay", onAudioCanPlay);
    audio.removeEventListener("error", onAudioError);
  }
}

function cleanupWebGL() {
  // Delete framebuffers manually (TWGL doesn't expose delete method)
  if (fb1 && fb1.framebuffer) {
    gl.deleteFramebuffer(fb1.framebuffer);
    if (fb1.attachments && fb1.attachments[0]) {
      gl.deleteTexture(fb1.attachments[0]);
    }
    fb1 = null;
  }
  if (fb2 && fb2.framebuffer) {
    gl.deleteFramebuffer(fb2.framebuffer);
    if (fb2.attachments && fb2.attachments[0]) {
      gl.deleteTexture(fb2.attachments[0]);
    }
    fb2 = null;
  }

  // Delete buffers
  if (positionBuffer && positionBuffer.attribs) {
    Object.values(positionBuffer.attribs).forEach((attrib) => {
      if (attrib.buffer) {
        gl.deleteBuffer(attrib.buffer);
      }
    });
    positionBuffer = null;
  }

  // Clear program references and reset caches
  programInfo = null;
  postInfo = null;
  currentProgram = null;
  buffersSet = false;
}

function stop() {
  // Cancel animation frame
  if (rafID !== -1) {
    window.cancelAnimationFrame(rafID);
    rafID = -1;
  }

  // Cleanup audio resources
  cleanupAudioResources();

  // Cleanup WebGL resources if context exists
  if (gl && !gl.isContextLost()) {
    cleanupWebGL();
  }
}

// Audio event handlers
function onAudioCanPlay() {
  // document.querySelector('.log').innerHTML += '<br/>set audiocontext on canplay';
  try {
    source = audioContext.createMediaElementSource(audio);
    source.connect(analyser);

    analyser.connect(audioContext.destination);

    clubber = createClubber(audioContext, analyser);
    bands = getClubberBands(clubber);
  } catch (err) {
    console.error(err);
  }
}

function onAudioError(err) {
  console.error(err.toString());
}

function start() {
  cover.removeEventListener("click", start);
  TweenMax.to(cover, 0.25, { autoAlpha: 0 });

  // Cleanup existing resources before creating new ones
  cleanupAudioResources();

  // Create new AudioContext only if needed
  if (!audioContext || audioContext.state === "closed") {
    audioContext = new AudioContext(); // (window.AudioContext || window.webkitAudioContext)()
  }
  //
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  // bins frequency from anal. half fft size 2048 / 2
  numPoints = analyser.frequencyBinCount;
  //
  frequencyData = new Uint8Array(numPoints);
  // 2^8 = 0..255
  // console.log(numPoints, frequencyData);
  audio.addEventListener("canplay", onAudioCanPlay);
  audio.addEventListener("error", onAudioError);

  // audio.src = 'https://api.soundcloud.com/tracks/' + tracks[0] + '/stream?client_id=' + CLIENT_ID;
  // audio.src = 'https://greggman.github.io/doodles/sounds/DOCTOR VOX - Level Up.mp3';
  audio.src = "./mp3/Bagatelleop119n1.mp3";
  // audio.src = 'mp3/unkle.mp3'
  // audio.src = 'mp3/Ar.Mour (Feat. Elliott Power & Miink).mp3';
  audio.play();

  TweenMax.to(audio, 3, { volume: 0.7 });
  then = window.performance.now();
  run();
}

document.addEventListener("DOMContentLoaded", () => demo());
