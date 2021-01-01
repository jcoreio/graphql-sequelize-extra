// @flow

import { describe, it, before } from 'mocha'
import { expect } from 'chai'
import type { Model } from 'sequelize'
import * as graphql from 'graphql'
import mapValues from 'lodash.mapvalues'
import Sequelize from 'sequelize'

import glob from 'glob'
import path from 'path'

import { attributeFieldsForUpdate } from '../src'

describe('attributeFieldsForUpdate', () => {
  let sequelize
  let models

  before(() => {
    sequelize = new Sequelize('sqlite::memory:')

    const modelFiles = glob.sync(path.join(__dirname, 'models', '*.js'))
    modelFiles.forEach((file: string) => {
      // $FlowFixMe
      const model = require(file).default
      if (model && model.initAttributes) model.initAttributes({ sequelize })
    })
    modelFiles.forEach((file: string) => {
      // $FlowFixMe
      const model = require(file).default
      if (model && model.initAssociations) model.initAssociations()
    })

    models = sequelize.models
  })

  it('works', () => {
    const fields = mapValues(models, (model: Class<Model<any>>) =>
      attributeFieldsForUpdate(model)
    )
    expect(fields.Customer.firstName).to.deep.equal({
      type: graphql.GraphQLString,
    })
    expect(fields.Customer.lastName).to.deep.equal({
      type: graphql.GraphQLString,
    })
    expect(fields.Customer.address).to.deep.equal({
      type: graphql.GraphQLString,
    })
    expect(fields.Customer.phone).to.deep.equal({
      type: graphql.GraphQLString,
    })
    expect(fields.Customer.id).to.deep.equal({
      type: graphql.GraphQLInt,
    })
    expect(fields.Customer.updatedAt).to.not.exist
    expect(fields.Customer.updatedAt).to.not.exist
  })
  it('supports exclude array', () => {
    const fields = mapValues(models, (model: Class<Model<any>>) =>
      attributeFieldsForUpdate(model, {
        exclude: ['lastName', 'phone'],
      })
    )
    expect(fields.Customer.firstName).to.deep.equal({
      type: graphql.GraphQLString,
    })
    expect(fields.Customer.lastName).to.not.exist
    expect(fields.Customer.address).to.deep.equal({
      type: graphql.GraphQLString,
    })
    expect(fields.Customer.phone).to.not.exist
    expect(fields.Customer.id).to.deep.equal({
      type: graphql.GraphQLInt,
    })
    expect(fields.Customer.updatedAt).to.not.exist
    expect(fields.Customer.updatedAt).to.not.exist
  })
  it('supports exclude function', () => {
    const fields = mapValues(models, (model: Class<Model<any>>) =>
      attributeFieldsForUpdate(model, {
        exclude: (key) => key === 'lastName' || key === 'phone',
      })
    )
    expect(fields.Customer.firstName).to.deep.equal({
      type: graphql.GraphQLString,
    })
    expect(fields.Customer.lastName).to.not.exist
    expect(fields.Customer.address).to.deep.equal({
      type: graphql.GraphQLString,
    })
    expect(fields.Customer.phone).to.not.exist
    expect(fields.Customer.id).to.deep.equal({
      type: graphql.GraphQLInt,
    })
    expect(fields.Customer.updatedAt).to.not.exist
    expect(fields.Customer.updatedAt).to.not.exist
  })
})
