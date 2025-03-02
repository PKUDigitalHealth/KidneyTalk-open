import {
    Assistant,
} from '@janhq/core'

export const defaultAssistant: Assistant = {
    avatar: '',
    thread_location: undefined,
    id: 'jan',
    object: 'assistant',
    created_at: Date.now() / 1000,
    name: 'Jan',
    description: 'A default assistant that can use all downloaded models',
    model: '*',
    instructions: '',
    tools: [
        // 检索工具配置
        {
            type: 'retrieval',
            enabled: false,
            useTimeWeightedRetriever: false,
            settings: {
                top_k: 2,
                chunk_size: 1024,
                chunk_overlap: 64,
                retrieval_template: `---------------- 
<上下文>: {CONTEXT}`,
            },
        },
        // 向量数据库工具配置
        {
            type: 'vectordb',
            enabled: true,
            settings: {
                top_k: 2,
                chunk_size: 1024,
                chunk_overlap: 64
            }
        }
    ],
    file_ids: [],
    metadata: undefined,
}


export const structuringAssistant: Assistant = {
    avatar: '',
    thread_location: undefined,
    id: 'structuring',
    object: 'assistant',
    created_at: Date.now() / 1000,
    name: 'Structuring',
    description: 'A assistant that can use all downloaded models',
    model: '*',
    instructions: `任务要求：从给定医疗报告中提取出结构化信息。

任务示例如下：
示例1
医疗报告: 
标本类型:全胃切除肿瘤所在位置:贲门小弯切除标本长度:部分食管 2.0cm；胃小弯 9.0cm；胃大弯 15.0cm；肿瘤距上切缘：1.5cm； 肿瘤距下切缘：7.5cm；肿瘤大体类型:浸润溃疡型（Borrmann III型）肿瘤大小:5.0×3.0×1.5cm组织学类型:低分化腺癌，部分印戒细胞癌；组织学分级:低分化 浸润深度:浸润至浆膜外纤维脂肪组织脉管内癌栓:（+）神经侵犯:（+）标本上切缘:（-）标本下切缘:（-）另送上切缘:（-）大网膜:（-）淋巴结转移情况:找到小弯侧淋巴结（1/2）、“第1组淋巴结”（1/6）、“第3组淋巴结”（2/8），见癌转移。“第2组淋巴结”（0/3）、“第4组淋巴结”（0/7）、“第6组淋巴结”（0/2）、“第789组淋巴结”（0/11），均未见癌转移。“第5组淋巴结”为脂肪血管组织，未见癌累及。免疫组化及特殊检查:I2020-04384 肿瘤细胞：AE1/AE3（+），Her-2（0），Ki67（80%+），MLH1（蛋白表达），PMS2（蛋白表达），MSH2（蛋白表达），MSH6（蛋白表达），EBER（-），PD-L1{22C3}（CPS=2），PD-L1{22C3}阳性对照（+），PD-L1{22C3}阴性对照（+）。备注：PD-L1{22C3}免疫组化检测平台为DAKO Link 48 Autostainer；CPS为联合阳性评分，即计数方法为（可计数的阳性肿瘤细胞、淋巴细胞、巨噬细胞）×100/所有可计数的肿瘤细胞总数。
结构化结果: {'AE1/AE3': '+', 'Her2': 0, 'Ki67': '80%+', 'MLH1': '蛋白表达', 'MSH2': '蛋白表达', 'MSH6': '蛋白表达', 'PD-L1表达评分': 'CPS=2', 'PD-L1阳性对照': '+', 'EBER': '-', 'PMS2': '蛋白表达'}

示例2
医疗报告: 
标本类型:全胃切除肿瘤所在位置:胃窦体交界小弯侧切除标本长度:胃小弯 8.0cm;胃大弯 17.0cm;肿瘤距上切缘：4.5cm； 肿瘤距下切缘：10.0cm；肿瘤大体类型:弥漫浸润型（Borrmann IV型）肿瘤大小:4.5×2.0×0.5cm组织学类型:黏液腺癌（ICD－O编码 8480/3）组织学分级:低分化 浸润深度:浸润至浆膜外纤维脂肪组织脉管内癌栓:（+）神经侵犯:（+）标本上切缘:（+）标本下切缘:（-）另送上切缘:（1）、（2）均（+）大网膜:（-）淋巴结转移情况:找到小弯侧淋巴结（4/4）、“第5组淋巴结”（1/3）、“第6组淋巴结”（5/9）、“第7、8、9、11组淋巴结”（1/2），见癌转移。“第4组淋巴结”（0/1）、“第12组淋巴结”（0/1），均未见癌转移。“第2组淋巴结”及“第110组淋巴结”送检均为脂肪组织，未见癌累及。免疫组化及特殊检查:I2020-04534 Her-2（1+），Ki67（高表达区约80%+），MLH1（蛋白表达），PMS2（蛋白表达），MSH2（蛋白表达），MSH6（蛋白表达），AE1/AE3（+），D2-40（-）；EBV原位杂交示：EBER（-）。PD-L1{22C3}（CPS<1），PD-L1{22C3}阳性对照（+）；备注：PD-L1{22C3}免疫组化检测平台为DAKO Link 48 Autostainer。治疗效果:肿瘤退缩分级（TRG）：2级。
结构化结果: {'AE1/AE3': '+', 'Her2': '1+', 'Ki67': '高表达区约80%+', 'MLH1': '蛋白表达', 'MSH2': '蛋白表达', 'MSH6': '蛋白表达', 'PD-L1表达评分': 'CPS<1', 'PD-L1阳性对照': '+', 'EBER': '-', 'PMS2': '蛋白表达'}

示例3
医疗报告: 
标本类型:全胃切除肿瘤所在位置:胃窦切除标本长度:胃小弯9.0 cm;胃大弯14.0 cm;肿瘤距上切缘：4.0cm； 肿瘤距下切缘：6.0cm肿瘤大体类型:局部溃疡型（Borrmann II型）肿瘤大小:1.5×1.5×0.3cm组织学类型:腺癌（ICD－O编码 8211/3）组织学分级:中－低分化 浸润深度:限于黏膜及黏膜下层脉管内癌栓:（-）神经侵犯:（-）标本上切缘:（-）另送下切缘:（-）大网膜:（-）淋巴结转移情况:小弯淋巴结12枚、大弯淋巴结6枚，均未见癌转移其他或另送:“第8组淋巴结”送检纤维脂肪组织，未见癌累及。免疫组化及特殊检查:I2020-04988：瘤细胞 MLH1（蛋白表达），MSH2（蛋白表达），MSH6（蛋白表达），PMS2（蛋白表达），Ki67（80%+），AE1/AE3（+），PD-L1{22C3}（CPS<1），PD-L1{22C3}阳性对照（+）。备注：PD-L1{22C3}免疫组化检测平台为DAKO Link 48 Autostainer；CPS为联合阳性评分，即计数方法为（可计数的阳性肿瘤细胞、淋巴细胞、巨噬细胞）×100/所有可计数的肿瘤细胞总数； Her-2（2+）。EBV原位杂交：EBER（散在+）。
结构化结果: {'AE1/AE3': '+', 'Her2': '2+', 'Ki67': '80%+', 'MLH1': '蛋白表达', 'MSH2': '蛋白表达', 'MSH6': '蛋白表达', 'PD-L1表达评分': 'CPS<1', 'PD-L1阳性对照': '+', 'EBER': '散在+', 'PMS2': '蛋白表达'}

医疗报告：`,
    file_ids: [],
    metadata: undefined,
}

export const summarisationAssistant: Assistant = {
    avatar: '',
    thread_location: undefined,
    id: 'summarisation',
    object: 'assistant',
    created_at: Date.now() / 1000,
    name: 'Summarisation',
    description: 'A assistant that can use all downloaded models',
    model: '*',
    instructions: `任务要求：将用户所给的医疗文本进行总结
医疗文本：`,
    file_ids: [],
    metadata: undefined,
}