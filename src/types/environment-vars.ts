export interface EnvironmentVars {
  /** Service host @default "localhost" @example "192.168.1.118" */
  HOST: string
  /** Service port @default 3001 @example 5000 */
  PORT: number
  // -----------DATABASE------------
  /**
   * The database connection string
   *
   * @example
   *   - postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public
   */
  DATABASE_URL: string
  /**
   * NODEMAILER_HOST
   *
   * @example
   *   smtp.example.com
   */
  EMAIL_HOST: string
  /** SMTP client username */
  EMAIL_USERNAME: string
  /** SMTP client password */
  EMAIL_PASSWORD: string
}
