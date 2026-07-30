export interface IResponse {
  success: boolean;
  message: string;
  post_data_id: number;
  errorCode: number;
  timestamp: number;
}

export interface IPaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}
