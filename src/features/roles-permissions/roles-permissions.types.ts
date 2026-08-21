export interface IRole {
    id: number;
    name: string;
    description: string;
    is_active: boolean;
}

export interface IRoleOperation {
    id: number;
    name: string;
    selected: boolean;
}

export interface IRoleModule {
    module_name: string;
    operations: IRoleOperation[];
}

export interface IRoleMasterModule {
    master_module: string;
    modules: IRoleModule[];
}

export type IRoleBody = Partial<Omit<IRole, 'id'>> & { operation_ids?: number[] };

export interface IRoleParams {
    pageIndex: number;
    pageSize: number;
    sort?: string;
    name?: string;
    is_active?: string;
}
