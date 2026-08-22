export interface IAccountMaster {
    id: number;
    account_name: string;
    account_code: string;
    account_type: string;
    parent_id: number | null;
    parent_account_name: string | null;
    remarks: string;
    deletable: boolean;
    is_system_generated: boolean;
    is_active: boolean;
}

export type IAccountMasterBody = Partial<Omit<IAccountMaster, 'id'>>;

export interface IAccountMasterParams {
    pageIndex: number;
    pageSize: number;
    sort?: string;
    name?: string;
    is_active?: string;
}

export interface IAccountTypeGroup {
    heading: string;
    types: string[];
}

export interface IParentAccount {
    id: number;
    name: string;
}
