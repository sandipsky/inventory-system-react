export interface IUser {
    id: number;
    username: string;
    full_name: string;
    email: string;
    contact: string;
    gender: string;
    password: string;
    image_url: string | null;
    role_id: number;
    role_name: string;
    remarks: string;
    active: boolean;
    is_active: boolean;
}

export type IUserBody = Partial<Omit<IUser, 'id'>>;

export interface IUserParams {
    pageIndex: number;
    pageSize: number;
    sort?: string;
    name?: string;
    is_active?: string;
}
