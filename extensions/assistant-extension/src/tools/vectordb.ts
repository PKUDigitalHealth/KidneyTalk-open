import {
    InferenceTool,
    MessageRequest,
    executeOnMain,
    KnowledgeParseRequest,
    KnowledgeParseResponse,
    KnowledgeEmbedRequest,
    KnowledgeEmbedResponse,
    KnowledgeQueryRequest,
    KnowledgeQueryResponse
} from '@janhq/core'

export class VectorDBTool extends InferenceTool {
    name: string = 'vectordb'

    async process(
        data: MessageRequest,
    ): Promise<MessageRequest> {
        try {
            let parseResponse: KnowledgeParseResponse | undefined
            let embedResponse: KnowledgeEmbedResponse | undefined
            let queryResponse: KnowledgeQueryResponse | undefined

            if (!data.knowledge) {
                throw new Error('Knowledge is undefined')
            }

            switch (data.knowledge.operation) {
                case 'parseDoc':
                    if (!data.knowledge.parseDoc?.request) {
                        throw new Error('ParseDoc request is undefined')
                    }
                    parseResponse = await this.handleParseSplitter(data.knowledge.parseDoc.request)
                    break
                case 'embedDocs':
                    if (!data.knowledge.embedDocs?.request) {
                        throw new Error('EmbedDocs request is undefined')
                    }
                    embedResponse = await this.handleEmbedDocuments(data.knowledge.embedDocs.request)
                    break
                case 'query':
                    if (!data.knowledge.query?.request) {
                        throw new Error('Query request is undefined')
                    }
                    queryResponse = await this.handleQueryOperation(data.knowledge.query.request)
                    break
            }

            return {
                ...data,
                knowledge: {
                    ...data.knowledge,
                    result: {
                        code: 'success',
                        message: 'success'
                    },
                    parseDoc: {
                        request: data.knowledge.parseDoc?.request,
                        response: parseResponse
                    },
                    embedDocs: {
                        request: data.knowledge.embedDocs?.request,
                        response: embedResponse
                    },
                    query: {
                        request: data.knowledge.query?.request,
                        response: queryResponse
                    }
                }
            }
        } catch (error) {
            return this.handleError(data, error as Error)
        }
    }

    private async handleParseSplitter(request: KnowledgeParseRequest): Promise<KnowledgeParseResponse> {
        try {
            return await executeOnMain(
                NODE,
                'toolVectorDBParseSplitter',
                request
            )
            
        } catch (error) {
            throw error
        }
    }

    private async handleEmbedDocuments(request: KnowledgeEmbedRequest): Promise<KnowledgeEmbedResponse> {
        try {
            return await executeOnMain(
                NODE,
                'toolVectorDBEmbedDocuments',
                request
            )
        } catch (error) {
            throw error
        }
    }

    private async handleQueryOperation(request: KnowledgeQueryRequest): Promise<KnowledgeQueryResponse> {
        try {
            return await executeOnMain(
                NODE,
                'toolVectorDBQuery',
                request
            )
        } catch (error) {
            throw error
        }
    }

    private handleError(data: MessageRequest, error: Error): MessageRequest {
        return {
            ...data,
            knowledge: {
                ...data.knowledge,
                operation: data.knowledge?.operation as 'parseDoc' | 'embedDocs' | 'query',
                result: {
                    code: 'error',
                    message: error.message
                }
            }
        }
    }
}