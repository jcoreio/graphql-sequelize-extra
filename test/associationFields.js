// @flow

import { describe, it, before } from 'mocha'
import { expect } from 'chai'
import type { Model } from 'sequelize'
import * as graphql from 'graphql'
import { attributeFields } from '@jcoreio/graphql-sequelize'
import mapValues from 'lodash.mapvalues'
import Sequelize from 'sequelize'

import glob from 'glob'
import path from 'path'

import { associationFields } from '../src'

describe('associationFields', () => {
  let types = {}
  let sequelize
  let models

  function getType(model: Class<Model<any>>): ?Object {
    return types[model.name]
  }

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

    types = mapValues(
      models,
      (model: Class<Model<any>>) =>
        new graphql.GraphQLObjectType({
          name: model.name,
          fields: () => ({
            ...attributeFields(model),
            ...associationFields(model, { getType }),
          }),
        })
    )
  })
  it('works for belongsToMany associations', () => {
    var fields = associationFields(models.Warehouse, { getType })

    expect(fields.Branches).to.exist
    expect(fields.Branches.type).to.be.an.instanceof(graphql.GraphQLList)
  })
  it('works for hasMany associations', () => {
    var fields = associationFields(models.Warehouse, { getType })

    expect(fields.Products).to.exist
    expect(fields.Products.type).to.be.an.instanceof(graphql.GraphQLList)
  })
  it('works for hasOne associations', () => {
    var fields = associationFields(models.Product, { getType })

    expect(fields.Barcode).to.exist
    expect(fields.Barcode.type).to.equal(types.Barcode)
  })
  it('works for belongsTo associations', () => {
    var fields = associationFields(models.Barcode, { getType })

    expect(fields.Product).to.exist
    expect(fields.Product.type).to.equal(types.Product)
  })
})
