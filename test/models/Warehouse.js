// @flow

import Sequelize, {Model, Association} from 'sequelize'
import type {
  HasManyGetMany,
  HasManySetMany,
  HasManyAddMany,
  HasManyAddOne,
  HasManyCreateOne,
  HasManyRemoveOne,
  HasManyRemoveMany,
  HasManyHasOne,
  HasManyHasMany,
  HasManyCount,
} from 'sequelize'
import type {
  BelongsToManyGetMany,
  BelongsToManySetMany,
  BelongsToManyAddMany,
  BelongsToManyAddOne,
  BelongsToManyCreateOne,
  BelongsToManyRemoveOne,
  BelongsToManyRemoveMany,
  BelongsToManyHasOne,
  BelongsToManyHasMany,
  BelongsToManyCount,
} from 'sequelize'

import Product from './Product'
import type {ProductAttributes, ProductInitAttributes} from './Product'
import Branch from './Branch'
import type {BranchAttributes, BranchInitAttributes} from './Branch'
import WarehouseBranch from './WarehouseBranch'
import type {WarehouseBranchAttributes, WarehouseBranchInitAttributes} from './WarehouseBranch'

export type WarehouseInitAttributes = {
  address: string,
}

export type WarehouseAttributes = WarehouseInitAttributes & {
  id: number,
  squareFootage: ?string,
}

export default class Warehouse extends Model<WarehouseAttributes, WarehouseInitAttributes> {
  id: number
  squareFootage: ?string
  address: string

  static initAssociations() {
    this.Products = this.hasMany(Product)
    this.Branches = this.belongsToMany(Branch, {through: WarehouseBranch})
  }

  static Products: Association.HasMany<Warehouse, ProductAttributes, ProductInitAttributes, Product> = (null: any)

  getProducts: HasManyGetMany<Product>
  setProducts: HasManySetMany<Product, number>
  addProducts: HasManyAddMany<Product, number>
  addProduct: HasManyAddOne<Product, number>
  createProduct: HasManyCreateOne<ProductInitAttributes, Product>
  removeProduct: HasManyRemoveOne<Product, number>
  removeProducts: HasManyRemoveMany<Product, number>
  hasProduct: HasManyHasOne<Product, number>
  hasProducts: HasManyHasMany<Product, number>
  countProducts: HasManyCount

  static initAttributes({sequelize}: {sequelize: Sequelize}) {
    Warehouse.init({
      address: {type: Sequelize.STRING, allowNull: false},
      squareFootage: {type: Sequelize.DECIMAL},
    }, {sequelize})
  }

  static Branches: Association.BelongsToMany<WarehouseAttributes,
    WarehouseInitAttributes,
    Warehouse,
    BranchAttributes,
    BranchInitAttributes,
    Branch,
    WarehouseBranchAttributes,
    WarehouseBranch> = (null: any)

  getBranches: BelongsToManyGetMany<Branch>
  setBranches: BelongsToManySetMany<Branch, number, WarehouseBranchInitAttributes>
  addBranches: BelongsToManyAddMany<Branch, number, WarehouseBranchInitAttributes>
  addBranch: BelongsToManyAddOne<Branch, number, WarehouseBranchInitAttributes>
  createBranch: BelongsToManyCreateOne<BranchInitAttributes, Branch, WarehouseBranchInitAttributes>
  removeBranch: BelongsToManyRemoveOne<Branch, number>
  removeBranches: BelongsToManyRemoveMany<Branch, number>
  hasBranch: BelongsToManyHasOne<Branch, number>
  hasBranches: BelongsToManyHasMany<Branch, number>
  countBranches: BelongsToManyCount
}

