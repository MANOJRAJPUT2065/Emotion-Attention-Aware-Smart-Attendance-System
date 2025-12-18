import React, { useState } from 'react';

const LLaMAChat = () => {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]); // Track conversation history

  const handleInputChange = (event) => {
    setInput(event.target.value);
  };

  const generateAiResponse = async (inputMessage) => {
    try {
      setLoading(true);
      setError(null);

      // Construct the prompt from conversation history
      const historyPrompt = conversationHistory
        .map(entry => `${entry.role}: ${entry.content}`)
        .join('\n');
      
      const prompt = `${historyPrompt}\nuser: ${inputMessage}`;

      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage, // Only send the new message to the server
        }),
      });

      if (response.ok) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let result = '';

        // Stream processing
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Decode the value and append to buffer
          buffer += decoder.decode(value, { stream: true });

          // Split buffer into lines
          const lines = buffer.split('\n');

          // Process each line except the last one (which might be incomplete)
          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i].trim();
            if (line) {
              try {
                const parsed = JSON.parse(line);
                if (parsed.chunk === '[DONE]') {
                  // Stop processing when "[DONE]" is received
                  return;
                }
                if (parsed.chunk) {
                  result += parsed.chunk; // Append the chunk to the result
                  setResponse(result); // Update response state with partial result
                }
              } catch (err) {
                console.error('Error parsing JSON', err);
              }
            }
          }

          // Keep the last line in the buffer if it's incomplete
          buffer = lines[lines.length - 1];
        }

        // Update conversation history with the AI's response
        setConversationHistory([
          ...conversationHistory,
          { role: 'user', content: inputMessage },
          { role: 'ai', content: result }
        ]);
      } else {
        setError('Failed to fetch response from AI');
      }
    } catch (error) {
      setError('An error occurred while fetching the response.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setResponse(''); // Clear previous response
    await generateAiResponse(input);
    setInput(''); // Clear input field after submission
  };

  return (
    <div>
      <h1>LLaMA Chat</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          value={input}
          onChange={handleInputChange}
          rows="4"
          cols="50"
          placeholder="Type your input here..."
        />
        <br />
        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Submit'}
        </button>
      </form>
      {response && (
        <div>
          <h2>Response:</h2>
          <p>{response}</p>
        </div>
      )}
      {error && (
        <div>
          <h2>Error:</h2>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default LLaMAChat;
