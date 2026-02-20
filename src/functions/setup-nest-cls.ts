import { ClsMiddlewareOptions } from 'nestjs-cls'

/**
 * This function sets up the global context store which is accsisable by every module that imports
 * the NestCls Module
 */
export const setupNestCls: ClsMiddlewareOptions['setup'] = (cls, req) => {
  cls.set('$USER', req.$USER)
}
