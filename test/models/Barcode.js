// @flow

import Sequelize, {Model, Association} from 'sequelize'
import type {BelongsToGetOne, BelongsToSetOne, BelongsToCreateOne} from 'sequelize'

import type {ProductAttributes, ProductInitAttributes} from './Product'
import Product from './Product'

export type BarcodeInitAttributes = {
  value: string,
}

export type BarcodeAttributes = BarcodeInitAttributes & {
  id: number,
  ProductId: ?number,
}

export default class Barcode extends Model<BarcodeAttributes, BarcodeInitAttributes> {
  id: number
  value: string
  ProductId: ?number

  static initAttributes({sequelize}: {sequelize: Sequelize}) {
    super.init({
      value: {type: Sequelize.STRING, allowNull: false},
    }, {sequelize})
  }

  static initAssociations() {
    this.Product = this.belongsTo(Product)
  }

  static Product: Association.BelongsTo<Barcode, ProductAttributes, ProductInitAttributes, Product> = (null: any)

  getProduct: BelongsToGetOne<Product>
  setProduct: BelongsToSetOne<Product, number>
  createProduct: BelongsToCreateOne<ProductInitAttributes>
}

