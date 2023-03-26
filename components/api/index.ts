import axios, {AxiosRequestConfig, AxiosResponse} from 'axios'
import {env} from '@/components/Providers/Environment'
import axiosRetry from 'axios-retry'
import {ChatMessageEntity} from "@/types/custom";
import {Conversation} from "@/types";

export type ChatHttpConfig = {
  url: string
  method?: string
} & AxiosRequestConfig


type HTTP = {
  get<T = unknown, R = AxiosResponse<T>>(config: ChatHttpConfig): Promise<R>
  post<T = unknown, R = AxiosResponse<T>>(config: ChatHttpConfig, data?: unknown): Promise<R>
  put<T = unknown, R = AxiosResponse<T>>(config: ChatHttpConfig, data?: unknown): Promise<R>
  delete<T = unknown, R = AxiosResponse<T>>(config: ChatHttpConfig, data?: unknown): Promise<R>
}


export const requestInterceptor = (value: AxiosRequestConfig) => {
  //const requestHash = value.headers && (value.headers['Authentication-Hash'] as string)
  return value
}
axios.interceptors.request.use(requestInterceptor)
axiosRetry(axios, {retries: 0})

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
  },
  delete: (config, payload) => {
    return axios.request({
      method: 'delete',
      responseType: 'json',
      baseURL: env('butleyApiHost'),
      data: payload,
      ...config
    })
  }
}

// Create a new conversation
export const createConversation = (conversation: Conversation) =>
    chatClient.post<Conversation>(
        {
          url: `/conversation`
        },
        conversation
    );

// Get conversations by userId
export const getConversations = (userId: string) =>
    chatClient.get<Conversation[]>(
        {
          url: `/conversation/${userId}`
        }
    );

export const deleteConversation = (conversationId: string) =>
    chatClient.delete(
        {
          url: `/conversation/${conversationId}`
        }
    );


export const createMessage = (chatMessageEntity: ChatMessageEntity) =>
    chatClient.post(
        {
          url: `/chat`
        },
        chatMessageEntity
    );

// Get messages by conversationId and userId
export const getMessagesByConversationId = (conversationId: string, userId: string) =>
    chatClient.get<ChatMessageEntity[]>(
        {
          url: `/chat/messages/conversation/${conversationId}/${userId}`
        }
    );


export const getMessages = (userId: string) =>
    chatClient.get<ChatMessageEntity[]>(
        {
          url: `/chat/messages/last/${userId}/0`
        }
    )
