# @jcoreio/graphql-sequelize-extra

[![Build Status](https://travis-ci.org/jcoreio/graphql-sequelize-extra.svg?branch=master)](https://travis-ci.org/jcoreio/graphql-sequelize-extra)
[![Coverage Status](https://codecov.io/gh/jcoreio/graphql-sequelize-extra/branch/master/graph/badge.svg)](https://codecov.io/gh/jcoreio/graphql-sequelize-extra)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

some missing pieces of the graphql-sequelize bridge

# Installation

```sh
npm install --save @jcoreio/graphql-sequelize-extra
```

# API

## `associationFields(model, options)`

```js
const {associationFields} = require('@jcoreio/graphql-sequelize-extra')
```

Creates GraphQL fields for the given sequelize `model`'s `associations`.

### Arguments

#### `model: Class<Sequelize.Model<any>>`

#### `options: Object`
##### `options.getType: (model: Class<Sequelize.Model<any>>) => Object` (required)
Gets the GraphQL type for the given sequelize model.

##### `options.getArgs: (model: Class<Sequelize.Model<any>>) => Object` (optional)
Gets the GraphQL args for the given sequelize model.

##### `options.getResolver: (model: Class<Sequelize.Model<any>>, association: Sequelize.Association) => Function` (optional)
Gets the GraphQL `resolve` function for the given sequelize model and association.

### Returns
A plain object of GraphQL fields for the given `model`'s
`associations`.

### Advice
You should use `associationFields` within a `fields` thunk since it some
types it needs would fail to be defined if there are circular
associations:

```js
const {models} = sequelize

function getType(model) {
  return types[model.name]
}

const types = mapValues(models,
  (model) => new graphql.GraphQLObjectType({
    name: model.name,
    fields: () => ({
      ...attributeFields(model),
      ...associationFields(model, {getType}),
    })
  })
)
```

If you have circular associations, you should [use some form of
nested GraphQL query attack prevention](https://stackoverflow.com/questions/37337466/how-do-you-prevent-nested-attack-on-graphql-apollo-server).
