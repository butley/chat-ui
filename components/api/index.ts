import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { env } from '@/components/Providers/Environment';
import axiosRetry from 'axios-retry';
import { BillingCycleEntity, ChatMessageEntity, UserEntity } from '@/types/custom';
import { Conversation } from '@/types';

export type ChatHttpConfig = {
  url: string;
  method?: string;
} & AxiosRequestConfig;

type HTTP = {
  get<T = unknown, R = AxiosResponse<T>>(config: ChatHttpConfig): Promise<R>;
  post<T = unknown, R = AxiosResponse<T>>(
    config: ChatHttpConfig,
    data?: unknown,
  ): Promise<R>;
  put<T = unknown, R = AxiosResponse<T>>(
    config: ChatHttpConfig,
    data?: unknown,
  ): Promise<R>;
  delete<T = unknown, R = AxiosResponse<T>>(
    config: ChatHttpConfig,
    data?: unknown,
  ): Promise<R>;
};

export const requestInterceptor = (value: AxiosRequestConfig) => {
  //const requestHash = value.headers && (value.headers['Authentication-Hash'] as string)
  return value;
};
axios.interceptors.request.use(requestInterceptor);
axiosRetry(axios, { retries: 0 });

export const chatClient: HTTP = {
  get: (config) => {
    return axios.request({
      method: 'get',
      responseType: 'json',
      baseURL: env('butleyApiHost'),
      ...config,
    });
  },
  post: (config, payload) => {
    return axios.request({
      method: 'post',
      responseType: 'json',
      baseURL: env('butleyApiHost'),
      data: payload,
      ...config,
    });
  },
  put: (config, payload) => {
    return axios.request({
      method: 'put',
      responseType: 'json',
      baseURL: env('butleyApiHost'),
      data: payload,
      ...config,
    });
  },
  delete: (config, payload) => {
    return axios.request({
      method: 'delete',
      responseType: 'json',
      baseURL: env('butleyApiHost'),
      data: payload,
      ...config,
    });
  },
};


export const createUser = async (user: UserEntity) =>
    chatClient.post<UserEntity>({
      url: '/users'
    }, user);

export const getUserByEmail = async (email: string) =>
    chatClient.get<UserEntity>({
      url: `/users/by-email/${email}`,
    });

export const createConversation = async (conversation: Conversation) =>
  chatClient.post<Conversation>(
    {
      url: `/chat/conversation`,
    },
    conversation,
  );

export const getConversations = async (userId: string) =>
  chatClient.get<Conversation[]>({
    url: `/chat/conversation/${userId}`,
  });

export const deleteConversation = async (conversationId: string) =>
  chatClient.delete({
    url: `/chat/conversation/${conversationId}`,
  });

export const createMessage = async (chatMessageEntity: ChatMessageEntity) =>
  chatClient.post(
    {
      url: `/chat`,
    },
    chatMessageEntity,
  );

export const getMessagesByConversationId = async (
  conversationId: string,
  userId: string,
) =>
  chatClient.get<ChatMessageEntity[]>({
    url: `/chat/messages/conversation/${conversationId}/${userId}`,
  });

export const getOpenBillingCycle = async (ownerId: number) => {
  return chatClient.get<BillingCycleEntity>({
    url: `/billing/cycle/${ownerId}`,
  });
};

export const getMessages = (userId: string) =>
  chatClient.get<ChatMessageEntity[]>({
    url: `/chat/messages/last/${userId}/0`,
  });
