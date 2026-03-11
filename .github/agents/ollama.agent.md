---
description: "Gunakan agent Ollama untuk development lokal dengan model gemma2:1b - cepat, offline, dan gratis untuk coding tasks, debugging, dan refactoring"
name: "Ollama Assistant"
user-invocable: true
---

# Ollama Local AI Assistant

Agent khusus untuk development lokal menggunakan Ollama dengan model **gemma2:1b**.

## Setup Awal

### 1. Pastikan Ollama Running
Ollama harus berjalan di background. Cek di terminal:

```powershell
ollama serve
```

Output yang diharapkan:
```
Serving on 127.0.0.1:11434
```

### 2. Pull Model (jika belum)
```powershell
ollama pull gemma2:1b
```

### 3. Test Connection
```powershell
curl http://127.0.0.1:11434/api/generate -d '{
  "model": "gemma2:1b",
  "prompt": "Hello",
  "stream": false
}'
```

## Cara Menggunakan Agent Ini

### Via VS Code Chat
1. Buka VS Code
2. Tekan `Ctrl+Shift+A` (Chat)
3. Pilih **Ollama Assistant** dari agent picker
4. Ketik perintah Anda

### Contoh Penggunaan
```
"Jelaskan file userModel.js dan apa function-functionnya"
"Saya mau bikin API endpoint baru untuk user profile, gimana caranya?"
"Review code ini dan kasih suggestion improvement"
```

## Kemampuan
✅ Membaca & analyze file dalam project  
✅ Explain code & architecture  
✅ Generate code snippets  
✅ Debug issues  
✅ Refactor code  
✅ Code review & suggestions  

## Limitasi
⚠️ Lebih lambat dari Claude (CPU-bound)  
⚠️ Model kecil (1B parameters) - untuk simple tasks  
⚠️ Hanya bekerja offline/lokal  

## API Endpoint
Ollama API tersedia di: `http://127.0.0.1:11434`

### Test via PowerShell
```powershell
# Test generate
Invoke-WebRequest `
  -Uri "http://127.0.0.1:11434/api/generate" `
  -Method Post `
  -Body (@{model="gemma2:1b"; prompt="Apa itu Node.js?"; stream=$false} | ConvertTo-Json) `
  -ContentType "application/json"

# List available models
Invoke-WebRequest -Uri "http://127.0.0.1:11434/api/tags"
```

## Konfigurasi Tambahan

### Pull Model Lain (jika mau upgrade)
```powershell
# Lebih cepat tapi tetap lightweight
ollama pull gemma2:7b

# Atau yang lebih powerful
ollama pull mistral
ollama pull neural-chat
```

### Ganti Model di Terminal
```powershell
# Gunakan model berbeda
curl http://localhost:11434/api/generate -d '{
  "model": "mistral",
  "prompt": "Your prompt here",
  "stream": false
}'
```

## Troubleshooting

### Error: Connection refused
**Masalah:** Ollama tidak running
```powershell
# Cek status
tasklist | findstr ollama

# Jika tidak ada, start Ollama
ollama serve
```

### Out of memory
**Solusi:** Gunakan model yang lebih kecil
```powershell
ollama pull gemma:2b
```

### Slow response
**Normal untuk gemma2:1b** - tunggu beberapa detik. Jika terlalu lambat, upgrade ke model yang lebih besar dengan `ollama pull mistral`

## Resources
- Ollama Docs: https://ollama.ai
- Available Models: https://ollama.ai/library
- API Reference: https://github.com/ollama/ollama/blob/main/docs/api.md

---

**Last Updated:** March 2026  
**Model:** gemma2:1b  
**Status:** Ready untuk development lokal
