// @flow

import {describe, it, before} from 'mocha'
import {expect} from 'chai'
import type {Model} from 'sequelize'
import * as graphql from 'graphql'
import {attributeFields, resolver} from 'graphql-sequelize'
import Sequelize from 'sequelize'
import Customer from './models/Customer'

import glob from 'glob'
import path from 'path'

import {destroyMutation, associationFields} from '../src'

describe('destroyMutation', () => {
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
        mutationFields[`destroy${model.options.name.singular}`] = destroyMutation({model})
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
        `mutation destroy {
          destroyCustomer
        }`)
      expect(result.errors).to.exist
      expect(result.data).to.equal(null)
    })
    it('allows passing id separately', async (): Promise<void> => {
      const {id} = await Customer.create({
        firstName: "Andy",
        lastName: "Edwards",
        address: "Wouldn't you like to know!",
      })

      const result: any = await graphql.graphql(
        schema,
        `mutation destroy($id: Int!) {
          destroyCustomer(id: $id)
        }`,
        null,
        null,
        {id})

      expect(result.data.destroyCustomer).to.equal(1)
      expect(await Customer.findOne({where: {id}})).to.not.exist
    })
    it('allows passing where clause', async (): Promise<void> => {
      const {id} = await Customer.create({
        firstName: "Andy",
        lastName: "Edwards",
        address: "Wouldn't you like to know!",
      })

      const result: any = await graphql.graphql(
        schema,
        `mutation destroy($where: SequelizeJSON!) {
          destroyCustomer(where: $where)
        }`,
        null,
        null,
        {where: {id}})

      expect(result.data.destroyCustomer).to.equal(1)
      expect(await Customer.findOne({where: {id}})).to.not.exist
    })
    it('can destroy multiple', async (): Promise<void> => {
      await Customer.create({
        firstName: "Andy",
        lastName: "Edwards",
        address: "Wouldn't you like to know!",
      })
      await Customer.create({
        firstName: "Andy",
        lastName: "Edwards",
        address: "Wouldn't you like to know!",
      })

      const result: any = await graphql.graphql(
        schema,
        `mutation destroy($where: SequelizeJSON!) {
          destroyCustomer(where: $where)
        }`,
        null,
        null,
        {where: {firstName: 'Andy'}})

      expect(result.data.destroyCustomer).to.be.above(1)
      expect(await Customer.findOne({where: {firstName: 'Andy'}})).to.not.exist
    })
  })

  describe('without before hook', () => {
    let schema: graphql.GraphQLSchema

    before(() => {
      let mutationFields = {}

      for (let key in models) {
        const model = models[key]
        mutationFields[`destroy${model.options.name.singular}`] = destroyMutation({
          model,
          before: (source: any, args: any, context: Object) => {
            if (context.userId == null) throw new Error('you must be logged in to destroy')
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
    it("throws if userId isn't given", async (): Promise<void> => {
      const {id} = await Customer.create({
        firstName: "Andy",
        lastName: "Edwards",
        address: "Wouldn't you like to know!",
      })

      const errorResult: any = await graphql.graphql(
        schema,
        `mutation destroy($id: Int!) {
          destroyCustomer(id: $id)
        }`,
        null,
        null,
        {id})

      expect(errorResult.errors).to.exist
      expect(errorResult.data).to.not.exist

      const result: any = await graphql.graphql(
        schema,
        `mutation destroy($id: Int!) {
          destroyCustomer(id: $id)
        }`,
        null,
        {userId: 1},
        {id})

      expect(result.data.destroyCustomer).to.equal(1)
      expect(await Customer.findOne({where: {id}})).to.not.exist
    })
  })
})

