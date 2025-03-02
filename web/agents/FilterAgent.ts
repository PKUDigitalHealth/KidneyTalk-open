import { BaseAgent, AgentResult, AgentConfig, AgentContext } from './BaseAgent';
import { generate } from '@/utils/ollama';
import { Document } from '@/screens/Knowledge/types/document';
import { events } from '@janhq/core';


export const FilterAgentPromptTemplateKey = 'FilterAgentPromptTemplate';

const DefaultPromptTemplate = `你的任务是判断以下的内容是否涵盖医学知识：
---
{text}
---

如果是请回复Y，否则回复N，除此之外不要输出其它内容。`

const DefaultAgentConfig: AgentConfig = {
    enabled: false,
    name: 'Filter Agent',
    emoji: '🦾',
    modelConfig: {
        name: 'qwen2.5:latest',
        temperature: 0.5,
        topP: 0.9,
        topK: 40,
        repeatPenalty: 1.0,
    },
    promptTemplate: DefaultPromptTemplate
}


export class FilterAgent extends BaseAgent<Document, Document> {

    constructor(context: AgentContext) {
        super(context);
        this.updateAgentConfig();
    }

    protected agentConfig: AgentConfig = DefaultAgentConfig;
    protected localstorageKey: string = FilterAgentPromptTemplateKey;

    async process(doc: Document, fileIndex: number, totalFiles: number): Promise<AgentResult<Document>> {

        this.updateAgentConfig();

        const prompt = this.agentConfig.promptTemplate.replace('{text}', doc.pageContent);
        const generateResult = await generate(this.agentConfig.modelConfig.name, prompt);
        const isValid = generateResult.trim().toUpperCase().includes('YES') ||
            generateResult.trim() === '<YES>' ||
            generateResult.trim() === 'Y';

        events.emit('knowledge:progress', {
            title: `${this.agentConfig.emoji} ${this.agentConfig.name}`,
            value: Number((fileIndex / totalFiles * 100).toFixed(4)),
            subtitle: `file ${fileIndex + 1}/${totalFiles}`,
            content: `${doc.pageContent}`,
            addToHistory: false
        });

        return {
            result: isValid ? doc : null,
        };
    }
}