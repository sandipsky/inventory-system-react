export interface ICategory {
    id: number;
    name: string;
    isActive: boolean;
}

export interface ICategoryBody {
    name: string;
    isActive: boolean;
}

export interface ICategoryParams {
    pageIndex: number;
    pageSize: number;
    sort?: string;
    name?: string;
    isActive?: string;
}

