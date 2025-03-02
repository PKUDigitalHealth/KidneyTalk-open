export interface PromptTemplate {
    enableClassifier: boolean;
    enableFormatter: boolean;
    classifierModel: string;
    formatterModel: string;
    classifierPrompt: string;
    formatterPrompt: string;
} 