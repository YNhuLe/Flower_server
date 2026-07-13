async function embedWithOllama(text: string): Promise<number[]> {
  const response = await fetch("http://localhost:11434/api/embed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "nomic-embed-text", input: text }),
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.status}`);
  }

  const data = await response.json();

  if (!data?.embedding) {
    throw new Error("Invalid embedding response from Ollama");
  }

  return data.embedding;
}

export { embedWithOllama };