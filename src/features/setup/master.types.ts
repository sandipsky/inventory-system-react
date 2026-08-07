export interface IMasterEntity {
    id: number;
    name: string;
    /** Only present on masters that carry a rate (tax type). */
    tax_rate?: number;
    is_active: boolean;
}

export interface IMasterBody {
    name: string;
    tax_rate?: number;
    is_active: boolean;
}

/** Paging + sort, plus any filter fields from the filter bar. */
export interface IMasterParams {
    pageIndex: number;
    pageSize: number;
    sort?: string;
    name?: string;
    is_active?: string;
    [key: string]: string | number | undefined;
}
