// @flow

import requireEnv from '@jcoreio/require-env'
import {describe, it, before} from 'mocha'
import {expect} from 'chai'
import type {Model} from 'sequelize'
import * as graphql from 'graphql'
import {attributeFields, resolver} from 'graphql-sequelize'
import Sequelize from 'sequelize'
import Customer from './models/Customer'

import glob from 'glob'
import path from 'path'

import initDatabase from './util/initDatabase'

import {updateOneMutation, associationFields, attributeFieldsForUpdate} from '../src'

describe('updateOneMutation', () => {
  let types = {}
  let queryFields = {}
  let sequelize
  let models

  function getType(model: Class<Model<any>>): ?Object {
    return types[model.name]
  }

  before(async (): Promise<void> => {
    await initDatabase()

    const host = requireEnv('DB_HOST')
    const database = requireEnv('DB_NAME')
    const user = requireEnv('DB_USER')
    const password = requireEnv('DB_PASSWORD')
    sequelize = new Sequelize(database, user, password, {
      host,
      dialect: 'postgres'
    })

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
        name: `Update${model.options.name.singular}`,
        fields: () => attributeFieldsForUpdate(model),
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
        const inputType = types[`Update${model.options.name.singular}`]
        mutationFields[`update${model.options.name.singular}`] = updateOneMutation({
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
    it('throws if no id or where is provided', async (): Promise<void> => {
      const result: any = await graphql.graphql(
        schema,
        `mutation update {
          updateCustomer(values: {
            firstName: "Andork",
          }) {
            firstName
          }
        }`)
      expect(result.errors).to.exist
      expect(result.data.updateCustomer).to.equal(null)
    })
    it('allows passing id separately', async (): Promise<void> => {
      const {id} = await Customer.create({
        firstName: "Andy",
        lastName: "Edwards",
        address: "Wouldn't you like to know!",
      })

      const result: any = await graphql.graphql(
        schema,
        `mutation update($id: Int!) {
          updateCustomer(id: $id, values: {
            firstName: "Andork",
          }) {
            firstName
            lastName
            address
            phone 
          }
        }`,
        null,
        null,
        {id})

      expect(result.data.updateCustomer).to.deep.equal({
        firstName: 'Andork',
        lastName: 'Edwards',
        address: "Wouldn't you like to know!",
        phone: null,
      })
    })
    it('allows passing id as part of values', async (): Promise<void> => {
      const {id} = await Customer.create({
        firstName: "Andy",
        lastName: "Edwards",
        address: "Wouldn't you like to know!",
      })

      const result: any = await graphql.graphql(
        schema,
        `mutation update($values: UpdateCustomer!) {
          updateCustomer(values: $values) {
            firstName
            lastName
            address
            phone 
          }
        }`,
        null,
        null,
        {values: {id, firstName: 'Andork'}})

      expect(result.data.updateCustomer).to.deep.equal({
        firstName: 'Andork',
        lastName: 'Edwards',
        address: "Wouldn't you like to know!",
        phone: null,
      })
    })
    it('allows passing id as part of where clause', async (): Promise<void> => {
      const {id} = await Customer.create({
        firstName: "Andy",
        lastName: "Edwards",
        address: "Wouldn't you like to know!",
      })

      const result: any = await graphql.graphql(
        schema,
        `mutation update($where: SequelizeJSON!, $values: UpdateCustomer!) {
          updateCustomer(where: $where, values: $values) {
            firstName
            lastName
            address
            phone 
          }
        }`,
        null,
        null,
        {where: {id}, values: {firstName: 'Andork'}})

      expect(result.data.updateCustomer).to.deep.equal({
        firstName: 'Andork',
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
        const inputType = types[`Update${model.options.name.singular}`]
        mutationFields[`update${model.options.name.singular}`] = updateOneMutation({
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
    it('allows passing id separately', async (): Promise<void> => {
      const {id} = await Customer.create({
        firstName: "Andy",
        lastName: "Edwards",
        address: "Wouldn't you like to know!",
      })

      const result: any = await graphql.graphql(
        schema,
        `mutation update($id: Int!) {
          updateCustomer(id: $id, values: {
            firstName: "Andork",
          }) {
            firstName
            lastName
            address
            phone 
          }
        }`,
        null,
        null,
        {id})

      expect(result.data.updateCustomer).to.deep.equal({
        firstName: "ANDORK",
        lastName: "Edwards",
        address: "Wouldn't you like to know!",
        phone: null,
      })
    })
    it('allows passing id as part of values', async (): Promise<void> => {
      const {id} = await Customer.create({
        firstName: 'Andy',
        lastName: 'Edwards',
        address: "Wouldn't you like to know!",
      })

      const result: any = await graphql.graphql(
        schema,
        `mutation update($values: UpdateCustomer!) {
          updateCustomer(values: $values) {
            firstName
            lastName
            address
            phone 
          }
        }`,
        null,
        null,
        {values: {id, firstName: 'Andork'}})

      expect(result.data.updateCustomer).to.deep.equal({
        firstName: "ANDORK",
        lastName: "Edwards",
        address: "Wouldn't you like to know!",
        phone: null,
      })
    })
    it('allows passing id as part of where clause', async (): Promise<void> => {
      const {id} = await Customer.create({
        firstName: "Andy",
        lastName: "Edwards",
        address: "Wouldn't you like to know!",
      })

      const result: any = await graphql.graphql(
        schema,
        `mutation update($where: SequelizeJSON!, $values: UpdateCustomer!) {
          updateCustomer(where: $where, values: $values) {
            firstName
            lastName
            address
            phone 
          }
        }`,
        null,
        null,
        {where: {id}, values: {firstName: 'Andork'}})

      expect(result.data.updateCustomer).to.deep.equal({
        firstName: "ANDORK",
        lastName: "Edwards",
        address: "Wouldn't you like to know!",
        phone: null,
      })
    })
  })
  describe('with after hook', () => {
    let schema: graphql.GraphQLSchema

    before(() => {
      let mutationFields = {}

      function upper(s: ?string): ?string {
        return s && s.toUpperCase()
      }

      for (let key in models) {
        const model = models[key]
        const type = types[model.options.name.singular]
        const inputType = types[`Update${model.options.name.singular}`]
        mutationFields[`update${model.options.name.singular}`] = updateOneMutation({
          inputType,
          returnType: type,
          model,
          after: (instance: any) => ({
            firstName: upper(instance.firstName),
            lastName: upper(instance.lastName),
            address: upper(instance.address),
            phone: upper(instance.phone),
          }),
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
    it('allows passing id separately', async (): Promise<void> => {
      const {id} = await Customer.create({
        firstName: "Andy",
        lastName: "Edwards",
        address: "Wouldn't you like to know!",
      })

      const result: any = await graphql.graphql(
        schema,
        `mutation update($id: Int!) {
          updateCustomer(id: $id, values: {
            firstName: "Andork",
          }) {
            firstName
            lastName
            address
            phone 
          }
        }`,
        null,
        null,
        {id})

      expect(result.data.updateCustomer).to.deep.equal({
        firstName: "ANDORK",
        lastName: "EDWARDS",
        address: "WOULDN'T YOU LIKE TO KNOW!",
        phone: null,
      })
    })
    it('allows passing id as part of values', async (): Promise<void> => {
      const {id} = await Customer.create({
        firstName: 'Andy',
        lastName: 'Edwards',
        address: "Wouldn't you like to know!",
      })

      const result: any = await graphql.graphql(
        schema,
        `mutation update($values: UpdateCustomer!) {
          updateCustomer(values: $values) {
            firstName
            lastName
            address
            phone 
          }
        }`,
        null,
        null,
        {values: {id, firstName: 'Andork'}})

      expect(result.data.updateCustomer).to.deep.equal({
        firstName: "ANDORK",
        lastName: "EDWARDS",
        address: "WOULDN'T YOU LIKE TO KNOW!",
        phone: null,
      })
    })
    it('allows passing id as part of where clause', async (): Promise<void> => {
      const {id} = await Customer.create({
        firstName: "Andy",
        lastName: "Edwards",
        address: "Wouldn't you like to know!",
      })

      const result: any = await graphql.graphql(
        schema,
        `mutation update($where: SequelizeJSON!, $values: UpdateCustomer!) {
          updateCustomer(where: $where, values: $values) {
            firstName
            lastName
            address
            phone 
          }
        }`,
        null,
        null,
        {where: {id}, values: {firstName: 'Andork'}})

      expect(result.data.updateCustomer).to.deep.equal({
        firstName: "ANDORK",
        lastName: "EDWARDS",
        address: "WOULDN'T YOU LIKE TO KNOW!",
        phone: null,
      })
    })
  })
  describe('with returning: true', () => {
    let schema: graphql.GraphQLSchema

    before(() => {
      let mutationFields = {}

      for (let key in models) {
        const model = models[key]
        const type = types[model.options.name.singular]
        const inputType = types[`Update${model.options.name.singular}`]
        mutationFields[`update${model.options.name.singular}`] = updateOneMutation({
          inputType,
          returnType: type,
          model,
          updateOptions: {returning: true}
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
    it('allows passing id separately', async (): Promise<void> => {
      const {id} = await Customer.create({
        firstName: "Andy",
        lastName: "Edwards",
        address: "Wouldn't you like to know!",
      })

      const result: any = await graphql.graphql(
        schema,
        `mutation update($id: Int!) {
          updateCustomer(id: $id, values: {
            firstName: "Andork",
          }) {
            firstName
            lastName
            address
            phone 
          }
        }`,
        null,
        null,
        {id})

      expect(result.data.updateCustomer).to.deep.equal({
        firstName: 'Andork',
        lastName: 'Edwards',
        address: "Wouldn't you like to know!",
        phone: null,
      })
    })
    it('allows passing id as part of values', async (): Promise<void> => {
      const {id} = await Customer.create({
        firstName: "Andy",
        lastName: "Edwards",
        address: "Wouldn't you like to know!",
      })

      const result: any = await graphql.graphql(
        schema,
        `mutation update($values: UpdateCustomer!) {
          updateCustomer(values: $values) {
            firstName
            lastName
            address
            phone 
          }
        }`,
        null,
        null,
        {values: {id, firstName: 'Andork'}})

      expect(result.data.updateCustomer).to.deep.equal({
        firstName: 'Andork',
        lastName: 'Edwards',
        address: "Wouldn't you like to know!",
        phone: null,
      })
    })
    it('allows passing id as part of where clause', async (): Promise<void> => {
      const {id} = await Customer.create({
        firstName: "Andy",
        lastName: "Edwards",
        address: "Wouldn't you like to know!",
      })

      const result: any = await graphql.graphql(
        schema,
        `mutation update($where: SequelizeJSON!, $values: UpdateCustomer!) {
          updateCustomer(where: $where, values: $values) {
            firstName
            lastName
            address
            phone 
          }
        }`,
        null,
        null,
        {where: {id}, values: {firstName: 'Andork'}})

      expect(result.data.updateCustomer).to.deep.equal({
        firstName: 'Andork',
        lastName: 'Edwards',
        address: "Wouldn't you like to know!",
        phone: null,
      })
    })
  })
})
