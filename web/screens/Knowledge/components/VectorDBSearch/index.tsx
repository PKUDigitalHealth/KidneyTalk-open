import React, { useState, useEffect } from 'react';
import { Button, Input, Tooltip } from '@janhq/joi';
import { Search, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useKnowledgeSearch } from '@/hooks/useKnowledgeSearch';
import { readKnowledgeFileList } from '@/utils/file'
import { toaster } from '@/containers/Toast'
import Markdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import 'katex/dist/katex.min.css'

const STORAGE_KEY = 'vectordb_search_state';

export const VectorDBSearch: React.FC = () => {
    // 从localStorage初始化状态
    const [query, setQuery] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved).query || '' : '';
    });
    
    const [topK, setTopK] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved).topK || 5 : 5;
    });
    
    const { results, isSearching, searchKnowledge } = useKnowledgeSearch();
    const [savedResults, setSavedResults] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved).results || [] : [];
    });
    
    const [expandedItems, setExpandedItems] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved).expandedItems || [] : [];
    });

    // 监听状态变化并保存到localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            query,
            topK,
            results: savedResults,
            expandedItems
        }));
    }, [query, topK, savedResults, expandedItems]);

    // 监听搜索结果变化并更新savedResults
    useEffect(() => {
        if (results.length > 0) {
            setSavedResults(results);
        }
    }, [results]);

    const handleSearch = () => {
        // 检查是否上传了文件
        const fileList = readKnowledgeFileList()
        if (fileList.files.length === 0) {
            toaster({
                title: '请先上传知识库文件',
                description: '您需要先上传一些文档才能进行知识检索',
                type: 'warning'
            })
            return
        }
        searchKnowledge(query, topK);
    };

    const toggleExpand = (index: number) => {
        setExpandedItems((prev: number[]) => 
            prev.includes(index) 
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-[hsla(var(--app-border))]">
                <h2 className="font-medium mb-4">Knowledge Snippet Retrieval</h2>

                <div className="flex gap-2">
                    <div className="flex-1">
                        <Input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Input Retrieval Query..."
                            className="w-full"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSearch();
                                }
                            }}
                        />
                    </div>
                    <Tooltip
                        trigger={
                            <Input
                                type="number"
                                value={topK}
                                onChange={(e) => setTopK(Number(e.target.value))}
                                min={1}
                                max={20}
                                className="w-12"
                                textAlign="right"
                            />
                        }
                        content="Set the number of similar results returned (1-20)"
                        side="bottom"
                    />
                    <Tooltip
                        trigger={
                            <Button
                                onClick={handleSearch}
                                disabled={isSearching || !query.trim()}
                            >
                                <Search size={18} className="mr-1" />
                                Retrieve
                            </Button>
                        }
                        content={query.trim() ? "Run the search" : "Please input query"}
                        side="bottom"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {isSearching ? (
                    <div className="text-center py-4">Retrieving...</div>
                ) : (
                    savedResults.map((result: any, index: number) => {
                        const text = result[0].pageContent
                        const source = result[0].metadata as { source?: string }
                        const score = result[1].toFixed(4)
                        const isExpanded = expandedItems.includes(index)

                        return (
                            <div
                                key={index}
                                className="mb-4 p-4 rounded-lg border border-[hsla(var(--app-border))] bg-[hsla(var(--app-bg))]"
                            >
                                <div 
                                    className={`whitespace-pre-wrap font-sans ${
                                        !isExpanded ? 'line-clamp-1' : ''
                                    }`}
                                >
                                    <Markdown
                                        remarkPlugins={[remarkMath]}
                                        rehypePlugins={[
                                            [rehypeKatex, { throwOnError: false }]
                                        ]}
                                    >
                                        {text}
                                    </Markdown>
                                </div>
                                <div
                                    onClick={() => toggleExpand(index)}
                                    className="flex items-center justify-center cursor-pointer hover:text-gray-700 text-gray-600 h-4 my-1"
                                >
                                    {isExpanded ? (
                                        <ChevronUp size={16} strokeWidth={2.5} />
                                    ) : (
                                        <ChevronDown size={16} strokeWidth={2.5} />
                                    )}
                                </div>
                                {source && (
                                    <div className="flex items-center text-sm text-gray-500 mt-2 pt-2 border-t border-[hsla(var(--app-border))]">
                                        <div className="flex items-center mr-3">
                                            <div className="text-sm text-gray-500">DISTANCE</div>
                                            <div className="ml-1 text-sm text-gray-700">{score}</div>
                                        </div>
                                        <FileText size={14} className="mr-1" />
                                        {source.source}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}; 