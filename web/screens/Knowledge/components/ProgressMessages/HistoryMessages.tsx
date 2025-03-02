import React from 'react';
import ReactMarkdown from 'react-markdown';
import { ProgressMessage } from '../../types/message';

interface HistoryMessagesProps {
    messages: ProgressMessage[];
    style?: React.CSSProperties;
}

export const HistoryMessages: React.FC<HistoryMessagesProps> = ({ messages, style }) => (
    <div 
        className="fixed left-1/2 transform -translate-x-1/2 w-2/3 h-auto"
        style={style}
    >
        <div className="flex flex-col gap-3 pb-1">
            {messages.map((message) => (
                <div
                    key={message.id}
                    className="bg-white/95 dark:bg-zinc-800/95 px-4 py-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700"
                >
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                {message.title}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {message.subtitle}
                            </span>
                        </div>
                        <div className="max-h-12 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                <ReactMarkdown className="markdown-content">{message.content}</ReactMarkdown>
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
); 