export interface ICategory {
    id: number;
    name: string;
    description?: string | null;
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
    /** Free-text search / column filters forwarded from the filter bar. */
    name?: string;
    isActive?: string;
}

export interface IPaginatedResponse<T> {
    items: T[];
    totalCount: number;
}
