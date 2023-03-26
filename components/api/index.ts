import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { env } from '@/components/Providers/Environment'
import axiosRetry from 'axios-retry'
import { ChatMessageEntity } from "@/types/custom";

export type ChatHttpConfig = {
  url: string
  method?: string
} & AxiosRequestConfig


type HTTP = {
  get<T = unknown, R = AxiosResponse<T>>(config: ChatHttpConfig): Promise<R>
  post<T = unknown, R = AxiosResponse<T>>(config: ChatHttpConfig, data?: unknown): Promise<R>
  put<T = unknown, R = AxiosResponse<T>>(config: ChatHttpConfig, data?: unknown): Promise<R>
}


export const requestInterceptor = (value: AxiosRequestConfig) => {
  //const requestHash = value.headers && (value.headers['Authentication-Hash'] as string)
  return value
}
axios.interceptors.request.use(requestInterceptor)
axiosRetry(axios, { retries: 0 })

export const httpClient: HTTP = {
  get: (config) => {
    return axios.request(config)
  },
  post: (config, payload) => {
    return axios.request({
      data: payload,
      ...config
    })
  },
  put: (config, payload) => {
    return axios.request({
      data: payload,
      ...config
    })
  }
}

export const chatClient: HTTP = {
  get: (config) => {
    return axios.request({
      method: 'get',
      responseType: 'json',
      baseURL: env('butleyApiHost'),
      ...config
    })
  },
  post: (config, payload) => {
    return axios.request({
      method: 'post',
      responseType: 'json',
      baseURL: env('butleyApiHost'),
      data: payload,
      ...config
    })
  },
  put: (config, payload) => {
    return axios.request({
      method: 'put',
      responseType: 'json',
      baseURL: env('butleyApiHost'),
      data: payload,
      ...config
    })
  }
}

export const getMessages = (userId: string) =>
  chatClient.get<ChatMessageEntity[]>(
      {
        url: `/chat/messages/last/${userId}/0`
      }
  )
