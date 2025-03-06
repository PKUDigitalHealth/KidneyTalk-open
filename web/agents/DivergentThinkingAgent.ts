import { AgentConfig, BaseAgent, AgentResult } from "./BaseAgent"
import { KnowledgeQueryResponse } from '@janhq/core';
import { searchKnowledge } from '@/utils/knowledgeSearch'


const DefaultPromptTemplate = `你的任务是基于用户的询问，从相关资料中充分发挥发散性思维，提出一个全新且独特的问题。请尽量避免重复或仅作表面改动，尝试从不同的视角、学科关联、应用场景或潜在影响等方面切入，以帮助用户拓展思路并更深刻地理解主题。

---
用户询问:
{query}
---
相关资料:
{knowledge}
---
已经存在的问题:
- {questions}
---

请直接返回一个全新问题的描述，除此之外不要输出任何其他内容。`

const DefaultAgentConfig: AgentConfig = {
    enabled: true,
    name: 'DivergentThinkingAgent',
    emoji: '💡',
    modelConfig: {
        name: 'qwen2.5:3b',
        temperature: 0.5,
        topP: 0.9,
        topK: 40,
        repeatPenalty: 1.0,
    },
    promptTemplate: DefaultPromptTemplate
}

export const DivergentThinkingAgentPromptTemplateKey = 'DivergentThinkingAgentPromptTemplate';

interface ProcessInput {
    query: string;
    knowledge: KnowledgeQueryResponse;
    divergentNum: number;
    topK: number;
}

type ProcessOutput = KnowledgeQueryResponse;



export class DivergentThinkingAgent extends BaseAgent<
    ProcessInput, 
    ProcessOutput
> {
    /** 智能体配置,使用默认配置 */
    protected agentConfig: AgentConfig = DefaultAgentConfig;
    
    /** 本地存储key,用于持久化智能体配置 */
    protected localstorageKey: string = DivergentThinkingAgentPromptTemplateKey;

    async process(input: ProcessInput): Promise<AgentResult<ProcessOutput>> {
        this.updateAgentConfig();
        
        const generatedQuestions: string[] = [];
        let allSearchResults: KnowledgeQueryResponse = [];

        // 循环生成发散问题
        for (let i = 0; i < input.divergentNum; i++) {
            // 替换prompt模板中的变量,生成实际prompt
            const prompt = this.agentConfig.promptTemplate
                .replace('{query}', input.query)
                .replace('{knowledge}', input.knowledge.map(doc => doc[0].pageContent).join('\n'))
                .replace('{questions}', generatedQuestions.join('\n- '));
            
            // 调用LLM获取新的发散问题
            const newQuestion = await this.getLLMResponse(prompt);
            
            // 将新问题添加到已生成问题列表中
            if (newQuestion && !generatedQuestions.includes(newQuestion)) {
                generatedQuestions.push(newQuestion);
                
                const searchResults = await searchKnowledge(newQuestion, input.topK);
                for (const doc of searchResults) {
                    doc[0].metadata.dbquery = newQuestion;
                }
                allSearchResults = [...allSearchResults, ...searchResults];
            }
        }

        return {
            result: allSearchResults,
        };
    }
}