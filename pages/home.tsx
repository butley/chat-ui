import { Navbar } from '@/components/Mobile/Navbar';
import { CustomSidebar } from '@/components/Sidebar/CustomSidebar';
import {
  ChatBody,
  ChatFolder,
  Conversation,
  ErrorMessage,
  KeyValuePair,
  Message,
  OpenAIModel,
  OpenAIModelID,
  OpenAIModels,
} from '@/types';
import {
  cleanConversationHistory,
  cleanSelectedConversation,
} from '@/utils/app/clean';
import { DEFAULT_SYSTEM_PROMPT } from '@/utils/app/const';
import {
  saveConversation,
  saveConversations,
  updateConversation,
} from '@/utils/app/conversation';
import { saveFolders } from '@/utils/app/folders';
import { exportData, importData } from '@/utils/app/importExport';
import { IconArrowBarLeft, IconArrowBarRight } from '@tabler/icons-react';
import { Inter } from "next/font/google";
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import { useSession } from "next-auth/react";
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import {
  upsertConversation,
  getConversations,
  deleteConversation,
  getOpenBillingCycle,
  getMessages, createMessage, getMessagesByConversationId
} from '@/components/api';
import { AxiosResponse } from 'axios';
import { TopBar } from "@/components/Topbar";
import { CustomChat } from "@/components/Chat/CustomChat";
import {ChatMessageEntity, convertChatMessagesToMessages, PortalUser} from "@/types/custom";

interface HomeProps {
  serverSideApiKeyIsSet: boolean;
}

const inter = Inter({ subsets: ['latin'] });

