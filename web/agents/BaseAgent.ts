import { generate } from '@/utils/ollama';
import { ProgressMessage } from '../screens/Knowledge/types/message';

export interface AgentConfig {
    enabled: boolean;
    name: string;
    modelConfig: {
        name: string;
        temperature?: number;
        topP?: number;
        topK?: number;
        repeatPenalty?: number;
    }
    emoji: string;
    promptTemplate: string;
}

export interface AgentResult<T> {
    result: T | null;
    message?: {
        title: string;
        subtitle: string;
        content: string;
    };
}

export interface AgentContext {
    fileIndex: number;
    totalFiles: number;
    chunkIndex: number;
    totalChunks: number;
}

export abstract class BaseAgent<InputType, OutputType> {
    constructor(
        protected context: AgentContext
    ) {}

    protected abstract agentConfig: AgentConfig;
    protected abstract localstorageKey: string;

    protected updateAgentConfig() {
        const storedConfig = localStorage.getItem(this.localstorageKey);
        if (storedConfig) {
            const config = JSON.parse(storedConfig);
            this.agentConfig = config;
        }
    }

    public getAgentConfig(): AgentConfig {
        this.updateAgentConfig();
        return this.agentConfig;
    }

    public saveAgentConfig(config: AgentConfig) {
        localStorage.setItem(this.localstorageKey, JSON.stringify(config));
        this.updateAgentConfig();
    }

    public getLocalStorageKey(): string {
        return this.localstorageKey;
    }

    public getLLMResponse(prompt: string): Promise<string> {
        return generate(this.agentConfig.modelConfig.name, prompt);
    }

    public getProgressMessage(text: string): string {
        const { fileIndex, totalFiles, chunkIndex, totalChunks } = this.context;
        return `${this.agentConfig.emoji} ${this.agentConfig.name} is handling file ${fileIndex + 1}/${totalFiles} chunk ${chunkIndex + 1}/${totalChunks} ${text}`;
    }

    public getCompletionMessage(text: string): string {
        const { fileIndex, totalFiles, chunkIndex, totalChunks } = this.context;
        return `${this.agentConfig.emoji} ${this.agentConfig.name} finished file ${fileIndex + 1}/${totalFiles} chunk ${chunkIndex + 1}/${totalChunks} ${text}`;
    }

    abstract process(input: InputType, fileIndex?: number, totalFiles?: number): Promise<AgentResult<OutputType>>;

    protected buildMessage(type: 'progress' | 'completion', content: string): ProgressMessage {
        const { fileIndex, totalFiles, chunkIndex, totalChunks } = this.context;
        
        return {
            id: `msg_${Date.now()}_${Math.random()}`,
            value: 0,
            timestamp: Date.now(),
            title: `${this.agentConfig.emoji} ${this.agentConfig.name}`,
            subtitle: `Processing file ${fileIndex + 1}/${totalFiles}`,
            content: type === 'progress' 
                ? `Handling chunk ${chunkIndex + 1}/${totalChunks}: ${content}`
                : content
        };
    }
} 