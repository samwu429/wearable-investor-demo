import { z } from 'zod'

const travelModeSchema = z.enum(['步行', '骑行', '驾车', '公交'])
const bubbleSchema = z.object({
  role: z.enum(['me', 'them']),
  text: z.string().min(1).max(500),
})

const chatUiSchema = z.object({
  peerName: z.string().min(1).max(40),
  peerStatus: z.string().min(1).max(80),
  bubbles: z.array(bubbleSchema).min(1).max(12),
})

const mapUiSchema = z.object({
  headline: z.string().min(1).max(120),
  fromLabel: z.string().min(1).max(40),
  toLabel: z.string().min(1).max(40),
  minutes: z.number().int().min(1).max(999),
  travelMode: travelModeSchema,
})

const moduleSchema = z.object({
  name: z.string().min(1).max(60),
  desc: z.string().min(1).max(200),
})

const screenSchema = z.object({
  label: z.string().min(1).max(24),
  tone: z.enum(['gold', 'mint', 'rose']),
})

export const jitUiPayloadSchema = z
  .object({
    uiMode: z.enum(['chat', 'map', 'split', 'scaffold']),
    productName: z.string().min(1).max(80),
    tagline: z.string().min(1).max(200),
    userIntentEcho: z.string().min(1).max(500),
    etaLine: z.string().min(1).max(200),
    chatUi: chatUiSchema.optional(),
    mapUi: mapUiSchema.optional(),
    modules: z.array(moduleSchema).optional(),
    screens: z.array(screenSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.uiMode === 'chat' && !data.chatUi) {
      ctx.addIssue({ code: 'custom', message: 'chat 模式需要 chatUi' })
    }
    if (data.uiMode === 'map' && !data.mapUi) {
      ctx.addIssue({ code: 'custom', message: 'map 模式需要 mapUi' })
    }
    if (data.uiMode === 'split' && (!data.chatUi || !data.mapUi)) {
      ctx.addIssue({ code: 'custom', message: 'split 模式需要 chatUi 与 mapUi' })
    }
    if (data.uiMode === 'scaffold' && (!data.modules || data.modules.length < 2)) {
      ctx.addIssue({ code: 'custom', message: 'scaffold 模式需要至少 2 个 modules' })
    }
  })

export type JitUiPayload = z.infer<typeof jitUiPayloadSchema>

export function extractJsonObject(raw: string): unknown {
  const t = raw.trim()
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/m.exec(t)
  const inner = fence ? fence[1].trim() : t
  return JSON.parse(inner) as unknown
}

export function parseJitUiPayload(raw: string): JitUiPayload {
  const obj = extractJsonObject(raw)
  return jitUiPayloadSchema.parse(obj)
}

export const JIT_UI_SYSTEM_PROMPT = `你是 TrustField 演示里的「即时界面（JIT）规格生成器」。根据用户一句自然语言口述，输出且仅输出一个 JSON 对象（不要 markdown 代码块，不要前后解释）。

顶层字段：
- uiMode: 只能是 "chat" | "map" | "split" | "scaffold"
- productName: 窗口标题（中文，简短）
- tagline: 副标题一行（中文）
- userIntentEcho: 对用户意图的简短复述（中文）
- etaLine: 一行免责/提示（中文）

按 uiMode 必须满足：
- chat：必须有 chatUi
- map：必须有 mapUi
- split：chatUi 与 mapUi 都必须有
- scaffold：modules 至少 2 条；可选 screens

chatUi 结构：
{ "peerName": string, "peerStatus": string, "bubbles": [ { "role": "me"|"them", "text": string } ] }
bubbles 模拟的是「用户给联系人发消息」的 App 界面，不是和用户助理对话。

**聊天内容规则（必须遵守）：**
1. 先根据口述还原用户要发的那条消息：role 为 "me" 的 text 必须是用户打算发送给对方的**具体内容**（可略作润色，但语义必须与口述一致，例如说不回家吃饭就不能写成别的）。
2. role 为 "them" 的每条回复必须是**针对上一条 me 消息**的合理回应：语气、信息与用户说的场景相符；禁止套用与当前内容无关的万能模板（例如用户说不回家吃饭，对方却在说做饭）。
3. 可 2～6 条气泡交替；若只需一轮，至少 me 一条 + them 一条。
4. peerName / peerStatus 与口述中的联系人一致。

mapUi 结构：
{ "headline": string, "fromLabel": string, "toLabel": string, "minutes": number, "travelMode": "步行"|"骑行"|"驾车"|"公交" }

scaffold 结构：
modules: [ { "name": string, "desc": string } ]
screens（可选）: [ { "label": string, "tone": "gold"|"mint"|"rose" } ]

地图、脚手架等字段须与用户口述中的地点、场景一致，避免空洞占位。`
