// @flow

import type { Model } from 'sequelize'
import * as graphql from 'graphql'
import { attributeFields } from '@jcoreio/graphql-sequelize'

export type Options = {|
  cache?: Object,
  exclude?: Array<string> | ((key: string) => ?boolean),
  only?: Array<string> | ((key: string) => ?boolean),
  map?: { [key: string]: string, ... } | ((key: string) => string),
  commentToDescription?: boolean,
  globalId?: boolean,
  allowNull?: boolean,
|}

export default function attributeFieldsForCreate<TSource, TContext>(
  model: Class<Model<any>>,
  options: Options = ({}: any)
): graphql.GraphQLFieldConfigMap<TSource, TContext> {
  let { exclude } = options
  if (Array.isArray(exclude)) {
    const excludeArray: Array<string> = exclude
    exclude = (key: string) => excludeArray.indexOf(key) >= 0
  }
  return {
    ...attributeFields(model, {
      ...options,
      allowNull: options.allowNull ?? false,
      exclude: (key: string): ?boolean => {
        const attr = model.rawAttributes[key]
        return (
          attr.allowNull ||
          attr._autoGenerated ||
          (typeof exclude === 'function' && exclude(key))
        )
      },
    }),
    ...attributeFields(model, {
      ...options,
      allowNull: options.allowNull ?? true,
      exclude: (key: string): ?boolean => {
        const attr = model.rawAttributes[key]
        return (
          !attr.allowNull ||
          attr._autoGenerated ||
          (typeof exclude === 'function' && exclude(key))
        )
      },
    }),
  }
}
