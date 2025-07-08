import { ProviderSendNotificationDTO, ProviderSendNotificationResultsDTO } from "@medusajs/framework/types"
import { AbstractNotificationProviderService, isDefined, MedusaError } from "@medusajs/framework/utils"
import nodemailer, { Transporter } from "nodemailer"
import Mail from "nodemailer/lib/mailer"
import SMTPConnection from "nodemailer/lib/smtp-connection"
import SMTPTransport from "nodemailer/lib/smtp-transport"

export type PluginOptions = SMTPConnection.Options & SMTPTransport.MailOptions & {
    from: string
}

export class NodemailerNotificationProviderService extends AbstractNotificationProviderService {
    static identifier = "nodemailer"

    protected options_: PluginOptions
    protected transporter: Transporter

    constructor(
        _,
        options: PluginOptions
    ) {
        super()
        this.options_ = options
        this.transporter = nodemailer.createTransport(options)
    }

    static validateOptions(options: Record<any, any>) {
        if (!options.host) {
            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                `"host" is required in the ${this.identifier} provider's options.`
            )

        }

        if (!options.port) {
            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                `"port" is required in the ${this.identifier} provider's options.`
            )
        }
    }

    async send(
        notification: ProviderSendNotificationDTO
    ): Promise<ProviderSendNotificationResultsDTO> {
        const { to, content } = notification

        if (!isDefined(this.options_.from) && !isDefined(notification.from)) {
            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                `"from" is required in the ${NodemailerNotificationProviderService.identifier} provider's options.`
            )
        }

        let html: string | undefined
        if (isDefined(content?.html) || isDefined(content?.text)) {
            html = content?.html ?? content?.text
        }

        let attachments: Mail.Attachment[] = []
        if (isDefined(notification.attachments) && Array.isArray(notification.attachments) && notification.attachments.length > 0) {
            attachments = notification.attachments.map(attachment => ({
                content: attachment.content,
                filename: attachment.filename,
                contentType: attachment.content_type,
                contentDisposition: (attachment.disposition === "inline" || attachment.disposition === "attachment")
                    ? attachment.disposition
                    : undefined,
                cid: attachment.id,
                contentTransferEncoding: attachment.content_type === "text/html" ? "quoted-printable" : "base64",
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
            id: info.messageId
        }
    }
}

export default NodemailerNotificationProviderService