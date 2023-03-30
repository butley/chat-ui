import {
  Conversation,
  ErrorMessage,
  KeyValuePair,
  Message,
  OpenAIModel,
} from '@/types';
import {
  FC,
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'next-i18next';
import { ChatInput } from './ChatInput';
import { ChatLoader } from './ChatLoader';
import { ChatMessage } from './ChatMessage';
import { ErrorMessageDiv } from './ErrorMessageDiv';
import { ModelSelect } from './ModelSelect';
import { SystemPrompt } from './SystemPrompt';
import { getMessages } from '@/components/api';

interface Props {
  conversation: Conversation;
  models: OpenAIModel[];
  messageIsStreaming: boolean;
  modelError: ErrorMessage | null;
  messageError: boolean;
  loading: boolean;
  onSend: (message: Message, deleteCount?: number) => void;
  onUpdateConversation: (
    conversation: Conversation,
    data: KeyValuePair,
  ) => void;
  onEditMessage: (message: Message, messageIndex: number) => void;
  stopConversationRef: MutableRefObject<boolean>;
}

export const CustomChat: FC<Props> = ({
  conversation,
  models,
  messageIsStreaming,
  modelError,
  messageError,
  loading,
  onSend,
  onUpdateConversation,
  onEditMessage,
  stopConversationRef,
}) => {
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
      const { scrollTop, scrollHeight, clientHeight } =
        chatContainerRef.current;
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
    const chatContainer = chatContainerRef.current;

    if (chatContainer) {
      chatContainer.addEventListener('scroll', handleScroll);

      return () => {
        chatContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

  return (
      <div className="overflow-none relative flex-1 bg-white dark:bg-[#343541]">
      {modelError ? (
        <ErrorMessageDiv error={modelError} />
      ) : (
        <>
          <div className="max-h-full overflow-scroll" ref={chatContainerRef}>
            <>
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
                className="h-[162px] bg-white dark:bg-[#343541]"
                ref={messagesEndRef}
              />
            </>
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
