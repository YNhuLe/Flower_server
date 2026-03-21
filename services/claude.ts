import axios from 'axios';

const claudeApi = axios.create(
    {
        baseURL: 'https://api.anthropic.com/v1',
        headers:{
            'Content-Type': 'application/json',
            'X-API-Key': process.env.ANTHROPIC_API_KEY || '',
            anthropic_version: "2023-06-01",
        }
    }
);

 const callClaude = async (
    systemPrmpt: string,
    messages: any[],
    tools: any[]
) =>{
    const response = await claudeApi.post(
        '/messages', {
            model: "claude-haiku-4-5-20251001",
            max_tokens:1000,
            system: systemPrmpt,
            tools,
            messages
        }
    );
    return response.data;
}
export default callClaude;