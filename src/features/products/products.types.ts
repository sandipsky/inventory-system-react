export interface IBonusInfo {
    /** Absent on entries that haven't been saved yet. */
    id?: number;
    min_quantity: number;
    bonus_quantity: number;
}

export interface IProducts {
    id: number;
    name: string;
    code: string;
    barcode: string;
    remarks: string;
    cost_price: number;
    selling_price: number;
    mrp: number;
    max_stock: number;
    min_stock: number;
    valuation_method: string;
    has_expiry_date: boolean;
    has_manufacturing_date: boolean;
    category_id: number;
    category_name: string;
    unit_id: number;
    unit_name: string;
    packing_id: number;
    packing_name: string;
    tax_type_id: number;
    tax_type_name: string;
    tax_rate: number;
    bonus_infos: IBonusInfo[];
    active: boolean;
    purchasable: boolean;
    sellable: boolean;
    batch_available: boolean;
    service_item: boolean;
    product_types: string[];
    is_batch_available: boolean;
    is_active: boolean;
}

export type IProductsBody = Partial<Omit<IProducts, 'id'>>;

export interface IProductsParams {
    pageIndex: number;
    pageSize: number;
    sort?: string;
    name?: string;
    is_active?: string;
}
