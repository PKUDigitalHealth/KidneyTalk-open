import { AgentConfig, BaseAgent, AgentResult } from "./BaseAgent"
import { KnowledgeQueryResponse } from '@janhq/core';
import { searchKnowledge } from '@/utils/knowledgeSearch'
import { ThreadMessage } from '@janhq/core'

const DefaultPromptTemplate = `你的任务是基于用户问题和对话历史，设计一个更精确的查询描述,该查询描述用于在知识库中通过HNSW算法进行语义检索:

---
对话历史:
{history}
---
用户问题:
{query}
---

请直接返回查询描述,除此之外不要输出任何其他内容。`

const DefaultAgentConfig: AgentConfig = {
    enabled: true,
    name: 'QueryRefinementAgent',
    emoji: '🔍',
    modelConfig: {
        name: 'qwen2.5:7b',
        temperature: 0.5,
        topP: 0.9,
        topK: 40,
        repeatPenalty: 1.0,
    },
    promptTemplate: DefaultPromptTemplate
}

export const QueryRefinementAgentPromptTemplateKey = 'QueryRefinementAgentPromptTemplate';

interface ProcessInput {
    query: string;
    history: ThreadMessage[];
    topK: number;
}

type ProcessOutput = KnowledgeQueryResponse;


/**
 * 查询优化智能体类
 * 继承自BaseAgent基类,用于优化用户查询以提高知识库检索效果
 * 
 * @extends BaseAgent<ProcessInput,ProcessOutput>
 * @template ProcessInput - 输入类型,包含用户问题和对话历史
 * @template ProcessOutput - 输出类型,为知识库检索结果
 */
export class QueryRefinementAgent extends BaseAgent<
    ProcessInput, 
    ProcessOutput
> {
    /** 智能体配置,使用默认配置 */
    protected agentConfig: AgentConfig = DefaultAgentConfig;
    
    /** 本地存储key,用于持久化智能体配置 */
    protected localstorageKey: string = QueryRefinementAgentPromptTemplateKey;

    /**
     * 处理用户输入,生成优化后的查询并执行知识库检索
     * 
     * @param input - 包含用户问题和对话历史的输入对象
     * @returns 返回知识库检索结果的Promise
     */
    async process(input: ProcessInput): Promise<AgentResult<ProcessOutput>> {
        this.updateAgentConfig();

        // 替换prompt模板中的变量,生成实际prompt
        const prompt = this.agentConfig.promptTemplate
            .replace('{query}', input.query)
            .replace('{history}', input.history.map(msg => `${msg.role}: ${msg.content[0]?.text?.value}`).join('\n'));
        
        // 调用LLM获取优化后的查询描述
        // const response = await this.getLLMResponse(prompt);
        
        // 使用工具函数执行知识库搜索
        const searchResults = await searchKnowledge(input.query, input.topK);

        for (const doc of searchResults) {
            doc[0].metadata.dbquery = input.query;
        }

        // 返回检索结果
        return {
            result: searchResults
        };
    }
}