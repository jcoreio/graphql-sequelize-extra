// @flow

import Sequelize, { Model, Association } from 'sequelize'
import type { HasOneGetOne, HasOneSetOne, HasOneCreateOne } from 'sequelize'
import type {
  BelongsToGetOne,
  BelongsToSetOne,
  BelongsToCreateOne,
} from 'sequelize'

import type { BarcodeAttributes, BarcodeInitAttributes } from './Barcode'
import Barcode from './Barcode'
import Warehouse from './Warehouse'
import type { WarehouseAttributes, WarehouseInitAttributes } from './Warehouse'

export type ProductInitAttributes = {
  name: string,
  weight: number,
}

export type ProductAttributes = ProductInitAttributes & {
  id: number,
  WarehouseId: ?number,
}

export default class Product extends Model<
  ProductAttributes,
  ProductInitAttributes
> {
  id: number
  name: string
  weight: number
  WarehouseId: ?number

  static initAttributes({ sequelize }: { sequelize: Sequelize }) {
    super.init(
      {
        name: { type: Sequelize.STRING, allowNull: false },
        weight: { type: Sequelize.DECIMAL, allowNull: false },
      },
      { sequelize }
    )
  }

  static initAssociations() {
    this.Barcode = this.hasOne(Barcode)
    this.Warehouse = this.belongsTo(Warehouse)
  }

  static Barcode: Association.HasOne<
    Product,
    BarcodeAttributes,
    BarcodeInitAttributes,
    Barcode
  > = (null: any)

  getBarcode: HasOneGetOne<Barcode>
  setBarcode: HasOneSetOne<Barcode, number>
  createBarcode: HasOneCreateOne<BarcodeInitAttributes>

  static Warehouse: Association.BelongsTo<
    Product,
    WarehouseAttributes,
    WarehouseInitAttributes,
    Warehouse
  > = (null: any)

  getWarehouse: BelongsToGetOne<Warehouse>
  setWarehouse: BelongsToSetOne<Warehouse, number>
  createWarehouse: BelongsToCreateOne<WarehouseInitAttributes>
}
