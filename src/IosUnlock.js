/**
 * Try to fix iOS lock on audio.
 *
 * By default, audio on iOS is locked until a sound is played within a user interaction,
 * and then it plays normally the rest of the page session.
 */

// Inspired from https://github.com/goldfire/howler.js/blob/2.0/src/howler.core.js#L212

export default class IosUnlock {
  constructor(ctx) {
    this.ctx = ctx;
    this.unlocked = false;

    this.unlock = this.unlock.bind(this);

    document.addEventListener('touchend', this.unlock, true);
    document.addEventListener('mousedown', this.unlock, true);
    document.addEventListener('click', this.unlock, true);
  }

  unlock() {

    if (this.unlocked) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
        document.querySelector('.log').innerHTML += '<br/>isounlock resume ';
      }
      return false;
    }

    if (typeof this.ctx.resume === 'function') {
      return this.ctx.resume().then(this.startFakeBuffer.bind(this));
    }

    return this.startFakeBuffer();
  }

  startFakeBuffer() {
    this.buffer = this.ctx.createBuffer(1, 1, 22050);
    this.source = this.ctx.createBufferSource();

    this.source.buffer = this.buffer;
    this.source.connect(this.ctx.destination);
    this.source.start(0);
    this.source.onended = this.onSourceEnd.bind(this);
  }

  onSourceEnd() {
    this.source.disconnect();
    this.unlocked = true;
    document.removeEventListener('touchend', this.unlock, true);
    document.removeEventListener('mousedown', this.unlock, true);
  }
}
