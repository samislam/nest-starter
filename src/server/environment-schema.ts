import * as Joi from 'joi'
import { EnvironmentVars } from '@/types/environment-vars'

export default Joi.object<EnvironmentVars>({
  HOST: Joi.string().default('localhost'),
  PORT: Joi.number().port().default(4000),
  // # Database authentication
  DATABASE_URL: Joi.string().optional().min(0),
  EMAIL_HOST: Joi.string().optional().min(0),
  EMAIL_USERNAME: Joi.string().optional().min(0),
  EMAIL_PASSWORD: Joi.string().optional().min(0),
})
