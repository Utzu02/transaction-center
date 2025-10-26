# Variabile de Mediu (Environment Variables) - Backend

## Unde să pui fișierul `.env`

Creează un fișier numit **`.env`** în directorul `/home/utzu/transaction-center/backend/`

```bash
cd /home/utzu/transaction-center/backend
touch .env
```

## Ce variabile trebuie configurate

Copiază conținutul de mai jos în fișierul `.env` și completează valorile:

```bash
# ==============================================================================
# SERVER CONFIGURATION
# ==============================================================================
FLASK_ENV=development
FLASK_DEBUG=True
PORT=5000
HOST=0.0.0.0

# ==============================================================================
# DATABASE CONFIGURATION (MongoDB)
# ==============================================================================
# Asigură-te că MongoDB rulează pe localhost:27017
MONGODB_URI=mongodb://localhost:27017/
MONGODB_DB_NAME=fraud_detection

# ==============================================================================
# API SECURITY
# ==============================================================================
# Cheia API pentru autentificare (schimbă în producție!)
API_KEY=development_api_key

# ==============================================================================
# CORS CONFIGURATION
# ==============================================================================
# URL-ul frontend-ului (pentru CORS)
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# ==============================================================================
# HACKATHON STREAM CONFIGURATION (OPTIONAL)
# ==============================================================================
# Doar dacă participi la hackathon ESTEEC Olympics
STREAM_URL=https://95.217.75.14:8443/stream
FLAG_URL=https://95.217.75.14:8443/api/flag
HACKATHON_API_KEY=a1f735db97adb19d1a0f675dabe9f7aab8148ff6731a903fb6d1aeddac56fc82

# ==============================================================================
# MODEL CONFIGURATION
# ==============================================================================
# Calea către modelul de fraud detection
MODEL_PATH=fraud_detector_model.pkl

# ==============================================================================
# LIVE STREAM PROCESSING (pentru hackathon_live.py)
# ==============================================================================
# URL-ul backend-ului pentru trimiterea tranzacțiilor procesate
BACKEND_URL=http://localhost:5000
```

## Explicații Detaliate

### 1. **FLASK_ENV** (obligatoriu)
- **Valoare**: `development` sau `production`
- **Descriere**: Mediul în care rulează aplicația
- **Recomandat**: `development` pentru dezvoltare locală

### 2. **FLASK_DEBUG** (obligatoriu)
- **Valoare**: `True` sau `False`
- **Descriere**: Activează modul debug pentru Flask
- **Recomandat**: `True` în development, `False` în production

### 3. **PORT** (obligatoriu)
- **Valoare**: număr (ex: `5000`)
- **Descriere**: Portul pe care rulează serverul backend
- **Default**: `5000`

### 4. **HOST** (obligatoriu)
- **Valoare**: adresă IP (ex: `0.0.0.0` sau `localhost`)
- **Descriere**: Host-ul pe care ascultă serverul
- **Recomandat**: `0.0.0.0` pentru a permite conexiuni externe

### 5. **MONGODB_URI** (OBLIGATORIU!)
- **Valoare**: connection string MongoDB
- **Descriere**: URL-ul pentru conectarea la baza de date MongoDB
- **Exemple**:
  - Local: `mongodb://localhost:27017/`
  - Atlas: `mongodb+srv://username:password@cluster.mongodb.net/`
- **Important**: Trebuie să ai MongoDB instalat și pornit!

### 6. **MONGODB_DB_NAME** (obligatoriu)
- **Valoare**: nume bază de date
- **Descriere**: Numele bazei de date MongoDB folosite
- **Default**: `fraud_detection`

### 7. **API_KEY** (recomandat)
- **Valoare**: string unic
- **Descriere**: Cheie pentru autentificare API
- **Recomandat**: Generează o cheie complexă în producție

