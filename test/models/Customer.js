// @flow

import Sequelize, { Model, Association } from 'sequelize'
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

import BranchCustomer from './BranchCustomer'
import type {
  BranchCustomerAttributes,
  BranchCustomerInitAttributes,
} from './BranchCustomer'
import Branch from './Branch'
import type { BranchAttributes, BranchInitAttributes } from './Branch'

export type CustomerInitAttributes = {
  firstName: string,
  lastName: string,
}

export type CustomerAttributes = CustomerInitAttributes & {
  id: number,
  address: ?string,
  phone: ?string,
}

export default class Customer extends Model<
  CustomerAttributes,
  CustomerInitAttributes
> {
  firstName: string
  lastName: string
  id: number
  address: ?string
  phone: ?string

  static initAttributes({ sequelize }: { sequelize: Sequelize }) {
    super.init(
      {
        firstName: { type: Sequelize.STRING, allowNull: false },
        lastName: { type: Sequelize.STRING, allowNull: false },
        address: { type: Sequelize.STRING },
        phone: { type: Sequelize.STRING },
      },
      { sequelize }
    )
  }

  static initAssociations() {
    this.Branches = this.belongsToMany(Branch, { through: BranchCustomer })
  }

  static Branches: Association.BelongsToMany<
    CustomerAttributes,
    CustomerInitAttributes,
    Customer,
    BranchAttributes,
    BranchInitAttributes,
    Branch,
    BranchCustomerAttributes,
    BranchCustomer
  > = (null: any)

  getBranches: BelongsToManyGetMany<Branch>
  setBranches: BelongsToManySetMany<
    Branch,
    number,
    BranchCustomerInitAttributes
  >
  addBranches: BelongsToManyAddMany<
    Branch,
    number,
    BranchCustomerInitAttributes
  >
  addBranch: BelongsToManyAddOne<Branch, number, BranchCustomerInitAttributes>
  createBranch: BelongsToManyCreateOne<
    BranchInitAttributes,
    Branch,
    BranchCustomerInitAttributes
  >
  removeBranch: BelongsToManyRemoveOne<Branch, number>
  removeBranches: BelongsToManyRemoveMany<Branch, number>
  hasBranch: BelongsToManyHasOne<Branch, number>
  hasBranches: BelongsToManyHasMany<Branch, number>
  countBranches: BelongsToManyCount
}
