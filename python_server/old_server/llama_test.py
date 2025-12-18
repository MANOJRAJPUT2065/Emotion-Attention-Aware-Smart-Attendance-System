import ollama

resp = ollama.chat(model='llama3.1:latest',messages=[
    {
        'role':'user',
        'content':'doing good  !'
    },
    
])

print(resp['message']['content'])

