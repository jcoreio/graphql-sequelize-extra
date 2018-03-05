// @flow

import Sequelize, {Model} from 'sequelize'

export type WarehouseBranchInitAttributes = {
  WarehouseId: number;
  BranchId: number;
}

export type WarehouseBranchAttributes = WarehouseBranchInitAttributes & {

}

export default class WarehouseBranch extends Model<WarehouseBranchAttributes, WarehouseBranchInitAttributes> {
  WarehouseId: number;
  BranchId: number;

  static initAttributes({sequelize}: {sequelize: Sequelize}) {
    super.init({
      WarehouseId: {type: Sequelize.INTEGER, allowNull: true, references: 'Warehouse'},
      BranchId: {type: Sequelize.INTEGER, allowNull: true, references: 'Branch'},
    }, {
      sequelize,
    })
  }
}

