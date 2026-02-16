/// <reference types="vitest" />
/// <reference types="vitest" />
// @ts-expect-error vitest globals not being recognized by TypeScript
import { describe, it, expect } from 'vitest';

describe('Basic Setup', () => {
  it('should run tests', () => {
    expect(true).toBe(true);
  });

  it('should add numbers correctly', () => {
    expect(1 + 1).toBe(2);
  });
});
