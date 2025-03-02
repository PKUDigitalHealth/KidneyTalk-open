// 模型详情的类型定义
interface ModelDetails {
    format: string
    family: string
    families: string[] | null
    parameter_size: string
    quantization_level: string
}

// 单个模型信息的类型定义
export interface LocalModel {
    name: string
    modified_at: string
    size: number
    digest: string
    details: ModelDetails
}

// API响应的类型定义
interface ListModelsResponse {
    models: LocalModel[]
}

// 聊天消息的类型定义
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant' | 'tool'
    content: string
    images?: string[] // base64编码的图片数组
    tool_calls?: any[] // 工具调用
}

// 生成请求的选项
export interface GenerateOptions {
    seed?: number
    temperature?: number
    top_k?: number
    top_p?: number
    num_predict?: number
    stop?: string[]
    // ... 其他选项
}

// 基础URL
const OLLAMA_BASE_URL = 'http://localhost:11434'

/**
 * 获取本地可用的模型列表
 * @returns Promise<LocalModel[]> 返回本地模型列表
 */
export const listLocalModels = async (): Promise<LocalModel[]> => {
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`)
        if (!response.ok) {
            throw new Error('Failed to fetch models')
        }
        const data: ListModelsResponse = await response.json()
        return data.models
    } catch (error) {
        console.error('获取本地模型列表失败:', error)
        // 提示用户ollama服务未启动
        alert('Ollama服务未启动，请先启动Ollama服务')
        return []
    }
}

/**
 * 生成聊天回复
 * @param model 模型名称
 * @param messages 聊天消息历史
 * @param options 生成选项
 * @returns Promise<string> 返回生成的回复
 */
export const chat = async (
    model: string,
    messages: ChatMessage[],
    options?: GenerateOptions
): Promise<string> => {
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages,
                stream: false,
                options
            }),
        })
        const data = await response.json()
        return data.message?.content || ''
    } catch (error) {
        console.error('聊天生成失败:', error)
        return ''
    }
}

/**
 * 生成文本补全
 * @param model 模型名称
 * @param prompt 提示文本
 * @param options 生成选项
 * @returns Promise<string> 返回生成的文本
 */
export const generate = async (
    model: string,
    prompt: string,
    options?: GenerateOptions & {
        onProgress?: (text: string) => void
    },
    stream: boolean = false
): Promise<string> => {
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                prompt,
                options,
                stream: stream
            }),
        });

        if (!stream) {
            const data = await response.json();
            return data.response || '';
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('Failed to get reader');

        let fullText = '';
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
                try {
                    const data = JSON.parse(line);
                    if (data.response) {
                        fullText += data.response;
                        options?.onProgress?.(fullText);
                    }
                } catch (e) {
                    console.warn('Failed to parse JSON:', e);
                }
            }
        }

        return fullText;
    } catch (error) {
        console.error('文本生成失败:', error);
        return '';
    }
};

/**
 * 删除模型
 * @param model 要删除的模型名称
 * @returns Promise<boolean> 是否删除成功
 */
export const deleteModel = async (model: string): Promise<boolean> => {
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/delete`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ model }),
        })
        return response.ok
    } catch (error) {
        console.error('删除模型失败:', error)
        return false
    }
}

/**
 * 获取模型信息
 * @param model 模型名称
 * @returns Promise<any> 返回模型详细信息
 */
export const showModel = async (model: string): Promise<any> => {
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/show`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ model }),
        })
        return await response.json()
    } catch (error) {
        console.error('获取模型信息失败:', error)
        return null
    }
}

/**
 * 生成文本嵌入
 * @param model 模型名称
 * @param input 输入文本或文本数组
 * @returns Promise<number[][]> 返回嵌入向量数组
 */
export const embed = async (
    model: string,
    input: string | string[]
): Promise<number[][]> => {
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/embed`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ model, input }),
        })
        const data = await response.json()
        return data.embeddings || []
    } catch (error) {
        console.error('生成嵌入失败:', error)
        return []
    }
}

// 定义拉取模型时的响应类型
interface PullModelResponse {
    status: string
    digest?: string
    total?: number
    completed?: number
}

/**
 * 拉取模型
 * @param model 要拉取的模型名称
 * @param options 选项配置
 * @returns Promise<boolean> 是否拉取成功
 */
export const pullModel = async (
    model: string,
    options?: {
        insecure?: boolean
        stream?: boolean
        onProgress?: (response: PullModelResponse) => void
    }
): Promise<boolean> => {
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/pull`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                insecure: options?.insecure || false,
                stream: options?.stream !== false, // 默认为true
            }),
        })

        // 如果不是流式模式，直接返回结果
        if (options?.stream === false) {
            const data = await response.json()
            return data.status === 'success'
        }

        // 处理流式响应
        const reader = response.body?.getReader()
        if (!reader) throw new Error('Failed to get reader')

        const decoder = new TextDecoder()
        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split('\n').filter(line => line.trim())
            
            for (const line of lines) {
                try {
                    const data: PullModelResponse = JSON.parse(line)
                    options?.onProgress?.(data)
                    
                    // 如果收到成功状态，结束流式读取
                    if (data.status === 'success') {
                        return true
                    }
                } catch (e) {
                    console.warn('解析JSON失败:', e)
                }
            }
        }

        return true
    } catch (error) {
        console.error('拉取模型失败:', error)
        return false
    }
}

// // 流式模式使用示例
// await pullModel('llama2', {
//     onProgress: (response) => {
//         if (response.total && response.completed) {
//             const progress = (response.completed / response.total) * 100
//             console.log(`下载进度: ${progress.toFixed(2)}%`)
//         }
//         console.log('状态:', response.status)
//     }
// })

// // 非流式模式使用示例
// const success = await pullModel('llama2', { stream: false })
// if (success) {
//     console.log('模型拉取成功')
// } else {
//     console.log('模型拉取失败')
// } 