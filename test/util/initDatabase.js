// @flow

import {promisify} from "es6-promisify"
import requireEnv from '@jcoreio/require-env'
import {Client} from 'pg'

export default async function initDatabase(): Promise<void> {
  const host = requireEnv('DB_HOST')
  const database = requireEnv('DB_NAME')
  const user = requireEnv('DB_USER')
  const password = requireEnv('DB_PASSWORD')

  let client
  try {
    const cli = client = new Client({host, user, password, database: user})

    await promisify(cb => cli.connect(cb))()
    const {rowCount: databaseExists} = await cli.query(
      `SELECT 1 FROM pg_database WHERE datname = $1::text`, [database]
    )
    if (!databaseExists) {
      await cli.query(`CREATE DATABASE ${database}`)
    }
  } finally {
    if (client) await client.end()
  }
}
