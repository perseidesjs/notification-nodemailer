import { ModuleProvider, Modules } from '@medusajs/framework/utils'
import NodemailerNotificationProviderService from './service'

export default ModuleProvider(Modules.NOTIFICATION, {
	services: [NodemailerNotificationProviderService],
})
