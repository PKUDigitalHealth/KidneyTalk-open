export interface ProgressMessage {
    id?: string;
    value?: number;
    timestamp?: number;
    addToHistory?: boolean;
    title: string;      // 例如: "📝 Formatter Agent"
    subtitle: string;   // 例如: "Processing file 1/2"
    content: string;    // 例如: "Handling chunk 1/5: Lorem ipsum..."
    clearHistory?: boolean;
    
} 