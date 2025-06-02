// src/utils/global.js
// Simple polyfill for global variable in browser environment

// Use globalThis if available (modern browsers), otherwise fallback
const globalObj = (function() {
  if (typeof globalThis !== 'undefined') return globalThis;
  if (typeof window !== 'undefined') return window;
  if (typeof global !== 'undefined') return global;
  if (typeof self !== 'undefined') return self;
  throw new Error('Unable to locate global object');
})();

module.exports = globalObj;