### 8. **FRONTEND_URL** (obligatoriu pentru CORS)
- **Valoare**: URL frontend
- **Descriere**: URL-ul aplicației frontend pentru configurare CORS
- **Default**: `http://localhost:5173` (Vite default)

### 9. **CORS_ORIGINS** (obligatoriu pentru CORS)
- **Valoare**: listă de URL-uri separate prin virgulă
- **Descriere**: Lista de origini permise pentru CORS
- **Exemplu**: `http://localhost:5173,http://localhost:3000`

### 10. **STREAM_URL** (opțional - doar pentru hackathon)
- **Valoare**: URL stream SSE
- **Descriere**: URL-ul pentru stream-ul de tranzacții în timp real
- **Default**: `https://95.217.75.14:8443/stream`

### 11. **FLAG_URL** (opțional - doar pentru hackathon)
- **Valoare**: URL API
- **Descriere**: URL pentru a marca tranzacțiile ca fraud
- **Default**: `https://95.217.75.14:8443/api/flag`

### 12. **HACKATHON_API_KEY** (opțional - doar pentru hackathon)
- **Valoare**: API key de la organizatori
- **Descriere**: Cheia API pentru competiția hackathon
- **Important**: Solicită-o de la organizatorii ESTEEC Olympics

### 13. **MODEL_PATH** (recomandat)
- **Valoare**: cale către fișier
- **Descriere**: Calea către modelul antrenat de fraud detection
- **Default**: `fraud_detector_model.pkl`

### 14. **BACKEND_URL** (opțional - doar pentru live stream processing)
- **Valoare**: URL backend
- **Descriere**: URL-ul backend-ului pentru trimiterea tranzacțiilor procesate în timp real
- **Default**: `http://localhost:5000`
- **Important**: Folosit de `hackathon_live.py` pentru a trimite date către API-ul local

## Comenzi Utile

### Crearea fișierului .env
```bash
cd /home/utzu/transaction-center/backend
nano .env
# sau
vim .env
# sau
code .env  # dacă folosești VS Code
```

### Verificare că MongoDB rulează
```bash
# Start MongoDB (dacă e instalat local)
sudo systemctl start mongodb
# sau
sudo systemctl start mongod

# Verifică status
sudo systemctl status mongodb
```

### Instalare dependințe
```bash
cd /home/utzu/transaction-center/backend
pip install python-dotenv
# sau toate dependințele
pip install -r requirements.txt
```

## Exemplu fișier .env minimal (pentru a începe)

Dacă vrei să pornești rapid aplicația:

```bash
# Minimal .env pentru development
FLASK_ENV=development
FLASK_DEBUG=True
PORT=5000
HOST=0.0.0.0
MONGODB_URI=mongodb://root:password@localhost:27017/?authSource=admin
MONGODB_DB_NAME=fraud_detection
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173
API_KEY=dev_key_12345
MODEL_PATH=fraud_detector_model.pkl
BACKEND_URL=http://localhost:5000
```

## Verificare Configurație

După ce ai creat fișierul `.env`, poți verifica dacă totul este configurat corect:

```bash
cd /home/utzu/transaction-center/backend
python app.py
```

Ar trebui să vezi:
- ✅ Configuration validated
- ✅ Database connected
- 🚀 Server starting...

## Troubleshooting

### Eroare: "Missing required environment variables: MONGODB_URI"
→ Asigură-te că ai setat `MONGODB_URI` în `.env`

### Eroare: "Database connection failed"
→ Verifică că MongoDB rulează:
```bash
sudo systemctl status mongodb
```

### Eroare: "ModuleNotFoundError: No module named 'dotenv'"
→ Instalează python-dotenv:
```bash
pip install python-dotenv
```

## Securitate

⚠️ **IMPORTANT**: 
- Nu comite niciodată fișierul `.env` în Git!
- Fișierul `.env` ar trebui să fie deja în `.gitignore`
- În producție, folosește chei API complexe și unice!
- Nu împărtăși niciodată `HACKATHON_API_KEY` public!

