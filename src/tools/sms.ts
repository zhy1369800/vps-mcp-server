import twilio from 'twilio';

export async function handleSendSms(args: any): Promise<any> {
  try {
    const {
      to,
      body,
      from = process.env.TWILIO_FROM_NUMBER || '+17372508034',
      accountSid = process.env.TWILIO_ACCOUNT_SID,
      authToken = process.env.TWILIO_AUTH_TOKEN,
    } = args;

    if (!to) {
      throw new Error('接收方手机号 "to" 为必填项，格式示例: "+8619042774311"');
    }
    if (!body) {
      throw new Error('短信内容 "body" 为必填项');
    }
    if (!accountSid || !authToken) {
      throw new Error(
        '未配置 Twilio 凭据！请在环境变量中设置 TWILIO_ACCOUNT_SID 和 TWILIO_AUTH_TOKEN，或者在请求参数中传入 accountSid 与 authToken。'
      );
    }

    const client = twilio(accountSid, authToken);
    const message = await client.messages.create({
      body,
      from,
      to,
    });

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
      content: [
        {
          type: 'text',
          text: JSON.stringify(responseData, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ 发送短信失败: ${error.message || String(error)}`,
        },
      ],
      isError: true,
    };
  }
}
