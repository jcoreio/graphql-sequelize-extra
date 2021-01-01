// @flow

import type { Model, CreateOptions } from 'sequelize'
import * as graphql from 'graphql'

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
  ) => PromiseOrValue<?Instance>,
  createOptions?: CreateOptions<InitAttributes>,
|}

export default function createMutation<
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
  createOptions = {},
}: Options<
  InitAttributes,
  Instance,
  Source,
  Context
>): graphql.GraphQLFieldConfig<Source, Context> {
  return {
    type: returnType,
    args: {
      [(valuesArgName: any)]: {
        type: new graphql.GraphQLNonNull(inputType),
        description: `The attribute values of the ${returnType.name} to create`,
      },
    },
    resolve: async (
      doc: any,
      args: Object,
      context: Context,
      info: graphql.GraphQLResolveInfo
    ): Promise<Instance> => {
      let values = args[valuesArgName]
      if (typeof before === 'function') {
        const beforeResult = await before(doc, args, context, info)
        if (beforeResult) values = beforeResult
      }
      const instance = await model.create(values, createOptions)
      if (typeof after === 'function') {
        return (await after(instance, args, context, info)) || instance
      }
      return instance
    },
  }
}
