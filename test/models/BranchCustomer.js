// @flow

import Sequelize, {Model} from 'sequelize'

export type BranchCustomerInitAttributes = {
  BranchId: number;
  CustomerId: number;
}

export type BranchCustomerAttributes = BranchCustomerInitAttributes & {
}

export default class BranchCustomer extends Model<BranchCustomerAttributes, BranchCustomerInitAttributes> {
  BranchId: number;
  CustomerId: number;

  static initAttributes({sequelize}: {sequelize: Sequelize}) {
    super.init({
      BranchId: {type: Sequelize.INTEGER, allowNull: false, references: 'Branch'},
      CustomerId: {type: Sequelize.INTEGER, allowNull: false, references: 'Customer'},
    }, {sequelize})
  }
}


