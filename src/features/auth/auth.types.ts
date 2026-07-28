export interface ILoginBody {
    username: string;
    password: string
}

export interface ILoginResponse {
    token: string;
    user: any;
}