from flask import Flask, request, Response, stream_with_context
from langchain_community.llms import Ollama
from flask_cors import CORS
from langchain.memory import ConversationBufferMemory
import json
import time

app = Flask(__name__)
CORS(app)

# Set up the LLM with LangChain (Ollama in this case)
llm = Ollama(model="llama3.1:latest")

# Initialize conversation memory
memory = ConversationBufferMemory(ai_prefix="AI Assistant")

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message')
    if not user_message:
        return Response('No message provided', status=400)

    # Add the user's message to the memory
    memory.chat_memory.add_user_message(user_message)

    # Construct the full context for the LLM
    context = f"The following is a friendly conversation between a human and an AI. The AI provides concise, specific responses. If the AI does not know the answer, it truthfully says it does not know.\n\nCurrent conversation:\n{memory.buffer}\nHuman: {user_message}\nAI Assistant:"
    
    print(context)

    def generate():
        full_response = ""
        for chunk in llm.stream(context):
            full_response += chunk
            print(chunk)
            yield json.dumps({"chunk": chunk}) + "\n"
            # Small delay to ensure chunks are sent individually

        # After streaming is complete, save the AI's response to memory
        memory.chat_memory.add_ai_message(full_response)
        yield json.dumps({"chunk": "[DONE]"}) + "\n"

    return Response(stream_with_context(generate()), content_type='application/x-ndjson')

if __name__ == '__main__':
    app.run(debug=True)