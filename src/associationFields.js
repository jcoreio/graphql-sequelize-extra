// @flow

import {Association} from 'sequelize'
import type {Model} from 'sequelize'
import * as graphql from 'graphql'
import {defaultArgs, resolver} from 'graphql-sequelize'

const {HasOne, BelongsTo, HasMany, BelongsToMany} = Association

type Options = {
  getType: (model: Class<Model<any>>) => ?Object,
  getArgs?: (model: Class<Model<any>>) => ?{[name: string]: any},
  getResolver?: (model: Class<Model<any>>, association: Association) => Function,
}

type Field = {
  type: Object,
  args?: {[name: string]: any},
  resolve: Function,
}

function associationFields(
  model: Class<Model<any>>,
  options: Options,
): {[name: string]: Field} {
  const {getType} = options
  const getArgs = options.getArgs || defaultArgs
  const getResolver = options.getResolver || ((model, association) => resolver(association))

  const result: {[name: string]: Field} = {}
  for (let key in model.associations) {
    const association = model.associations[key]
    const {target, as} = association

    let type = getType(target)
    if (!type) throw new Error(`missing type for model: ${target}`)

    const args = getArgs(target)

    const resolve = getResolver(target, association)
    if (!resolve) throw new Error(`missing resolver for model: ${target}, association: ${association}`)

    let fieldName

    if (association instanceof HasOne || association instanceof BelongsTo) {
      fieldName = typeof as === 'string' ? as : as.singular
    } else if (association instanceof HasMany || association instanceof BelongsToMany) {
      fieldName = typeof as === 'string' ? as : as.plural
      type = new graphql.GraphQLList(type)
    } else {
      // istanbul ignore next
      throw new Error('Unknown association type')
    }

    result[fieldName] = {type, resolve}
    if (args) result[fieldName].args = args
  }
  return result
}

module.exports = associationFields

