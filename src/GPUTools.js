import { getGPUTier } from 'detect-gpu'

const GPUTier = getGPUTier({
  mobileBenchmarkPercentages: [10, 40, 30, 20], // (Default) [TIER_0, TIER_1, TIER_2, TIER_3]
  desktopBenchmarkPercentages: [10, 40, 30, 20] // (Default) [TIER_0, TIER_1, TIER_2, TIER_3]
})

export default class GPUTools {
  constructor () {
    const a = GPUTier.tier.split('_')
    this.gpuTier = {
      levelTier: parseInt(a[3], 10),
      isMobile: a.findIndex(k => k === 'MOBILE') !== -1,
      isDesk: a.findIndex(k => k === 'DESKTOP') !== -1,
      type: a.findIndex(k => k === 'DESKTOP') !== -1 ? 'desktop' : 'mobile'
    }
  }

  getBestGPUSettings () {
    let fps = 33
    let bufferSize = 320
    let ratio = 1

    if (this.gpuTier.isMobile) {
      if (this.gpuTier.levelTier === 0) {
        bufferSize = 320
        fps = 30
      } else if (this.gpuTier.levelTier === 1) {
        bufferSize = 320
        fps = 35
      } else if (this.gpuTier.levelTier === 2) {
        bufferSize = 400
        fps = 40
      } else if (this.gpuTier.levelTier === 3) {
        fps = 60
        ratio = window.devicePixelRatio
        bufferSize = 512 * ratio
      }
    } else if (this.gpuTier.isDesk) {
      fps = 60
      bufferSize = 600
      if (this.gpuTier.levelTier >= 2) {
        ratio = window.devicePixelRatio
        bufferSize = 512 * ratio
      }
    }

    return {
      fps: fps,
      bufferSize: bufferSize,
      ratio: ratio
    }
  }
}
