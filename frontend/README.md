# 🛡️ FraudDetect - Real-Time POS Fraud Detection SIEM

AI/ML SIEM for POS fraud alerting system - Built for ESTEEC Olympics Hackathon

![React](https://img.shields.io/badge/React-19.1.1-blue)
![Vite](https://img.shields.io/badge/Vite-7.1.7-purple)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4.17-cyan)
![WebSocket](https://img.shields.io/badge/WebSocket-Ready-green)
![License](https://img.shields.io/badge/License-MIT-green)

## 🎯 Hackathon Features

### Real-Time Processing
- ⚡ **WebSocket Integration**: Live data streaming from POS systems
- ⏱️ **30-Second Response**: Automatic fraud detection and reporting within 30s
- 🔄 **Auto-Reconnect**: Resilient connection with automatic retry

### Business Intelligence Dashboards
- 📊 **Top 5 Fraud Patterns**: Real-time analysis of most common fraud types
- ⏰ **2-Hour Alert Timeline**: Visual representation of fraud alerts
- 👥 **Age Segment Analysis**: Identify most vulnerable demographics
- 📈 **Live Statistics**: Processed, detected, and reported transactions

### Core Features
- 🎨 **Modern UI/UX**: Professional design with Tailwind CSS
- 🚨 **Instant Alerts**: Real-time fraud detection notifications
- 📱 **Fully Responsive**: Works on all devices
- ⚡ **High Performance**: Optimized build with Vite
- 🎭 **Smooth Animations**: Professional transitions

## 🏆 Hackathon Setup

### 1. Environment Configuration

Copy `.env.example` to `.env` and add your API key:

```bash
cp .env.example .env
```

Edit `.env` and add your API key:
```env
VITE_STREAM_URL=https://95.217.75.14:8443/stream
VITE_FLAG_URL=https://95.217.75.14:8443/api/flag
VITE_API_KEY=your_api_key_here
VITE_DEFAULT_CONNECTION_TYPE=sse
```

> 📖 For detailed information about environment variables, see [ENVIRONMENT.md](./ENVIRONMENT.md)

### 2. SSE Connection (Hackathon)
The system connects to the hackathon stream using Server-Sent Events:

```javascript
// Automatically configured from .env
sseService.connect(
  import.meta.env.VITE_STREAM_URL,
  import.meta.env.VITE_API_KEY
);
```

### 3. Live Fraud Detection
The system automatically:
1. **Receives** transactions via SSE stream
2. **Analyzes** using fraud detection logic
3. **Flags** fraud back to server within 30 seconds

### 4. Flag Transactions
```javascript
// Flag a transaction as fraud
import sseService from './services/sse';

sseService.flagTransaction(
  null, // Uses VITE_FLAG_URL from .env
  null, // Uses VITE_API_KEY from .env
  'transaction_number',
  1 // 1 = fraud, 0 = legitimate
);
```

### Backend Integration Points
```javascript
// Flag endpoint
POST https://95.217.75.14:8443/api/flag
{
  "transaction_id": "uuid",
  "timestamp": 1234567890,
  "confidence": 0.95
}
```

## 🚀 Quick Start

### Instalare

```bash
# Instalează dependențele
npm install
```

### Development

```bash
# Pornește development server (http://localhost:5173)
npm run dev
```

### Production

```bash
# Build pentru producție
npm run build

# Preview build
npm run preview
```

## 📁 Structura Proiectului

```
src/
├── components/
│   ├── common/          # Button, Card, Badge
│   ├── landing/         # Hero, Features, Stats, CTA
│   └── dashboard/       # Header, Sidebar, TransactionList, etc.
├── pages/
│   ├── Landing.jsx      # Landing page
│   └── Dashboard.jsx    # Dashboard principal
├── App.jsx              # Router și routing
└── index.css            # Tailwind și stiluri globale
```

👉 Vezi [STRUCTURE.md](./STRUCTURE.md) pentru detalii complete despre arhitectură.

## 🎨 Design System

### Culori

- **Primary** (Blue): Acțiuni principale, links
- **Danger** (Red): Alerte, erori, acțiuni periculoase
- **Success** (Green): Confirmări, succes
- **Warning** (Yellow): Atenționări

### Componente Refolosibile

- `Button` - 5 variante (primary, secondary, danger, outline, ghost)
- `Card` - Container cu shadow și hover
- `Badge` - Status indicators

## 📊 Pages

### Landing Page (`/`)
- **Hero**: Single CTA button and key statistics (99.9% Accuracy, <100ms Response, 24/7 Monitoring)
- **Features**: 6 key features with icons
- **Stats**: 4 impressive metrics
- **Footer**: Company info and links

### Dashboard Pages
- **Dashboard** (`/dashboard`): Overview with 3 analytics cards, charts, and alerts
- **Transactions** (`/transactions`): Complete transaction list with Accepted/Blocked filters
- **Alerts** (`/alerts`): Fraud alerts and suspicious activities
- **Analytics** (`/analytics`): Comprehensive charts and insights

## 🔌 Backend Integration

### WebSocket Stream Format
Expected message format from your streaming server:

```json
{
  "transaction_id": "uuid",
  "amt": 92.40,
  "merchant": "Merchant Name",
  "category": "gas_transport",
  "cc_num": "4616481889874315776",
  "first": "John",
  "last": "Doe",
  "city": "New York",
  "state": "NY",
  "lat": "40.7128",
  "long": "-74.0060",
  "is_fraud": 0,
  "trans_date": "2025-08-26",
  "trans_time": "00:00:00"
}
```

### Integration Steps

1. Creează servicii API în `src/services/`
2. Înlocuiește mock data în componente
3. Adaugă error handling și loading states

### Endpoints Sugerate

```
GET  /api/transactions       # Lista tranzacții
GET  /api/alerts             # Alerte active
GET  /api/analytics/overview # Metrici dashboard
POST /api/transactions/:id/block # Blochează tranzacție
```

## 🛠️ Tech Stack

- **React** 19.1.1 - UI Library
- **Vite** 7.1.7 - Build Tool
- **React Router** 7.1.0 - Routing
- **Tailwind CSS** 3.4.17 - Styling
- **Lucide React** 0.469.0 - Icons
- **Recharts** 2.15.0 - Charts

## 📱 Responsive Breakpoints

- **Mobile**: < 768px (single column)
- **Tablet**: 768px - 1024px (2 columns)
- **Desktop**: > 1024px (3-4 columns)

## 🎯 Comenzi Disponibile

```bash
npm run dev      # Development server
npm run build    # Build pentru producție
npm run preview  # Preview build
npm run lint     # ESLint
```

## 📝 Development Guidelines

1. **Componente Noi**: Adaugă în `src/components/[category]/`
2. **Pagini Noi**: Adaugă în `src/pages/` și update `App.jsx`
3. **Stiluri**: Folosește Tailwind classes
4. **Icons**: Folosește Lucide React
5. **Mock Data**: Păstrează în componente până la integrare API

## 🐛 Troubleshooting

### Dependențele nu se instalează
```bash
rm -rf node_modules package-lock.json
npm install
```

### Port-ul 5173 este ocupat
```bash
npm run dev -- --port 3000
```

### Build fails
```bash
npm run build -- --debug
```

## 🔐 Security

- ✅ Input validation pe toate formularele
- ✅ XSS protection prin React
- ✅ HTTPS în producție
- ⏳ Autentificare și autorizare (coming soon)
- ⏳ Rate limiting (coming soon)

## 🚦 Roadmap

- [x] Landing page complet
- [x] Dashboard cu analytics
- [x] Sistem de alerte
- [x] Transaction list
- [ ] Autentificare utilizatori
- [ ] Integrare API backend
- [ ] Filtre și search avansate
- [ ] Export rapoarte (PDF/Excel)
- [ ] Notificări real-time
- [ ] Dark mode
- [ ] Multi-language

## 📄 License

MIT License - vezi [LICENSE](../LICENSE) pentru detalii.

## 🤝 Contributing

1. Fork repository
2. Creează branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📧 Contact

Pentru întrebări sau sugestii, contactează echipa de dezvoltare.

---

**Made with ❤️ using React + Vite + Tailwind**
