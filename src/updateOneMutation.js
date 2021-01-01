// @flow

import * as graphql from 'graphql'
import type { Model, UpdateOptions } from 'sequelize'
import { defaultArgs } from '@jcoreio/graphql-sequelize'

type PromiseOrValue<T> = Promise<T> | T

export type Options<
  InitAttributes: Object,
  Instance: Model<any, InitAttributes>,
  Source = any,
  Context = any
> = {|
  valuesArgName?: string,
  inputType: graphql.GraphQLInputObjectType,
  returnType: graphql.GraphQLObjectType,
  model: Class<Instance>,
  before?: (
    source: Source,
    args: { [argName: string]: any, ... },
    context: Context,
    info: graphql.GraphQLResolveInfo
  ) => PromiseOrValue<?InitAttributes>,
  after?: (
    source: Instance,
    args: { [argName: string]: any, ... },
    context: Context,
    info: graphql.GraphQLResolveInfo
  ) => PromiseOrValue<any>,
  updateOptions?: $Shape<UpdateOptions<InitAttributes>>,
|}

export default function updateOneMutation<
  InitAttributes: Object,
  Instance: Model<any, InitAttributes>,
  Source,
  Context
>({
  valuesArgName = 'values',
  inputType,
  returnType,
  model,
  before,
  after,
  updateOptions,
}: Options<
  InitAttributes,
  Instance,
  Source,
  Context
>): graphql.GraphQLFieldConfig<Source, Context> {
  return {
    type: returnType,
    args: {
      ...defaultArgs(model),
      [(valuesArgName: any)]: {
        type: new graphql.GraphQLNonNull(inputType),
        description: `The attribute values of the ${returnType.name} to update`,
      },
    },
    resolve: async (
      doc: any,
      args: Object,
      context: Context,
      info: graphql.GraphQLResolveInfo
    ): Promise<Instance> => {
      let { where } = args
      const pk = model.primaryKeyAttribute
      let values = args[valuesArgName]
      if (!where) {
        where = {}
        if (pk && values[pk] == null && args[pk] == null) {
          throw new Error(
            `You must provide where or the primary key via ${pk} arg or ${valuesArgName} arg`
          )
        }
      }
      if (pk && args[pk] != null) where[pk] = args[pk]
      else if (pk && values[pk] != null) {
        where[pk] = values[pk]
        delete values[pk]
      }
      let finalUpdateOptions
      if (updateOptions) {
        if (updateOptions.where)
          where = { ...where, ...(updateOptions.where: any) }
        finalUpdateOptions = { ...updateOptions, where }
      } else {
        finalUpdateOptions = { where }
      }

      if (typeof before === 'function') {
        const beforeResult = await before(doc, args, context, info)
        if (beforeResult) values = beforeResult
      }
      const [
        numUpdated, // eslint-disable-line no-unused-vars
        updatedRows,
      ] = await model.update(values, finalUpdateOptions)
      const instance: ?Instance =
        Array.isArray(updatedRows) && updatedRows.length === 1
          ? updatedRows[0]
          : await model.findOne({ where })
      if (!instance)
        throw new Error(`failed to find updated ${returnType.name}`)
      if (typeof after === 'function') {
        return (await after(instance, args, context, info)) || instance
      }
      return instance
    },
  }
}
