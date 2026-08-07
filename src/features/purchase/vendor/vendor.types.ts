export interface IVendor {
    id: number;
    name: string;
    contact: string;
    address: string;
    email: string;
    remarks: string;
    active: boolean;
    registration_number: string;
    is_active: boolean;
}

export type IVendorBody = Partial<Omit<IVendor, 'id'>>;

export interface IVendorParams {
    pageIndex: number;
    pageSize: number;
    sort?: string;
    name?: string;
    is_active?: string;
}
