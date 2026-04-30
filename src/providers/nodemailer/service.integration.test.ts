import { beforeAll, describe, expect, it } from "vitest"
import QRCode from "qrcode"
import { NodemailerNotificationProviderService } from "./service"

/**
 * Integration tests for QR code attachments with Mailhog
 *
 * Prerequisites:
 * - Mailhog running on localhost:1025 (SMTP) and localhost:8025 (Web UI)
 * - Start with: brew services start mailhog
 *
 * Check emails at: http://localhost:8025
 */
describe("Nodemailer Integration - QR Code Attachments", () => {
	let service: NodemailerNotificationProviderService

	beforeAll(() => {
		service = new NodemailerNotificationProviderService(null, {
			from: "test@example.com",
			host: "localhost",
			port: 1025,
			secure: false,
		})
	})

	it("sends email with inline CID QR code attachment", async () => {
		const voucherCode = "VOUCHER-123-ABC"
		const dataUrl = await QRCode.toDataURL(voucherCode)

		// Strip data URL prefix to get pure base64
		const base64Content = dataUrl.replace(/^data:image\/png;base64,/, "")

		const result = await service.send({
			to: "customer@example.com",
			channel: "email",
			template: "voucher-inline",
			content: {
				subject: "Your Voucher - Inline QR Code",
				html: `
					<h1>Your Voucher</h1>
					<p>Code: ${voucherCode}</p>
					<p>Scan this QR code:</p>
					<img src="cid:qr-code" alt="QR Code" width="200" height="200" />
				`,
			},
			attachments: [
				{
					id: "qr-code",
					content: base64Content,
					filename: "qr-code.png",
					content_type: "image/png",
					disposition: "inline",
				},
			],
		})

		expect(result).toBeDefined()
		expect(result.id).toBeDefined()
		console.log("Inline CID email sent, messageId:", result.id)
	})

	it("sends email with regular attachment QR code", async () => {
		const voucherCode = "VOUCHER-456-DEF"
		const qrBuffer = await QRCode.toBuffer(voucherCode)

		// Convert to binary string (Medusa's recommended format)
		const binaryString = [...qrBuffer]
			.map((byte) => byte.toString(2).padStart(8, "0"))
			.join("")

		const result = await service.send({
			to: "customer@example.com",
			channel: "email",
			template: "voucher-attachment",
			content: {
				subject: "Your Voucher - QR Code Attachment",
				html: `
					<h1>Your Voucher</h1>
					<p>Code: ${voucherCode}</p>
					<p>Please find your QR code attached to this email.</p>
				`,
			},
			attachments: [
				{
					content: binaryString,
					filename: "voucher-qr.png",
					content_type: "image/png",
					disposition: "attachment",
				},
			],
		})

		expect(result).toBeDefined()
		expect(result.id).toBeDefined()
		console.log("Attachment email sent, messageId:", result.id)
	})

	it("sends email with both inline and attachment QR codes", async () => {
		const voucherCode = "VOUCHER-789-GHI"

		// Generate QR as data URL for inline
		const dataUrl = await QRCode.toDataURL(voucherCode)
		const base64Content = dataUrl.replace(/^data:image\/png;base64,/, "")

		// Generate QR as buffer for attachment
		const qrBuffer = await QRCode.toBuffer(voucherCode, { width: 400 })
		const binaryString = [...qrBuffer]
			.map((byte) => byte.toString(2).padStart(8, "0"))
			.join("")

		const result = await service.send({
			to: "customer@example.com",
			channel: "email",
			template: "voucher-both",
			content: {
				subject: "Your Voucher - Inline + Attachment",
				html: `
					<h1>Your Voucher</h1>
					<p>Code: ${voucherCode}</p>
					<p>Preview:</p>
					<img src="cid:qr-preview" alt="QR Code Preview" width="150" height="150" />
					<p><small>A high-resolution QR code is also attached for printing.</small></p>
				`,
			},
			attachments: [
				{
					id: "qr-preview",
					content: base64Content,
					filename: "qr-preview.png",
					content_type: "image/png",
					disposition: "inline",
				},
				{
					content: binaryString,
					filename: "qr-print.png",
					content_type: "image/png",
					disposition: "attachment",
				},
			],
		})

		expect(result).toBeDefined()
		expect(result.id).toBeDefined()
		console.log("Both inline+attachment email sent, messageId:", result.id)
	})
})

describe("Nodemailer Integration - provider_data options", () => {
	let service: NodemailerNotificationProviderService

	beforeAll(() => {
		service = new NodemailerNotificationProviderService(null, {
			from: "test@example.com",
			host: "localhost",
			port: 1025,
			secure: false,
		})
	})

	it("sends email with replyTo, cc, and bcc from provider_data", async () => {
		const result = await service.send({
			to: "customer@example.com",
			channel: "email",
			template: "order-confirmation",
			content: {
				subject: "Order Confirmed",
				html: "<p>Your order has been confirmed.</p>",
			},
			provider_data: {
				replyTo: "support@store.com",
				cc: "ops@store.com",
				bcc: "archive@store.com",
			},
		})

		expect(result).toBeDefined()
		expect(result.id).toBeDefined()
		console.log("provider_data email sent, messageId:", result.id)
	})
})
