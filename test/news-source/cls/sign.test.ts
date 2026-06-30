import { describe, it, expect } from 'vitest';
import { generateSign } from '../../../src/news-source/cls/sign.js';

describe('generateSign', () => {
	it('should produce correct sign for hot list params', () => {
		// Verified against actual API: sign=b02d8f7bc4c45eeb3e86904203597da2
		const sign = generateSign({
			app: 'CailianpressWeb',
			os: 'web',
			sv: '8.7.9',
		});
		expect(sign).toBe('b02d8f7bc4c45eeb3e86904203597da2');
	});

	it('should produce correct sign for depth list params with last_time', () => {
		// Verified against actual API: sign=61b46741820df524bfa226cfc2448b9d
		const sign = generateSign({
			app: 'CailianpressWeb',
			id: '1000',
			last_time: '1781533319',
			os: 'web',
			rn: '20',
			sv: '8.7.9',
		});
		expect(sign).toBe('61b46741820df524bfa226cfc2448b9d');
	});

	it('should ignore null and undefined values', () => {
		const signWithNull = generateSign({
			app: 'CailianpressWeb',
			os: 'web',
			sv: '8.7.9',
			extra: null,
		});
		expect(signWithNull).toBe('b02d8f7bc4c45eeb3e86904203597da2');

		const signWithUndefined = generateSign({
			app: 'CailianpressWeb',
			os: 'web',
			sv: '8.7.9',
			extra: undefined,
		});
		expect(signWithUndefined).toBe('b02d8f7bc4c45eeb3e86904203597da2');
	});

	it('should sort keys alphabetically', () => {
		// Keys in random order should produce same result as sorted
		const sign1 = generateSign({
			sv: '8.7.9',
			app: 'CailianpressWeb',
			os: 'web',
		});
		expect(sign1).toBe('b02d8f7bc4c45eeb3e86904203597da2');
	});

	it('should handle number and boolean values', () => {
		const sign = generateSign({
			app: 'CailianpressWeb',
			os: 'web',
			count: 20,
			enabled: true,
		});
		// Should not throw, produces deterministic output
		expect(sign).toHaveLength(32);
		expect(typeof sign).toBe('string');
	});

	it('should return 32-char hex string', () => {
		const sign = generateSign({ app: 'CailianpressWeb', os: 'web', sv: '8.7.9' });
		expect(sign).toHaveLength(32);
		expect(/^[a-f0-9]{32}$/.test(sign)).toBe(true);
	});
});
