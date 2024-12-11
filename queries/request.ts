import axios, { AxiosRequestConfig } from 'axios';

type QueryStringProps = Record<string, any> | URLSearchParams;

export interface IRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  query?: QueryStringProps;
  body?: object;
}

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_HOST as string,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
});

export async function request<TResponse = void>(config: IRequestConfig) {
  const axiosConfig: AxiosRequestConfig = {
    url: config.path,
    method: config.method,
    params: config.query,
    data: config.body,
  };
  try {
    const response = await axiosInstance(axiosConfig);
    return response.data.data as TResponse;
  } catch (error) {
    throw new Error('HTTP request has been failed', {
      cause: error,
    });
  }
}
