// @flow

import Sequelize, {Model, Association} from 'sequelize'
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

import Warehouse from './Warehouse'
import type {WarehouseAttributes, WarehouseInitAttributes} from './Warehouse'
import WarehouseBranch from './WarehouseBranch'
import type {WarehouseBranchAttributes, WarehouseBranchInitAttributes} from './WarehouseBranch'
import Customer from './Customer'
import type {CustomerAttributes, CustomerInitAttributes} from './Customer'
import BranchCustomer from './BranchCustomer'
import type {BranchCustomerAttributes, BranchCustomerInitAttributes} from './BranchCustomer'

export type BranchInitAttributes = {
  name: string;
}

export type BranchAttributes = BranchInitAttributes & {
  id: number;
}

export default class Branch extends Model<BranchAttributes, BranchInitAttributes> {
  name: string;
  id: number;

  static initAttributes({sequelize}: {sequelize: Sequelize}) {
    super.init({
      name: {type: Sequelize.STRING, allowNull: false},
    }, {sequelize})
  }

  static initAssociations() {
    this.Warehouses = this.belongsToMany(Warehouse, {through: WarehouseBranch})
    this.Customers = this.belongsToMany(Customer, {through: BranchCustomer})
  }

  static Warehouses: Association.BelongsToMany<BranchAttributes,
    BranchInitAttributes,
    Branch,
    WarehouseAttributes,
    WarehouseInitAttributes,
    Warehouse,
    WarehouseBranchAttributes,
    WarehouseBranch> = (null: any)

  getWarehouses: BelongsToManyGetMany<Warehouse>
  setWarehouses: BelongsToManySetMany<Warehouse, number, WarehouseBranchInitAttributes>
  addWarehouses: BelongsToManyAddMany<Warehouse, number, WarehouseBranchInitAttributes>
  addWarehouse: BelongsToManyAddOne<Warehouse, number, WarehouseBranchInitAttributes>
  createWarehouse: BelongsToManyCreateOne<WarehouseInitAttributes, Warehouse, WarehouseBranchInitAttributes>
  removeWarehouse: BelongsToManyRemoveOne<Warehouse, number>
  removeWarehouses: BelongsToManyRemoveMany<Warehouse, number>
  hasWarehouse: BelongsToManyHasOne<Warehouse, number>
  hasWarehouses: BelongsToManyHasMany<Warehouse, number>
  countWarehouses: BelongsToManyCount

  static Customers: Association.BelongsToMany<BranchAttributes,
    BranchInitAttributes,
    Branch,
    CustomerAttributes,
    CustomerInitAttributes,
    Customer,
    BranchCustomerAttributes,
    BranchCustomer> = (null: any)

  getCustomers: BelongsToManyGetMany<Customer>
  setCustomers: BelongsToManySetMany<Customer, number, BranchCustomerInitAttributes>
  addCustomers: BelongsToManyAddMany<Customer, number, BranchCustomerInitAttributes>
  addCustomer: BelongsToManyAddOne<Customer, number, BranchCustomerInitAttributes>
  createCustomer: BelongsToManyCreateOne<CustomerInitAttributes, Customer, BranchCustomerInitAttributes>
  removeCustomer: BelongsToManyRemoveOne<Customer, number>
  removeCustomers: BelongsToManyRemoveMany<Customer, number>
  hasCustomer: BelongsToManyHasOne<Customer, number>
  hasCustomers: BelongsToManyHasMany<Customer, number>
  countCustomers: BelongsToManyCount
}

