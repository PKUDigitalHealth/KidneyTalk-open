import { AgentConfig, BaseAgent, AgentResult } from "./BaseAgent"
import { KnowledgeQueryResponse } from '@janhq/core';

const DefaultPromptTemplate = `你的任务是基于用户的问题,以及相关的资料,生成一个答案:

---
用户问题:
{question}
---
相关资料:
{knowledge}
---

请直接返回答案,除此之外不要输出任何其他内容。`

const DefaultAgentConfig: AgentConfig = {
    enabled: true,
    name: 'AnswerGenerationAgent',
    emoji: '💬',
    modelConfig: {
        name: 'qwen2.5:latest',
        temperature: 0.5,
        topP: 0.9,
        topK: 40,
        repeatPenalty: 1.0,
    },
    promptTemplate: DefaultPromptTemplate
}

export const AnswerGenerationAgentPromptTemplateKey = 'AnswerGenerationAgentPromptTemplate';

interface ProcessInput {
    question: string;
    knowledge: KnowledgeQueryResponse;
}

type ProcessOutput = string;


export class AnswerGenerationAgent extends BaseAgent<
    ProcessInput, 
    ProcessOutput
> {
    /** 智能体配置,使用默认配置 */
    protected agentConfig: AgentConfig = DefaultAgentConfig;
    
    /** 本地存储key,用于持久化智能体配置 */
    protected localstorageKey: string = AnswerGenerationAgentPromptTemplateKey;

    async process(input: ProcessInput): Promise<AgentResult<ProcessOutput>> {
        this.updateAgentConfig();
        // 替换prompt模板中的变量,生成实际prompt
        const prompt = this.agentConfig.promptTemplate.replace('{question}', input.question).replace('{knowledge}', input.knowledge.map(doc => doc[0].pageContent).join('\n'));
        
        // 调用LLM获取优化后的查询描述
        const response = await this.getLLMResponse(prompt);
        
        // 返回检索结果
        return {
            result: response,
        };
    }
}