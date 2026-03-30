import axios from 'axios';

const claudeApi = axios.create(
    {
        baseURL: 'https://api.anthropic.com/v1',
        headers:{
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY || '',
            'anthropic-version': "2023-06-01",
        }
    }
);

 const callClaude = async (
    systemPrmpt: string,
    messages: any[],
    tools: any[]
) =>{

    try{
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
    }catch(error: any){
        // console.error("Error calling Claude API:", error.response?.data || error.message || error);
        // throw new Error(`Claude API call failed: ${error.response?.data?.error || error.message || error}`);
    
     console.error("Claude raw error:", error.response?.data);
    console.error("Claude status:",   error.response?.status);
    console.error("Claude message:",  error.message);
    throw new Error(error.response?.data?.error?.message || error.message);
    }
}
export default callClaude;