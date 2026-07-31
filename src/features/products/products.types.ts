export interface IProducts {
    id: number;
    name: string;
    is_active: boolean;
}

export interface IProductsBody {
    name: string;
    is_active: boolean;
}

export interface IProductsParams {
    pageIndex: number;
    pageSize: number;
    sort?: string;
    name?: string;
    is_active?: string;
}

