import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Progress, Switch } from '@janhq/joi';
import { Loader2 } from 'lucide-react';
import { ProgressMessage } from '../../types/message';

interface ProgressBarProps {
    progress: ProgressMessage;
    showHistory: boolean;
    onToggleHistory: (show: boolean) => void;
    onHeightChange?: (height: number) => void;
}

// 添加样式
const spinAnimation = `
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

export const ProgressBar: React.FC<ProgressBarProps> = React.memo(({ 
    progress, 
    showHistory, 
    onToggleHistory,
    onHeightChange
}) => {
    const progressBarRef = React.useRef<HTMLDivElement>(null);
    const contentRef = React.useRef<HTMLDivElement>(null);
    const [userScrolled, setUserScrolled] = React.useState(false);

    // 监听高度变化
    React.useEffect(() => {
        if (progressBarRef.current) {
            const height = progressBarRef.current.offsetHeight;
            onHeightChange?.(height);
        }
    }, [progress.content]);

    // 自动滚动到底部
    React.useEffect(() => {
        if (contentRef.current && !userScrolled) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
    }, [progress.content]);

    // 处理滚动事件
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const element = e.target as HTMLDivElement;
        const isScrolledToBottom = Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 1;
        setUserScrolled(!isScrolledToBottom);
    };

    return (
        <>
            <style>{spinAnimation}</style>
            <div 
                ref={progressBarRef}
                className="fixed bottom-12 left-1/2 transform -translate-x-1/2 w-2/3 flex flex-col gap-2 p-4 rounded-lg shadow-lg bg-white dark:bg-zinc-800 dark:border dark:border-gray-700"
            >
                {/* 顶部控制栏 */}
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            {progress.value !== 100 && (
                                <Loader2 
                                    style={{
                                        animation: 'spin 1s linear infinite',
                                    }}
                                    className="w-3.5 h-3.5 text-blue-600" 
                                />
                            )}
                            <span className="text-xs text-gray-400 dark:text-gray-400">Processing</span>
                        </div>
                        <div className="h-4 w-[1px] bg-gray-200 dark:bg-gray-700" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{progress.title}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{progress.subtitle}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {progress.value}%
                        </span>
                        <div className="h-4 w-[1px] bg-gray-200 dark:bg-gray-700" />
                        {/* <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 dark:text-gray-400">Show History</span>
                            <Switch
                                checked={showHistory}
                                onChange={(e) => onToggleHistory(e.target.checked)}
                            />
                        </div> */}
                    </div>
                </div>

                {/* 消息内容区域 */}
                <div 
                    ref={contentRef}
                    onScroll={handleScroll}
                    className="max-h-20 h-auto overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent"
                >
                    <span className="text-sm text-gray-500 dark:text-gray-300 block">
                        <ReactMarkdown className="markdown-content">{progress.content}</ReactMarkdown>
                    </span>
                </div>

                <Progress value={progress.value || 0} size="small" className="w-full" />
            </div>
        </>
    );
}); 