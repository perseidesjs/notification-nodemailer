import {
	type ProviderSendNotificationDTO,
	type ProviderSendNotificationResultsDTO,
} from '@medusajs/framework/types'
import {
	AbstractNotificationProviderService,
	isDefined,
	MedusaError,
} from '@medusajs/framework/utils'
import nodemailer, { type Transporter } from 'nodemailer'
import type Mail from 'nodemailer/lib/mailer'
import type SMTPConnection from 'nodemailer/lib/smtp-connection'
import type SMTPTransport from 'nodemailer/lib/smtp-transport'

/**
 * Checks if a string is in binary digit format.
 * This format is created by converting a Buffer using:
 * [...buffer].map((byte) => byte.toString(2).padStart(8, "0")).join("")
 *
 * This results in a string containing only 0s and 1s with length divisible by 8.
 */
export function isBinaryString(content: string): boolean {
	// Must only contain 0s and 1s
	if (!/^[01]+$/.test(content)) {
		return false
	}
	// Must be divisible by 8 (each byte = 8 bits)
	if (content.length % 8 !== 0) {
		return false
	}
	// Must be reasonably long (at least 1 byte worth)
	return content.length >= 8
}

/**
 * Converts a binary digit string back to a Buffer.
 * The binary string format is a sequence of 8-character binary representations
 * of each byte, e.g., "0100100001101001" represents "Hi".
 */
export function binaryStringToBuffer(binaryString: string): Buffer {
	const bytes: number[] = []
	for (let i = 0; i < binaryString.length; i += 8) {
		const byteStr = binaryString.slice(i, i + 8)
		bytes.push(parseInt(byteStr, 2))
	}
	return Buffer.from(bytes)
}

/**
 * Processes attachment content to ensure it's in a format Nodemailer can handle.
 * Supports:
 * - Buffer: Passed through as-is
 * - Binary digit string: Converted to Buffer
 * - Regular string: Passed through as-is (assumed to be base64 or text content)
 */
export function processAttachmentContent(
	content: string | Buffer,
): string | Buffer {
	if (Buffer.isBuffer(content)) {
		return content
	}
	if (typeof content === 'string' && isBinaryString(content)) {
		return binaryStringToBuffer(content)
	}
	return content
}

export type PluginOptions = SMTPConnection.Options &
	SMTPTransport.MailOptions & {
		from: string
	}

export class NodemailerNotificationProviderService extends AbstractNotificationProviderService {
	static identifier = 'nodemailer'

	protected options_: PluginOptions
	protected transporter: Transporter

	constructor(_, options: PluginOptions) {
		super()
		this.options_ = options
		this.transporter = nodemailer.createTransport(options)
	}

	static validateOptions(options: Record<any, any>) {
		if (!options.host) {
			throw new MedusaError(
				MedusaError.Types.INVALID_DATA,
				`"host" is required in the ${this.identifier} provider's options.`,
			)
		}

		if (!options.port) {
			throw new MedusaError(
				MedusaError.Types.INVALID_DATA,
				`"port" is required in the ${this.identifier} provider's options.`,
			)
		}
	}

	async send(
		notification: ProviderSendNotificationDTO,
	): Promise<ProviderSendNotificationResultsDTO> {
		const { to, content } = notification

		if (!isDefined(this.options_.from) && !isDefined(notification.from)) {
			throw new MedusaError(
				MedusaError.Types.INVALID_DATA,
				`"from" is required in the ${NodemailerNotificationProviderService.identifier} provider's options.`,
			)
		}

		let html: string | undefined
		if (isDefined(content?.html) || isDefined(content?.text)) {
			html = content?.html ?? content?.text
		}

		let attachments: Mail.Attachment[] = []
		if (
			isDefined(notification.attachments) &&
			Array.isArray(notification.attachments) &&
			notification.attachments.length > 0
		) {
			attachments = notification.attachments.map((attachment) => ({
				content: processAttachmentContent(attachment.content),
				filename: attachment.filename,
				contentType: attachment.content_type,
				contentDisposition:
					attachment.disposition === 'inline' ||
					attachment.disposition === 'attachment'
						? attachment.disposition
						: undefined,
				cid: attachment.id,
				contentTransferEncoding:
					attachment.content_type === 'text/html'
						? 'quoted-printable'
						: 'base64',
			}))
		}

		const mailOptions: Mail.Options = {
			from: notification.from ?? this.options_.from,
			to,
			subject: content?.subject,
		}

		if (isDefined(html)) {
			mailOptions.html = html
		}

		if (attachments.length > 0) {
			mailOptions.attachments = attachments
		}

		const info = await this.transporter.sendMail(mailOptions)

		return {
			id: info.messageId,
		}
	}
}

export default NodemailerNotificationProviderService
