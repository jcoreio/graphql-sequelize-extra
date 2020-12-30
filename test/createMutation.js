// @flow

import {describe, it, before} from 'mocha'
import {expect} from 'chai'
import type {Model} from 'sequelize'
import * as graphql from 'graphql'
import {attributeFields, resolver} from 'graphql-sequelize'
import Sequelize from 'sequelize'

import glob from 'glob'
import path from 'path'

import {createMutation, associationFields, attributeFieldsForCreate} from '../src'

describe('createMutation', () => {
  let types = {}
  let queryFields = {}
  let sequelize
  let models

  function getType(model: Class<Model<any>>): ?Object {
    return types[model.name]
  }

  before(async (): Promise<void> => {
    sequelize = new Sequelize('sqlite::memory:')

    const modelFiles = glob.sync(path.join(__dirname, 'models', '*.js'))
    modelFiles.forEach((file: string) => {
      // $FlowFixMe
      const model = require(file).default
      if (model && model.initAttributes) model.initAttributes({sequelize})
    })
    modelFiles.forEach((file: string) => {
      // $FlowFixMe
      const model = require(file).default
      if (model && model.initAssociations) model.initAssociations()
    })

    models = sequelize.models

    await sequelize.sync()

    for (let key in models) {
      const model = models[key]
      const type = new graphql.GraphQLObjectType({
        name: model.options.name.singular,
        fields: () => ({
          ...attributeFields(model),
          ...associationFields(model, {getType}),
        })
      })
      types[type.name] = type
      const inputType = new graphql.GraphQLInputObjectType({
        name: `Create${model.options.name.singular}`,
        fields: () => attributeFieldsForCreate(model),
      })
      types[inputType.name] = inputType
      queryFields[model.options.name.singular] = {
        type,
        resolve: resolver(model),
      }
    }
  })

  after(async (): Promise<void> => {
    if (sequelize) await sequelize.close()
  })

  describe('without extra options', () => {
    let schema: graphql.GraphQLSchema

    before(() => {
      let mutationFields = {}

      for (let key in models) {
        const model = models[key]
        const type = types[model.options.name.singular]
        const inputType = types[`Create${model.options.name.singular}`]
        mutationFields[`create${model.options.name.singular}`] = createMutation({
          inputType,
          returnType: type,
          model,
        })
      }

      schema = new graphql.GraphQLSchema({
        query: new graphql.GraphQLObjectType({
          name: 'query',
          fields: queryFields,
        }),
        mutation: new graphql.GraphQLObjectType({
          name: 'mutation',
          fields: mutationFields,
        }),
      })
    })
    it('works', async (): Promise<void> => {
      const result: any = await graphql.graphql(schema, `mutation {
        createCustomer(values: {
          firstName: "Andy",
          lastName: "Edwards",
          address: "Wouldn't you like to know!",
        }) {
          firstName
          lastName
          address
          phone 
        }
      }`)
      expect(result.data.createCustomer).to.deep.equal({
        firstName: 'Andy',
        lastName: 'Edwards',
        address: "Wouldn't you like to know!",
        phone: null,
      })
    })
  })
  describe('with valuesArgName option', () => {
    let schema: graphql.GraphQLSchema
    before(() => {
      let mutationFields = {}

      for (let key in models) {
        const model = models[key]
        const type = types[model.options.name.singular]
        const inputType = types[`Create${model.options.name.singular}`]
        mutationFields[`create${model.options.name.singular}`] = createMutation({
          inputType,
          returnType: type,
          model,
          valuesArgName: model.options.name.singular,
        })
      }

      schema = new graphql.GraphQLSchema({
        query: new graphql.GraphQLObjectType({
          name: 'query',
          fields: queryFields,
        }),
        mutation: new graphql.GraphQLObjectType({
          name: 'mutation',
          fields: mutationFields,
        }),
      })
    })
    it('works', async (): Promise<void> => {
      const result: any = await graphql.graphql(schema, `mutation {
        createCustomer(Customer: {
          firstName: "Andy",
          lastName: "Edwards",
          address: "Wouldn't you like to know!",
        }) {
          firstName
          lastName
          address
          phone 
        }
      }`)
      expect(result.data.createCustomer).to.deep.equal({
        firstName: 'Andy',
        lastName: 'Edwards',
        address: "Wouldn't you like to know!",
        phone: null,
      })
    })
  })
  describe('with before hook', () => {
    let schema: graphql.GraphQLSchema
    before(() => {
      let mutationFields = {}

      for (let key in models) {
        const model = models[key]
        const type = types[model.options.name.singular]
        const inputType = types[`Create${model.options.name.singular}`]
        mutationFields[`create${model.options.name.singular}`] = createMutation({
          inputType,
          returnType: type,
          model,
          before: (source: any, {values}: {values: Object}) => {
            const result = {}
            for (let key in values) {
              if (typeof values[key] === 'string') result[key] = values[key].toUpperCase()
              else result[key] = values[key]
            }
            return result
          },
        })
      }

      schema = new graphql.GraphQLSchema({
        query: new graphql.GraphQLObjectType({
          name: 'query',
          fields: queryFields,
        }),
        mutation: new graphql.GraphQLObjectType({
          name: 'mutation',
          fields: mutationFields,
        }),
      })
    })
    it('works', async (): Promise<void> => {
      const result: any = await graphql.graphql(schema, `mutation {
        createCustomer(values: {
          firstName: "Andy",
          lastName: "Edwards",
          address: "Wouldn't you like to know!",
        }) {
          firstName
          lastName
          address
          phone 
        }
      }`)
      expect(result.data.createCustomer).to.deep.equal({
        firstName: 'ANDY',
        lastName: 'EDWARDS',
        address: "WOULDN'T YOU LIKE TO KNOW!",
        phone: null,
      })
    })
  })
  describe('with after hook', () => {
    let schema: graphql.GraphQLSchema
    before(() => {
      let mutationFields = {}

      for (let key in models) {
        const model = models[key]
        const type = types[model.options.name.singular]
        const inputType = types[`Create${model.options.name.singular}`]
        mutationFields[`create${model.options.name.singular}`] = createMutation({
          inputType,
          returnType: type,
          model,
          after: (instance: any) => {
            return instance.get({plain: true, raw: true})
          }
        })
      }

      schema = new graphql.GraphQLSchema({
        query: new graphql.GraphQLObjectType({
          name: 'query',
          fields: queryFields,
        }),
        mutation: new graphql.GraphQLObjectType({
          name: 'mutation',
          fields: mutationFields,
        }),
      })
    })
    it('works', async (): Promise<void> => {
      const result: any = await graphql.graphql(schema, `mutation {
        createCustomer(values: {
          firstName: "Andy",
          lastName: "Edwards",
          address: "Wouldn't you like to know!",
        }) {
          firstName
          lastName
          address
          phone 
        }
      }`)
      expect(result.data.createCustomer).to.deep.equal({
        firstName: 'Andy',
        lastName: 'Edwards',
        address: "Wouldn't you like to know!",
        phone: null,
      })
    })
  })
})

