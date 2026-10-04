export type Credentials = {
  idInstance: string;
  apiTokenInstance: string;
  apiUrl: string;
};

export type MessageStatus = 'sending' | 'sent' | 'error';

export type Message = {
  id: string;
  text: string;
  timestamp: number;
  fromMe: boolean;
  status?: MessageStatus;
  media?: boolean;
};

export type Chat = {
  id: string;
  title: string;
  phone?: string;
  username?: string;
  messages: Message[];
  unread: number;
};

export type Notification = {
  typeWebhook: string;
  timestamp: number;
  idMessage?: string;
  senderData?: {
    chatId: string;
    chatName?: string;
    senderName?: string;
    senderPhoneNumber?: number;
  };
  messageData?: {
    typeMessage: string;
    textMessageData?: { textMessage: string };
    extendedTextMessageData?: { text: string };
    fileMessageData?: { fileName?: string };
  };
};

export type HistoryMessage = {
  type: 'incoming' | 'outgoing';
  idMessage: string;
  timestamp: number;
  typeMessage: string;
  textMessage?: string;
  fileName?: string;
  isDeleted?: boolean;
};
