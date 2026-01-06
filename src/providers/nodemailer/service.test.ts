import { describe, expect, it } from 'vitest'
import {
	binaryStringToBuffer,
	isBinaryString,
	processAttachmentContent,
} from './service'

describe('isBinaryString', () => {
	it('should return true for valid binary strings', () => {
		// "Hi" in binary
		expect(isBinaryString('0100100001101001')).toBe(true)
		// Single byte
		expect(isBinaryString('01001000')).toBe(true)
		// Multiple bytes
		expect(isBinaryString('010010000110100101101100')).toBe(true)
	})

	it('should return false for strings containing non-binary characters', () => {
		expect(isBinaryString('Hello World')).toBe(false)
		expect(isBinaryString('01234567')).toBe(false)
		expect(isBinaryString('0100100a')).toBe(false)
	})

	it('should return false for strings not divisible by 8', () => {
		expect(isBinaryString('0100100')).toBe(false) // 7 chars
		expect(isBinaryString('010010001')).toBe(false) // 9 chars
	})

	it('should return false for empty strings', () => {
		expect(isBinaryString('')).toBe(false)
	})

	it('should return false for strings shorter than 8 characters', () => {
		expect(isBinaryString('0101')).toBe(false)
	})

	it('should return false for base64 strings', () => {
		// Base64 encoded "Hello"
		expect(isBinaryString('SGVsbG8=')).toBe(false)
	})
})

describe('binaryStringToBuffer', () => {
	it('should convert binary string to correct buffer', () => {
		// "Hi" = H(72) + i(105) in ASCII
		const binaryHi = '0100100001101001'
		const buffer = binaryStringToBuffer(binaryHi)
		expect(buffer.toString()).toBe('Hi')
	})

	it('should handle single byte', () => {
		// 'A' = 65 in ASCII = 01000001 in binary
		const buffer = binaryStringToBuffer('01000001')
		expect(buffer.toString()).toBe('A')
	})

	it('should handle longer strings', () => {
		// "Hello" in binary
		const hello = Buffer.from('Hello')
		const binaryHello = [...hello]
			.map((byte) => byte.toString(2).padStart(8, '0'))
			.join('')
		const buffer = binaryStringToBuffer(binaryHello)
		expect(buffer.toString()).toBe('Hello')
	})

	it('should correctly roundtrip binary data', () => {
		// Create a buffer with various byte values including non-printable chars
		const originalBuffer = Buffer.from([
			0, 127, 128, 255, 72, 101, 108, 108, 111,
		])
		const binaryString = [...originalBuffer]
			.map((byte) => byte.toString(2).padStart(8, '0'))
			.join('')
		const resultBuffer = binaryStringToBuffer(binaryString)
		expect(resultBuffer).toEqual(originalBuffer)
	})
})

describe('processAttachmentContent', () => {
	it('should pass through Buffer content unchanged', () => {
		const buffer = Buffer.from('Hello World')
		const result = processAttachmentContent(buffer)
		expect(Buffer.isBuffer(result)).toBe(true)
		expect(result).toBe(buffer)
	})

	it('should convert binary digit strings to Buffer', () => {
		// "Hi" in binary
		const binaryHi = '0100100001101001'
		const result = processAttachmentContent(binaryHi)
		expect(Buffer.isBuffer(result)).toBe(true)
		expect((result as Buffer).toString()).toBe('Hi')
	})

	it('should pass through regular strings (like base64)', () => {
		const base64Content = 'SGVsbG8gV29ybGQ='
		const result = processAttachmentContent(base64Content)
		expect(typeof result).toBe('string')
		expect(result).toBe(base64Content)
	})

	it('should pass through plain text content', () => {
		const textContent = 'Hello World'
		const result = processAttachmentContent(textContent)
		expect(typeof result).toBe('string')
		expect(result).toBe(textContent)
	})

	it('should handle PDF-like binary content', () => {
		// Simulate a small "PDF" file being converted to binary string format
		const fakePdfBuffer = Buffer.from('%PDF-1.4 test content')
		const binaryString = [...fakePdfBuffer]
			.map((byte) => byte.toString(2).padStart(8, '0'))
			.join('')
		const result = processAttachmentContent(binaryString)
		expect(Buffer.isBuffer(result)).toBe(true)
		expect((result as Buffer).toString()).toBe('%PDF-1.4 test content')
	})

	it('should handle PNG-like binary content with null bytes', () => {
		// PNG signature starts with specific bytes including nulls
		const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
		const binaryString = [...pngSignature]
			.map((byte) => byte.toString(2).padStart(8, '0'))
			.join('')
		const result = processAttachmentContent(binaryString)
		expect(Buffer.isBuffer(result)).toBe(true)
		expect(result).toEqual(pngSignature)
	})
})
