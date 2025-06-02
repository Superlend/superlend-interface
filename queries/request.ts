import axios, { AxiosRequestConfig } from 'axios'

type QueryStringProps = Record<string, any> | URLSearchParams

export interface IRequestConfig {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
    path: string
    query?: QueryStringProps
    body?: object
    headers?: Record<string, string>
}

const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_HOST as string,
    headers: {
        'Content-Type': 'application/json; charset=utf-8',
    },
})

const axiosMerklInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_MERKL_HOST as string,
    headers: {
        'Content-Type': 'application/json; charset=utf-8',
    },
})

const axiosPointsInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_POINTS_HOST as string,
    headers: {
        'Content-Type': 'application/json; charset=utf-8',
    },
})

const axiosFundsIndexerInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_FUNDS_INDEXER_API as string,
    headers: {
        'Content-Type': 'application/json; charset=utf-8',
    },
})

const axiosFundsRewardsInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_FUNDS_REWARDS_API as string,
    headers: {
        'Content-Type': 'application/json; charset=utf-8',
    },
})

export async function request<TResponse = void>(config: IRequestConfig) {
    const axiosConfig: AxiosRequestConfig = {
        url: config.path,
        method: config.method,
        params: config.query,
        data: config.body,
    }
    try {
        const response = await axiosInstance(axiosConfig)
        return response.data.data as TResponse
    } catch (error) {
        throw new Error('HTTP request has been failed', {
            cause: error,
        })
    }
}

export async function requestMerkle<TResponse = void>(config: IRequestConfig) {
    const axiosConfig: AxiosRequestConfig = {
        url: config.path,
        method: config.method,
        params: config.query,
        data: config.body,
    }
    try {
        const response = await axiosMerklInstance(axiosConfig)
        return response.data as TResponse
    } catch (error) {
        throw new Error('HTTP request has been failed', {
            cause: error,
        })
    }
}

export async function requestPoints<TResponse = void>(config: IRequestConfig) {
    const axiosConfig: AxiosRequestConfig = {
        url: config.path,
        method: config.method,
        params: config.query,
        data: config.body,
    }
    
    // Add custom headers if provided
    if (config.headers) {
        axiosConfig.headers = config.headers
    }
    
    try {
        const response = await axiosPointsInstance(axiosConfig)
        return response.data.data as TResponse
    } catch (error) {
        throw new Error('HTTP request has been failed', {
            cause: error,
        })
    }
}

export async function requestFundsIndexer<TResponse = void>(config: IRequestConfig) {
    const axiosConfig: AxiosRequestConfig = {
        url: config.path,
        method: config.method,
        params: config.query,
        data: config.body,
    }
    try {
        const response = await axiosFundsIndexerInstance(axiosConfig)
        return response.data.data as TResponse
    } catch (error) {
        throw new Error('HTTP request has been failed', {
            cause: error,
        })
    }
}

export async function requestFundsRewards<TResponse = void>(config: IRequestConfig) {
    const axiosConfig: AxiosRequestConfig = {
        url: config.path,
        method: config.method,
        params: config.query,
        data: config.body,
    }
    try {
        const response = await axiosFundsRewardsInstance(axiosConfig)
        return response.data.data as TResponse
    } catch (error) {
        throw new Error('HTTP request has been failed', {
            cause: error,
        })
    }
}
