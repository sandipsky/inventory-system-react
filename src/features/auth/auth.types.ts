export interface ILoginBody {
    username: string;
    password: string
}

export interface ILoginResponse {
    token: string;
    user: any;
}
export interface IUserRoleOperations {
    id: number;
    username: string;
    name: string;
    role_id: number;
    role_name: string;
    image_url: string | null;
    modules: string[];
    operations: string[];
    master_modules: string[];
}
