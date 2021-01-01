// @flow

import * as graphql from 'graphql'
import type { Model, DestroyOptions } from 'sequelize'
import { defaultArgs } from '@jcoreio/graphql-sequelize'

export type Options<
  InitAttributes: Object,
  Instance: Model<any, InitAttributes>,
  Source = any,
  Context = any
> = {|
  model: Class<Instance>,
  before?: (
    source: Source,
    args: { [argName: string]: any, ... },
    context: Context,
    info: graphql.GraphQLResolveInfo
  ) => any,
  after?: (
    source: number,
    args: { [argName: string]: any, ... },
    context: Context,
    info: graphql.GraphQLResolveInfo
  ) => any,
  destroyOptions?: DestroyOptions<any>,
|}

export default function destroyMutation<
  InitAttributes: Object,
  Instance: Model<any, InitAttributes>,
  Source,
  Context
>({
  model,
  before,
  after,
  destroyOptions,
}: Options<
  InitAttributes,
  Instance,
  Source,
  Context
>): graphql.GraphQLFieldConfig<Source, Context> {
  return {
    type: new graphql.GraphQLNonNull(graphql.GraphQLInt),
    args: defaultArgs(model),
    resolve: async (
      doc: any,
      args: Object,
      context: Context,
      info: graphql.GraphQLResolveInfo
    ): Promise<number> => {
      let { where } = args
      const pk = model.primaryKeyAttribute
      if (!where) {
        where = {}
        if (pk && args[pk] == null) {
          throw new Error('You must provide where or the primary key')
        }
      }
      if (pk && args[pk] != null) where[pk] = args[pk]
      let finalDestroyOptions
      if (destroyOptions) {
        if (destroyOptions.where)
          where = { ...where, ...(destroyOptions.where: any) }
        finalDestroyOptions = { ...destroyOptions, where }
      } else {
        finalDestroyOptions = { where }
      }

      if (typeof before === 'function') {
        await before(doc, args, context, info)
      }
      const numDestroyed = await model.destroy(finalDestroyOptions)
      if (typeof after === 'function') {
        await after(numDestroyed, args, context, info)
      }
      return numDestroyed
    },
  }
}
