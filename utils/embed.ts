
async function embed(text: string) {

    try {

const response = await fetch("http://localhost:11434/api/embeddings", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify({
        model: "nomic-embed-text",
        prompt: text,
    })});

    const data = await response.json();

    if(!data || !data.embedding){
        throw new Error("Invalid embedding response");
        return null;
    }

return data.embedding;
    } catch (error) {
        console.log("Embedding error:", error);
        throw new Error("Failed to generate embedding");
        return null;
    }

}

export { embed };