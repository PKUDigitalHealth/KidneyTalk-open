import React from 'react';
import { events } from '@janhq/core';
import { ProgressMessage } from '../types/message';

const MAX_HISTORY_MESSAGES = 3;

export const useProgressMessages = () => {
    const [currentProgress, setCurrentProgress] = React.useState<ProgressMessage | null>(null);
    const [historyMessages, setHistoryMessages] = React.useState<ProgressMessage[]>([]);
    const [showHistory, setShowHistory] = React.useState(true);
    const messageCountRef = React.useRef(0);

    React.useEffect(() => {
        const handleProgress = (data: ProgressMessage) => {
            if (data.clearHistory) {
                setHistoryMessages([]);
                return;
            }

            const timestamp = Date.now();
            messageCountRef.current += 1;

            const newMessage: ProgressMessage = {
                id: data.id || `msg_${timestamp}_${messageCountRef.current}`,
                value: data.value,
                timestamp,
                addToHistory: data.addToHistory,
                title: data.title,
                subtitle: data.subtitle,
                content: data.content
            };

            setCurrentProgress(newMessage);

            if (data.addToHistory) {
                setHistoryMessages(prev => {
                    const newHistory = [newMessage, ...prev].slice(0, MAX_HISTORY_MESSAGES);
                    return newHistory;
                });
            }

            // if (data.value === 100 || data.value === 0) {
            //     setTimeout(() => setCurrentProgress(null), 3000);
            // }

        };

        events.on('knowledge:progress', handleProgress);
        return () => events.off('knowledge:progress', handleProgress);
    }, []);

    return {
        currentProgress,
        historyMessages: showHistory ? historyMessages : [],
        showHistory,
        setShowHistory
    };
}; 