import { BaseAgent, AgentResult, AgentConfig, AgentContext } from './BaseAgent';
import { generate } from '@/utils/ollama';
import { Document } from '@/screens/Knowledge/types/document';

const DefaultPromptTemplate = `你的任务是判断下面的文本块内容是否对解答用户查询有帮助：

用户查询：
{query}

文本块：
{text}

如果有帮助请回复“相关”，并且使用1句话阐述你的判断，否则回复“不相关”即可，除此之外不要输出任何其他内容。`

const DefaultAgentConfig: AgentConfig = {
    enabled: false,
    name: 'Relevance Judgement Agent',
    emoji: '🔍',
    modelConfig: {
        name: 'qwen2.5:7b',
        temperature: 0.5,
        topP: 0.9,
        topK: 20,
        repeatPenalty: 0.5,
    },
    promptTemplate: DefaultPromptTemplate
}

export const relevanceJudgementAgentPromptTemplateKey = 'relevanceJudgementAgentPromptTemplate';

export class RelevanceJudgementAgent extends BaseAgent<{
    query: string;
    doc: Document;
}, string> {

    constructor(context: AgentContext) {
        super(context);
        this.updateAgentConfig();
    }

    protected agentConfig: AgentConfig = DefaultAgentConfig;
    protected localstorageKey: string = relevanceJudgementAgentPromptTemplateKey;

    async process(input: {
        query: string;
        doc: Document;
    }): Promise<AgentResult<string>> {
        const { query, doc } = input;

        this.updateAgentConfig();

        const prompt = this.agentConfig.promptTemplate.replace('{query}', query).replace('{text}', doc.pageContent);

        const response = await generate(this.agentConfig.modelConfig.name, prompt);
        const clean_response = response.trim();

        if (clean_response.includes('NO') || clean_response.includes('不相关')) {
            return {
                result: ''
            };
        }

        return {
            result: clean_response
        };
    }
} 