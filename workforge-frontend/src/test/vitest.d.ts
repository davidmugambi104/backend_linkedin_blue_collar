/// <reference types="vitest" />
/// <reference types="vitest/globals" />

declare module 'vitest' {
	interface Assertion<T = any> {
		toHaveNoViolations(): T;
	}

	interface AsymmetricMatchersContaining {
		toHaveNoViolations(): void;
	}
}

declare module '@testing-library/user-event';
