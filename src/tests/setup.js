import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Web Crypto API
Object.defineProperty(globalThis, 'crypto', {
  value: {
    subtle: {
      generateKey: vi.fn(),
      exportKey: vi.fn(),
      importKey: vi.fn(),
      encrypt: vi.fn(),
      decrypt: vi.fn(),
      digest: vi.fn(),
    },
    getRandomValues: vi.fn(val => val),
  },
});

// Mock LocalStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: function(key) { return store[key] || null; },
    setItem: function(key, value) { store[key] = value.toString(); },
    removeItem: function(key) { delete store[key]; },
    clear: function() { store = {}; }
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
