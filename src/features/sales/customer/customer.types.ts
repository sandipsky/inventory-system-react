export interface ICustomer {
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

export type ICustomerBody = Partial<Omit<ICustomer, 'id'>>;

export interface ICustomerParams {
    pageIndex: number;
    pageSize: number;
    sort?: string;
    name?: string;
    is_active?: string;
}
