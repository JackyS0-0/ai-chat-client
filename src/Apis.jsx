import axios from 'axios';

const configs = {
    model: 'gpt-4o', //'gpt-3.5-turbo'
    api_key: 'xxx',
}

//It is not recommended to send requests directly from the web client (because the API key is included in the request headers).
//此处不建议直接在网页客户端中直接发送请求（因为请求头中填写的是你的api_key）

//It is recommended to start a backend service (such as a Node.js server). The client can then communicate with the server, which will in turn make the HTTP requests.
//建议启动一个后端服务(如Node服务) 由客户端访问服务端，再由服务端来发起http请求 
const Apis = {
    chatgpt: async ({ messages: reqMessages }) => {
        try {
            const { model, api_key } = configs;
            if (!reqMessages) {
                return { message: '请求错误: 缺少 "prompt" 参数' };
            }
            const messages = [{
                "role": "system",
                "content": `你的名字叫小轩，是独立开发者Jacky S调用ChatGPT模型创造的一个非常有用的AI助手。`
            }, ...reqMessages];
            const chatGPTResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: model,
                messages: messages,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${api_key}`,
                },
            });
            return chatGPTResponse;
        } catch (error) {
            console.error(error);
            return { message: "Server error" };
        }
    }
}

export default Apis;
