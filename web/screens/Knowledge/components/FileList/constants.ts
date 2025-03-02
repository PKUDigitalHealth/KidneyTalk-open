import { PromptTemplate } from './types';

export const DEFAULT_PROMPTS: PromptTemplate = {
    classifierPrompt: localStorage.getItem('classifierPrompt') || `你的任务是将PDF切块后的文本块进行判断：该文本块是否蕴含医疗知识，如果是：则回复<YES>，否则回复<NO>，除此之外不要回复其它内容。

PDF切块后的文本块：
{text}`,
    formatterPrompt: localStorage.getItem('formatterPrompt') || `你的任务是对从PDF中解析并切块后的医学相关文本内容进行格式化整理，使其更方便人类阅读和理解。请严格按照以下要求执行：

1. 仅基于提供的文本内容进行整理：不得擅自增删、修改、或推理补全任何信息。
2. 保持内容完整性：确保所有切块内容在格式化后完整呈现，无遗漏。
3. 专注于格式优化：仅对文本格式、段落结构、标点符号、表格等进行调整，提升可读性。

请将整理后的完整内容返回，除此之外不要输出任何其他内容。

以下是PDF切块后的文本内容：
{text}`,
    enableClassifier: true,
    enableFormatter: true,
    classifierModel: localStorage.getItem('classifierModel') || 'qwen2.5:latest',
    formatterModel: localStorage.getItem('formatterModel') || 'qwen2.5:latest'
}; 