const Home: React.FC<HomeProps> = ({ serverSideApiKeyIsSet }) => {
  const { t } = useTranslation('chat');
  const [folders, setFolders] = useState<ChatFolder[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation>();
  const [loading, setLoading] = useState<boolean>(false);
  const [models, setModels] = useState<OpenAIModel[]>([]);
  const [lightMode, setLightMode] = useState<'dark' | 'light'>('dark');
  const [messageIsStreaming, setMessageIsStreaming] = useState<boolean>(false);
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [apiKey, setApiKey] = useState<string>('');
  const [messageError, setMessageError] = useState<boolean>(false);
  const [modelError, setModelError] = useState<ErrorMessage | null>(null);
  const [currentMessage, setCurrentMessage] = useState<Message>();

  const stopConversationRef = useRef<boolean>(false);

  const { data: session } = useSession();
  const portalUser: PortalUser = session?.user as PortalUser;

  const fetchConversations = async (userId: number) => {
    return await getConversations(userId);
  }

  const sendMessage = async (messageEntity: ChatMessageEntity) => {
    return await createMessage(messageEntity)
  }

  const handleSendMessage = async (message: Message) => {
    if (selectedConversation) {
      setLoading(true);
      setMessageIsStreaming(true);
      setMessageError(false);

      let messageEntity : ChatMessageEntity = {
        userContent: message.content,
        chatTransactionId: message.chatTransactionID,
        conversation: selectedConversation,
        user: {
          id: portalUser.id
        }
      };
      console.log(selectedConversation, messageEntity);

      sendMessage(messageEntity).then(r => {
        const response = r as AxiosResponse;
        let updatedConversation: Conversation = {
          ...selectedConversation,
          messages: [...selectedConversation.messages, message],
        };
        setSelectedConversation(updatedConversation);
      }).catch((error) => {
        alert(t('Not possible to send the message: ' + error.response.data.errorMessage));
      }).finally(() => {
        setLoading(false);
        setMessageIsStreaming(false);
        setMessageError(true);
      });
      // const controller = new AbortController();
      // const response = await fetch('/chat/messages', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   signal: controller.signal,
      //   body: JSON.stringify(messageEntity),
      // });
    }
  };

  useEffect(() => {
    const fetchNewChatMessages = async () => {
      return await getMessages(portalUser.id!!);
    }

    const intervalId = setInterval(() => {
      fetchNewChatMessages().then(r => {

      });
    }, 60000); // Replace N with the desired interval in milliseconds

    return () => {
      clearInterval(intervalId);
    };
  }, []);

    const handleSend = async (message: Message, deleteCount = 0) => {
    if (selectedConversation) {
      let updatedConversation: Conversation;

      if (deleteCount) {
        const updatedMessages = [...selectedConversation.messages];
        for (let i = 0; i < deleteCount; i++) {
          updatedMessages.pop();
        }

        updatedConversation = {
          ...selectedConversation,
          messages: [...updatedMessages, message],
        };
      } else {
        updatedConversation = {
          ...selectedConversation,
          messages: [...selectedConversation.messages, message],
        };
      }

      setSelectedConversation(updatedConversation);
      setLoading(true);
      setMessageIsStreaming(true);
      setMessageError(false);

      const chatBody: ChatBody = {
        model: updatedConversation.model,
        messages: updatedConversation.messages,
        key: apiKey,
        prompt: updatedConversation.prompt,
      };

      const controller = new AbortController();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify(chatBody),
      });

      if (!response.ok) {
        setLoading(false);
        setMessageIsStreaming(false);
        setMessageError(true);
        return;
      }

      const data = response.body;

      if (!data) {
        setLoading(false);
        setMessageIsStreaming(false);
        setMessageError(true);

        return;
      }

      if (updatedConversation.messages.length === 1) {
        const { content } = message;
        const customName =
          content.length > 30 ? content.substring(0, 30) + '...' : content;

        updatedConversation = {
          ...updatedConversation,
          name: customName,
        };
      }

      setLoading(false);

      const reader = data.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let isFirst = true;
      let text = '';

      while (!done) {
        if (stopConversationRef.current === true) {
          controller.abort();
          done = true;
          break;
        }
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);

        text += chunkValue;

        if (isFirst) {
          isFirst = false;
          const updatedMessages: Message[] = [
            ...updatedConversation.messages,
            { role: 'assistant', content: chunkValue },
          ];

          updatedConversation = {
            ...updatedConversation,
            messages: updatedMessages,
          };

          setSelectedConversation(updatedConversation);
        } else {
          const updatedMessages: Message[] = updatedConversation.messages.map(
            (message, index) => {
              if (index === updatedConversation.messages.length - 1) {
                return {
                  ...message,
                  content: text,
                };
              }

              return message;
            },
          );

          updatedConversation = {
            ...updatedConversation,
            messages: updatedMessages,
          };

          setSelectedConversation(updatedConversation);
        }
      }

      saveConversation(updatedConversation);

      const updatedConversations: Conversation[] = conversations.map(
        (conversation) => {
          if (conversation.id === selectedConversation.id) {
            return updatedConversation;
          }

          return conversation;
        },
      );

      if (updatedConversations.length === 0) {
        updatedConversations.push(updatedConversation);
      }

      setConversations(updatedConversations);

      saveConversations(updatedConversations);

      setMessageIsStreaming(false);
    }
  };

  const fetchModels = async (key: string) => {
    const error = {
      title: t('Error fetching models.'),
      code: null,
      messageLines: [
        t(
          'Make sure your OpenAI API key is set in the bottom left of the sidebar.',
        ),
        t('If you completed this step, OpenAI may be experiencing issues.'),
      ],
    } as ErrorMessage;

    const response = await fetch('/api/models', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key,
      }),
    });

    if (!response.ok) {
      try {
        const data = await response.json();
        Object.assign(error, {
          code: data.error?.code,
          messageLines: [data.error?.message],
        });
      } catch (e) {}
      setModelError(error);
      return;
    }

    const data = await response.json();

    if (!data) {
      setModelError(error);
      return;
    }

    setModels(data);
    setModelError(null);
  };

  const handleLightMode = (mode: 'dark' | 'light') => {
    setLightMode(mode);
    localStorage.setItem('theme', mode);
  };

  const handleApiKeyChange = (apiKey: string) => {
    setApiKey(apiKey);
    localStorage.setItem('apiKey', apiKey);
  };

  const handleExportData = () => {
    exportData();
  };

  const handleImportConversations = (data: {
    conversations: Conversation[];
    folders: ChatFolder[];
  }) => {
    importData(data.conversations, data.folders);
    setConversations(data.conversations);
    setSelectedConversation(data.conversations[data.conversations.length - 1]);
    setFolders(data.folders);
  };

  const fetchConversationMessages = async (conversationId: number, userId: number)  => {
    return getMessagesByConversationId(conversationId, userId)
  }

  const handleSelectConversation = (conversation: Conversation) => {
    setLoading(false);
    setMessageIsStreaming(false);
    setMessageError(false);

    fetchConversationMessages(conversation.id!!, portalUser.id!!).then(r => {
      const response = r as AxiosResponse;
      conversation.messages = convertChatMessagesToMessages(response.data);
      setSelectedConversation(conversation);
    }).catch((error) => {
      alert(t('Not possible to fetch conversation messages: ' + error.response.data.errorMessage));
    }).finally(() => {
      setLoading(false);
      setMessageIsStreaming(false);
      setMessageError(false);
    });
    //saveConversation(conversation);
  };

  const handleCreateFolder = (name: string) => {
    const lastFolder = folders[folders.length - 1];

    const newFolder: ChatFolder = {
      id: lastFolder ? lastFolder.id + 1 : 1,
      name,
    };

    const updatedFolders = [...folders, newFolder];

    setFolders(updatedFolders);
    saveFolders(updatedFolders);
  };

  const handleDeleteFolder = (folderId: number) => {
    const updatedFolders = folders.filter((f) => f.id !== folderId);
    setFolders(updatedFolders);
    saveFolders(updatedFolders);

    const updatedConversations: Conversation[] = conversations.map((c) => {
      if (c.folderId === folderId) {
        return {
          ...c,
          folderId: 0,
        };
      }

      return c;
    });
    setConversations(updatedConversations);
    saveConversations(updatedConversations);
  };

  const handleUpdateFolder = (folderId: number, name: string) => {
    const updatedFolders = folders.map((f) => {
      if (f.id === folderId) {
        return {
          ...f,
          name,
        };
      }

      return f;
    });

    setFolders(updatedFolders);
    saveFolders(updatedFolders);
  };

  const handleNewConversation = async () => {
    let newConversation: Conversation = {
      name: `${t('New Conversation')}`,
      messages: [],
      model: OpenAIModels[OpenAIModelID.GPT_3_5],
      //prompt: DEFAULT_SYSTEM_PROMPT,
      folderId: 0,
      user: {
        id: portalUser.id,
      }
    };

    setLoading(true);

    await upsertConversation(newConversation)
      .then((r) => {
        let response = r as AxiosResponse;
        if (response.status == 200) {
          const updatedConversations = [...conversations, newConversation];

          setSelectedConversation(newConversation);
          setConversations(updatedConversations);
          setLoading(false);
        }
      })
      .catch((error) => {
        console.log('error:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleDeleteConversation = async (conversation: Conversation) => {
    await deleteConversation(conversation.id!!)
        .then((r) => {
          let response = r as AxiosResponse;
          if (response.status == 200) {
            const updatedConversations = conversations.filter(
                (c) => c.id !== conversation.id,
            );
            setConversations(updatedConversations);
            saveConversations(updatedConversations);

            if (updatedConversations.length > 0) {
              setSelectedConversation(
                  updatedConversations[updatedConversations.length - 1],
              );
              saveConversation(updatedConversations[updatedConversations.length - 1]);
            } else {
              setSelectedConversation({
                id: 1,
                name: 'New conversation',
                messages: [],
                model: OpenAIModels[OpenAIModelID.GPT_3_5],
                prompt: DEFAULT_SYSTEM_PROMPT,
                folderId: 0,
              });
              localStorage.removeItem('selectedConversation');
            }
          }
        })
        .catch((error) => {
          console.log('error:', error);
        })
        .finally(() => {
          setLoading(false);
        });
  };

  const handleUpdateConversation = async (
    conversation: Conversation,
    data: KeyValuePair,
  ) => {
    const updatedConversation = {
      ...conversation,
      [data.key]: data.value,
    };

    const { single, all } = updateConversation(
      updatedConversation,
      conversations,
    );

    await upsertConversation(updatedConversation)
    .then((r) => {
      let response = r as AxiosResponse;
      if (response.status == 200) {
        const updatedConversations = [...conversations, updatedConversation];

        setSelectedConversation(updatedConversation);
        setConversations(updatedConversations);
        setLoading(false);

        //saveConversation(newConversation);
        //saveConversations(updatedConversations);
      }
    })
    .catch((error) => {
      console.log('error:', error);
    })
    .finally(() => {
      setLoading(false);
    });
    setConversations(all);
  };

  const handleClearConversations = () => {
    setConversations([]);
    localStorage.removeItem('conversationHistory');

    setSelectedConversation({
      id: 1,
      name: 'New conversation',
      messages: [],
      model: OpenAIModels[OpenAIModelID.GPT_3_5],
      prompt: DEFAULT_SYSTEM_PROMPT,
      folderId: 0,
    });
    localStorage.removeItem('selectedConversation');

    setFolders([]);
    localStorage.removeItem('folders');
  };

  const handleEditMessage = (message: Message, messageIndex: number) => {
    if (selectedConversation) {
      const updatedMessages = selectedConversation.messages
        .map((m, i) => {
          if (i < messageIndex) {
            return m;
          }
        })
        .filter((m) => m) as Message[];

      const updatedConversation = {
        ...selectedConversation,
        messages: updatedMessages,
      };

      const { single, all } = updateConversation(
        updatedConversation,
        conversations,
      );

      setSelectedConversation(single);
      setConversations(all);

      setCurrentMessage(message);
    }
  };

  useEffect(() => {
    if (currentMessage) {
      handleSend(currentMessage);
      setCurrentMessage(undefined);
    }
  }, [currentMessage]);

  useEffect(() => {
    if (window.innerWidth < 640) {
      setShowSidebar(false);
    }
  }, [selectedConversation]);

  useEffect(() => {
    if (apiKey) {
      fetchModels(apiKey);
    }
  }, [apiKey]);

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme) {
      setLightMode(theme as 'dark' | 'light');
    }

    const apiKey = localStorage.getItem('apiKey');
    if (apiKey) {
      setApiKey(apiKey);
      fetchModels(apiKey);
    } else if (serverSideApiKeyIsSet) {
      fetchModels('');
    }

    if (window.innerWidth < 640) {
      setShowSidebar(false);
    }

    const folders = localStorage.getItem('folders');
    if (folders) {
      setFolders(JSON.parse(folders));
    }

    fetchConversations(portalUser.id!!).then(r => {
      const response = r as AxiosResponse
      const conversations = response.data as Conversation[];
      conversations.map(conversation => {
        // If messages is undefined, assign an empty array
        if (conversation.messages === undefined) {
          return {...conversation, messages: []};
        }
      });
      setConversations(conversations);
    });

    // const conversationHistory = localStorage.getItem('conversationHistory');
    // if (conversationHistory) {
    //   const parsedConversationHistory: Conversation[] =
    //     JSON.parse(conversationHistory);
    //   const cleanedConversationHistory = cleanConversationHistory(
    //     parsedConversationHistory,
    //   );
    //   setConversations(cleanedConversationHistory);
    // }

    const selectedConversation = localStorage.getItem('selectedConversation');
    if (selectedConversation) {
      const parsedSelectedConversation: Conversation =
        JSON.parse(selectedConversation);
      const cleanedSelectedConversation = cleanSelectedConversation(
        parsedSelectedConversation,
      );
      cleanedSelectedConversation.messages = [];
      setSelectedConversation(cleanedSelectedConversation);
    } else {
      setSelectedConversation({
        id: 1,
        name: 'New conversation',
        messages: [],
        model: OpenAIModels[OpenAIModelID.GPT_3_5],
        prompt: DEFAULT_SYSTEM_PROMPT,
        folderId: 0,
      });
    }
  }, [serverSideApiKeyIsSet, portalUser.id]);

  return (
    <>
      <Head>
        <title>Butley</title>
        <meta name="description" content="Personal assistant" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main
          className={`${inter.className} flex h-screen w-screen flex-col text-sm text-white dark:text-white pt-12 ${lightMode}`}
      >
        {selectedConversation && (
          <>
            <div className="fixed top-20 w-full sm:hidden">
              <Navbar
                  selectedConversation={selectedConversation}
                  onNewConversation={handleNewConversation}/>
            </div>
            <TopBar />
            <div className="flex h-full w-full">

              {showSidebar ? (
                  <div>
                    <CustomSidebar
                        loading={messageIsStreaming}
                        conversations={conversations}
                        lightMode={lightMode}
                        selectedConversation={selectedConversation}
                        apiKey={apiKey}
                        folders={folders}
                        onToggleLightMode={handleLightMode}
                        onCreateFolder={handleCreateFolder}
                        onDeleteFolder={handleDeleteFolder}
                        onUpdateFolder={handleUpdateFolder}
                        onNewConversation={handleNewConversation}
                        onSelectConversation={handleSelectConversation}
                        onDeleteConversation={handleDeleteConversation}
                        onToggleSidebar={() => setShowSidebar(!showSidebar)}
                        onUpdateConversation={handleUpdateConversation}
                        onApiKeyChange={handleApiKeyChange}
                        onClearConversations={handleClearConversations}
                        onExportConversations={handleExportData}
                        onImportConversations={handleImportConversations}/>

                    <IconArrowBarLeft
                        className="fixed top-14 left-[270px] z-50 h-7 w-7 cursor-pointer hover:text-gray-400 dark:text-white dark:hover:text-gray-300 sm:top-14 sm:left-[270px] sm:h-8 sm:w-8 sm:text-neutral-700"
                        onClick={() => setShowSidebar(!showSidebar)}/>

                    <div
                        onClick={() => setShowSidebar(!showSidebar)}
                        className="absolute top-14 left-0 z-10 h-full w-full bg-black opacity-70 sm:hidden"
                    ></div>
                  </div>
              ) : (
                  <IconArrowBarRight
                      className="fixed top-14 left-4 z-50 h-7 w-7 cursor-pointer text-white hover:text-gray-400 dark:text-white dark:hover:text-gray-300 sm:top-14 sm:left-2 sm:h-8 sm:w-8 sm:text-neutral-700"
                      onClick={() => setShowSidebar(!showSidebar)}/>
              )}
              <CustomChat
                  conversation={selectedConversation}
                  messageIsStreaming={messageIsStreaming}
                  modelError={modelError}
                  messageError={messageError}
                  models={models}
                  loading={loading}
                  onSend={handleSendMessage}
                  onUpdateConversation={handleUpdateConversation}
                  onEditMessage={handleEditMessage}
                  stopConversationRef={stopConversationRef}/>
            </div>
          </>
        )}
      </main>
    </>
  );
};
export default Home;

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  // const session = await getSession(req);
  // if (!session) {
  //   req.res.writeHead(302, { Location: "/" });
  //   req.res.end();
  //   return {};
  // }

  return {
    props: {
      serverSideApiKeyIsSet: !!process.env.OPENAI_API_KEY,
      ...(await serverSideTranslations(locale ?? 'en', [
        'common',
        'chat',
        'sidebar',
        'markdown',
      ])),
    },
  };
};
