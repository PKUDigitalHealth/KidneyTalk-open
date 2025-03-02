export const medicalTextClassifierPrompt = `你的任务是将PDF切块后的文本块进行判断：该文本块是否蕴含医疗知识，如果是：则回复<YES>，否则回复<NO>，除此之外不要回复其它内容。

PDF切块后的文本块：
{text}
`; 