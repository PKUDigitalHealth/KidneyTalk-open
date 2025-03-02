import React, { useEffect, useState } from 'react';
import { Button, Tooltip, Modal, TextArea, Switch } from '@janhq/joi';
import { listLocalModels, LocalModel } from '@/utils/ollama';
import { FilterAgent, AgentConfig } from '@/agents';

interface AgentInstructionModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    error?: string;
}

// 保留默认选项以防API调用失败
const DEFAULT_MODEL_OPTIONS = [
    { value: 'qwen2.5:latest', label: 'qwen2.5:latest' },
    { value: 'llama2:latest', label: 'llama2:latest' },
    { value: 'mistral:latest', label: 'mistral:latest' }
];

export const AgentInstructionModal: React.FC<AgentInstructionModalProps> = ({
    isOpen,
    onOpenChange,
    error
}) => {
    const [modelOptions, setModelOptions] = useState(DEFAULT_MODEL_OPTIONS);
    const [isLoading, setIsLoading] = useState(false);

    // 创建 agent 实例
    const filterAgent = new FilterAgent({ fileIndex: 0, totalFiles: 0, chunkIndex: 0, totalChunks: 0 });

    // 初始化 agent 配置状态
    const [filterAgentConfig, setFilterAgentConfig] = useState<AgentConfig>(() => {
        const stored = localStorage.getItem(filterAgent.getLocalStorageKey());
        return stored ? JSON.parse(stored) : filterAgent.getAgentConfig();
    });


    // 获取模型列表
    useEffect(() => {
        const fetchModels = async () => {
            setIsLoading(true);
            try {
                const models = await listLocalModels();
                if (models.length > 0) {
                    // 过滤掉包含 embed 的模型，并转换为选项格式
                    const options = models
                        .filter((model: LocalModel) => 
                            !model.name.toLowerCase().includes('embed')
                        )
                        .map((model: LocalModel) => ({
                            value: model.name,
                            label: `${model.name} (${model.details.parameter_size})`
                        }));
                    setModelOptions(options);
                }
            } catch (error) {
                console.error('获取模型列表失败:', error);
                setModelOptions(DEFAULT_MODEL_OPTIONS);
            } finally {
                setIsLoading(false);
            }
        };

        if (isOpen) {
            fetchModels();
        }
    }, [isOpen]);

    const ModelSelect: React.FC<{
        value: string;
        onChange: (value: string) => void;
        disabled?: boolean;
    }> = ({ value, onChange, disabled }) => (
        <div>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full p-2 rounded-md border border-gray-300"
                disabled={isLoading || disabled}
            >
                {isLoading ? (
                    <option>加载中...</option>
                ) : (
                    modelOptions.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))
                )}
            </select>
            {isLoading && (
                <div className="text-sm text-gray-500 mt-1">
                    正在加载可用模型...
                </div>
            )}
        </div>
    );

    // 保存配置
    const handleSave = () => {
        filterAgent.saveAgentConfig(filterAgentConfig);
        onOpenChange(false);
    };

    const content = (
        <div className="space-y-4">
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="font-medium">Filter Agent</label>
                    <Switch
                        checked={filterAgentConfig.enabled}
                        onChange={(e) => setFilterAgentConfig({
                            ...filterAgentConfig,
                            enabled: e.target.checked
                        })}
                    />
                </div>
                <div className="space-y-2">
                    <ModelSelect
                        value={filterAgentConfig.modelConfig.name}
                        onChange={(value) => setFilterAgentConfig({
                            ...filterAgentConfig,
                            modelConfig: {
                                ...filterAgentConfig.modelConfig,
                                name: value
                            }
                        })}
                        disabled={!filterAgentConfig.enabled}
                    />
                    <Tooltip
                        trigger={
                            <TextArea
                                value={filterAgentConfig.promptTemplate}
                                onChange={(e) => setFilterAgentConfig({
                                    ...filterAgentConfig,
                                    promptTemplate: e.target.value
                                })}
                                className="min-h-[200px]"
                                placeholder="请输入分类提示词模板..."
                                disabled={!filterAgentConfig.enabled}
                            />
                        }
                        content="Prompt template for determining if text blocks contain medical knowledge. Must include {text} as a placeholder"
                        side="top"
                    />
                </div>
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <div className="flex justify-end gap-2">
                <Button onClick={() => onOpenChange(false)} variant="solid">
                    Cancel
                </Button>
                <Button onClick={handleSave}>
                    Save
                </Button>
            </div>
        </div>
    );

    return (
        <Modal
            open={isOpen}
            onOpenChange={onOpenChange}
            title="Agent Setting"
            content={content}
        />
    );
}; 