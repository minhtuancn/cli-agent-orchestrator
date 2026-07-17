import '@testing-library/jest-dom'

// jsdom does not implement canvas; xterm probes it during module import.
// Returning null matches an unavailable canvas without requiring native canvas.
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext
}
