import path from 'node:path'
import { concat } from 'concat-str'
import { createAppConfig } from '@/utils/create-app-config'

export default createAppConfig({
  appName: '@Nest-starter API backend',
  appDescription: concat('@Nest-starter API backend'),
  apiPrefix: 'api',
  uploadDir: path.resolve(process.cwd(), 'storage', 'uploads'),
})
