import {
  fs,
  Assistant,
  events,
  joinPath,
  AssistantExtension,
  AssistantEvent,
  ToolManager,
} from '@janhq/core'
import { RetrievalTool } from './tools/retrieval'
import { VectorDBTool } from './tools/vectordb'
import { defaultAssistant, summarisationAssistant, structuringAssistant } from './assistants'

export default class JanAssistantExtension extends AssistantExtension {
  private static readonly _homeDir = 'file://assistants'

  async onLoad() {
    // 注册检索工具
    ToolManager.instance().register(new RetrievalTool())

    // 注册向量数据库工具
    ToolManager.instance().register(new VectorDBTool())

    // 检查助手目录是否存在
    const assistantDirExist = await fs.existsSync(
      JanAssistantExtension._homeDir
    )
    // 如果版本不匹配或目录不存在,则进行初始化
    if (
      localStorage.getItem(`${this.name}-version`) !== VERSION ||
      !assistantDirExist
    ) {
      // 如果目录不存在则创建
      if (!assistantDirExist) await fs.mkdir(JanAssistantExtension._homeDir)

      // 写入助手元数据
      await this.createJanAssistant()
      // 更新版本号
      localStorage.setItem(`${this.name}-version`, VERSION)
      // 触发助手更新事件
      events.emit(AssistantEvent.OnAssistantsUpdate, {})
    }
  }

  /**
   * Called when the extension is unloaded.
   */
  onUnload(): void {}

  async createAssistant(assistant: Assistant): Promise<void> {
    const assistantDir = await joinPath([
      JanAssistantExtension._homeDir,
      assistant.id,
    ])
    if (!(await fs.existsSync(assistantDir))) await fs.mkdir(assistantDir)

    // 构建助手元数据文件路径
    const assistantMetadataPath = await joinPath([
      assistantDir,
      'assistant.json',
    ])
    try {
      // 将助手信息写入JSON文件
      await fs.writeFileSync(
        assistantMetadataPath,
        JSON.stringify(assistant, null, 2)
      )
    } catch (err) {
      console.error(err)
    }
  }

  async getAssistants(): Promise<Assistant[]> {
    try {
      const results: Assistant[] = []
      // 读取助手目录下的所有文件
      const allFileName: string[] = await fs.readdirSync(
        JanAssistantExtension._homeDir
      )

      // 遍历所有文件
      for (const fileName of allFileName) {
        const filePath = await joinPath([
          JanAssistantExtension._homeDir,
          fileName,
        ])

        // 跳过非目录文件
        if (!(await fs.fileStat(filePath))?.isDirectory) continue
        // 过滤出assistant.json文件
        const jsonFiles: string[] = (await fs.readdirSync(filePath)).filter(
          (file: string) => file === 'assistant.json'
        )

        // 如果不是只有一个assistant.json文件,则跳过
        if (jsonFiles.length !== 1) {
          continue
        }

        // 读取并解析助手配置文件
        const content = await fs.readFileSync(
          await joinPath([filePath, jsonFiles[0]]),
          'utf-8'
        )
        const assistant: Assistant =
          typeof content === 'object' ? content : JSON.parse(content)

        results.push(assistant)
      }

      return results
    } catch (err) {
      console.debug(err)
      // 发生错误时返回默认助手
      return [defaultAssistant]
    }
  }

  async deleteAssistant(assistant: Assistant): Promise<void> {
    // 禁止删除默认的Jan助手
    if (assistant.id === 'jan') {
      return Promise.reject('Cannot delete Jan Assistant')
    }

    // 删除助手目录
    const assistantDir = await joinPath([
      JanAssistantExtension._homeDir,
      assistant.id,
    ])
    return fs.rm(assistantDir)
  }

  private async createJanAssistant(): Promise<void> {
    await this.createAssistant(defaultAssistant)
    await this.createAssistant(structuringAssistant)
    await this.createAssistant(summarisationAssistant)
  }
}
