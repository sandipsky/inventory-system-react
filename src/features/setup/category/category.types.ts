export interface ICategory {
    id: number;
    name: string;
    is_active: boolean;
}

export interface ICategoryBody {
    name: string;
    is_active: boolean;
}

export interface ICategoryParams {
    pageIndex: number;
    pageSize: number;
    sort?: string;
    name?: string;
    is_active?: string;
}

