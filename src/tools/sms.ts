import twilio from 'twilio';
import type { Twilio } from 'twilio';

// 模块级客户端缓存：仅对使用环境变量凭据的默认客户端进行复用
let defaultClient: Twilio | null = null;

function getClient(accountSid: string, authToken: string, isDynamic: boolean): Twilio {
  if (!isDynamic) {
    // 环境变量凭据场景：复用单例，避免每次重建连接池
    if (!defaultClient) {
      defaultClient = twilio(accountSid, authToken);
    }
    return defaultClient;
  }
  // 动态传入凭据场景：按需创建，不缓存
  return twilio(accountSid, authToken);
}

export async function handleSendSms(args: any): Promise<any> {
  try {
    const {
      to,
      body,
      from = process.env.TWILIO_FROM_NUMBER,
      accountSid = process.env.TWILIO_ACCOUNT_SID,
      authToken = process.env.TWILIO_AUTH_TOKEN,
    } = args;

    if (!to) {
      throw new Error('接收方手机号 "to" 为必填项，格式示例: "+86xxxxxxxxxxx"');
    }
    if (!body) {
      throw new Error('短信内容 "body" 为必填项');
    }
    if (!accountSid || !authToken) {
      throw new Error(
        '未配置 Twilio 凭据！请在环境变量中设置 TWILIO_ACCOUNT_SID 和 TWILIO_AUTH_TOKEN，或者在请求参数中传入 accountSid 与 authToken。'
      );
    }
    if (!from) {
      throw new Error(
        '未配置发送方号码 "from"！请在环境变量中设置 TWILIO_FROM_NUMBER，或者在请求参数中传入 from 参数（E.164 格式，例如 +1xxxxxxxxxx）。'
      );
    }

    // 判断是否使用了动态传入的凭据（与环境变量不同则视为动态）
    const isDynamic =
      accountSid !== process.env.TWILIO_ACCOUNT_SID ||
      authToken !== process.env.TWILIO_AUTH_TOKEN;

    const client = getClient(accountSid, authToken, isDynamic);
    const message = await client.messages.create({ body, from, to });

    const responseData = {
      sid: message.sid,
      accountSid: message.accountSid,
      apiVersion: message.apiVersion,
      body: message.body,
      dateCreated: message.dateCreated,
      dateSent: message.dateSent,
      dateUpdated: message.dateUpdated,
      direction: message.direction,
      errorCode: message.errorCode,
      errorMessage: message.errorMessage,
      from: message.from,
      to: message.to,
      messagingServiceSid: message.messagingServiceSid,
      numMedia: message.numMedia,
      numSegments: message.numSegments,
      price: message.price,
      priceUnit: message.priceUnit,
      status: message.status,
      uri: message.uri,
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }],
    };
  } catch (error: any) {
    // 🔒 安全性：只暴露 message 和 Twilio 错误码，不泄露原始 response body（可能含凭据信息）
    const code = error.code ? ` (code: ${error.code})` : '';
    const status = error.status ? ` [HTTP ${error.status}]` : '';
    return {
      content: [{ type: 'text', text: `❌ 发送短信失败${status}${code}: ${error.message || String(error)}` }],
      isError: true,
    };
  }
}
