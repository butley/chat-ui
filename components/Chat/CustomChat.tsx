import { Conversation, ErrorMessage, KeyValuePair, Message, OpenAIModel } from "@/types";
import { FC, MutableRefObject, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "next-i18next";
import { ChatInput } from "./ChatInput";
import { ChatLoader } from "./ChatLoader";
import { ChatMessage } from "./ChatMessage";
import { ErrorMessageDiv } from "./ErrorMessageDiv";
import { ModelSelect } from "./ModelSelect";
import { SystemPrompt } from "./SystemPrompt";
import {getMessages} from "@/components/api";

interface Props {
  conversation: Conversation;
  models: OpenAIModel[];
  messageIsStreaming: boolean;
  modelError: ErrorMessage | null;
  messageError: boolean;
  loading: boolean;
  onSend: (message: Message, deleteCount?: number) => void;
  onUpdateConversation: (conversation: Conversation, data: KeyValuePair) => void;
  onEditMessage: (message: Message, messageIndex: number) => void;
  stopConversationRef: MutableRefObject<boolean>;
}

export const CustomChat: FC<Props> = ({ conversation, models, messageIsStreaming, modelError, messageError, loading, onSend, onUpdateConversation, onEditMessage, stopConversationRef }) => {
  const { t } = useTranslation('chat');
  const [currentMessage, setCurrentMessage] = useState<Message>();
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    if (autoScrollEnabled) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      textareaRef.current?.focus();
    }
  }, [autoScrollEnabled]);

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const bottomTolerance = 5;

      if (scrollTop + clientHeight < scrollHeight - bottomTolerance) {
        setAutoScrollEnabled(false);
      } else {
        setAutoScrollEnabled(true);
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
    setCurrentMessage(conversation.messages[conversation.messages.length - 2]);
  }, [conversation.messages, scrollToBottom]);

  useEffect(() => {
    const fetchMessages = async (userId: string) => {
      try {
        const messages = await getMessages(userId);
        console.log(messages)
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages("2");
  });

  useEffect(() => {
    const chatContainer = chatContainerRef.current;

    if (chatContainer) {
      chatContainer.addEventListener("scroll", handleScroll);

      return () => {
        chatContainer.removeEventListener("scroll", handleScroll);
      };
    }
  }, []);

  return (
    <div className="relative flex-1 overflow-none dark:bg-[#343541] bg-white">
      { modelError ? <ErrorMessageDiv error={modelError} /> : (
        <>
          <div
            className="overflow-scroll max-h-full"
            ref={chatContainerRef}
          >
            {conversation.messages.length === 0 ? (
              <>
                <div className="flex flex-col mx-auto pt-12 space-y-10 w-[350px] sm:w-[600px]">
                  <div className="text-4xl font-semibold text-center text-gray-800 dark:text-gray-100">{models.length === 0 ? t("Loading...") : "Chatbot UI"}</div>

                  {models.length > 0 && (
                    <div className="flex flex-col h-full space-y-4 border p-4 rounded border-neutral-500">
                      <ModelSelect
                        model={conversation.model}
                        models={models}
                        onModelChange={(model) => onUpdateConversation(conversation, { key: "model", value: model })}
                      />

                      <SystemPrompt
                        conversation={conversation}
                        onChangePrompt={(prompt) => onUpdateConversation(conversation, { key: "prompt", value: prompt })}
                      />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-center py-2 text-neutral-500 bg-neutral-100 dark:bg-[#444654] dark:text-neutral-200 text-sm border border-b-neutral-300 dark:border-none">{t('Model')}: {conversation.model.name}</div>

                {conversation.messages.map((message, index) => (
                  <ChatMessage
                    key={index}
                    message={message}
                    messageIndex={index}
                    onEditMessage={onEditMessage}
                  />
                ))}

                {loading && <ChatLoader />}

                <div
                  className="bg-white dark:bg-[#343541] h-[162px]"
                  ref={messagesEndRef}
                />
              </>
            )}
          </div>

          <ChatInput
            stopConversationRef={stopConversationRef}
            textareaRef={textareaRef}
            messageIsStreaming={messageIsStreaming}
            messages={conversation.messages}
            model={conversation.model}
            onSend={(message) => {
              setCurrentMessage(message);
              onSend(message);
            }}
            onRegenerate={() => {
              if (currentMessage) {
                onSend(currentMessage, 2);
              }
            }}
          />
        </>
      )}
    </div>
  );
};
