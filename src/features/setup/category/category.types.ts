export interface ICategory {
    id: number;
    name: string;
    isActive: boolean;
}

export interface ICategoryBody {
    name: string;
    description?: string;
    isActive: boolean;
}

export interface ICategoryParams {
    pageIndex: number;
    pageSize: number;
    /** Spring sort param, e.g. `name,asc`. */
    sort?: string;
    /** Free-text search / column filters forwarded from the filter bar. */
    name?: string;
    isActive?: string;
}

