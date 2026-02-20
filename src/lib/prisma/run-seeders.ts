/**
 * A seeder function that inserts initial data into the database. Each seeder receives the Prisma
 * client instance to perform operations.
 *
 * @typedef {function} SeederFn
 * @param {any} prismaClient  - The Prisma client used for database operations.
 * @returns {Promise<void>} A promise that resolves when seeding is complete.
 */
export type SeederFn<T> = (prismaClient: T) => Promise<void>

/**
 * Executes a list of seeder functions in sequence using a shared Prisma client.
 *
 * @param {any}        prismaClient  - The Prisma client instance used for database operations.
 * @param {SeederFn[]} seeders       - An array of seeder functions to be run sequentially.
 * @returns {Promise<void>} A promise that resolves when all seeders have finished.
 */
export const runSeeders = async <T>(prismaClient: T, seeders: SeederFn<T>[]): Promise<void> => {
  for (const seeder of seeders) {
    await seeder(prismaClient)
  }
}
