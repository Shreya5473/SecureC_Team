<p align="center">
  <img src="https://img.shields.io/badge/SecureC-AI%20Native%20WAF-00e676?style=for-the-badge&logo=shield&logoColor=white" alt="SecureC"/>
</p>

<h1 align="center">🛡️ SecureC</h1>
<h3 align="center">AI-Native Web Application Firewall for the Agentic Era</h3>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11+-3776ab?style=flat-square&logo=python&logoColor=white"/>
  <img src="https://img.shields.io/badge/FastAPI-0.104+-009688?style=flat-square&logo=fastapi&logoColor=white"/>
  <img src="https://img.shields.io/badge/React-18+-61dafb?style=flat-square&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/Vite-5+-646cff?style=flat-square&logo=vite&logoColor=white"/>
  <img src="https://img.shields.io/badge/OpenRouter-LLM-ff6b6b?style=flat-square"/>
</p>

---

# SecureC: AI-Powered WAF & SDLC Security
> **Sentinel Backend + SecureC Frontend** - A comprehensive security platform for modern applications.

## 🐳 Docker Deployment
For containerized deployment instructions, see [DOCKER_INSTRUCTIONS.md](DOCKER_INSTRUCTIONS.md).

## Project Overview

## 🚀 What is SecureC?

**SecureC** is an **AI-native Web Application Firewall (WAF)** designed to protect AI systems from prompt injection attacks, data exfiltration, PII leakage, and agentic misbehavior.

Unlike traditional WAFs that rely on static regex rules, SecureC uses:
- **🤖 Multi-Agent LLM Architecture** — 5 specialized security agents with scoped permissions
- **🧠 Local ML Analytics Engine** — Shannon entropy + keyword frequency analysis with zero external API dependencies
- **🛡️ Triple-Layer WAF Protection** — Input Guard, Output Guard, and Behavior Guard

---

## ✨ Key Features

### 🔐 AI WAF Guards

| Guard | Purpose | Protects Against |
|-------|---------|------------------|
| **Input Guard** | Analyzes user inputs before they reach AI agents | Prompt injection, role override, delimiter abuse, code injection |
| **Output Guard** | Sanitizes AI-generated outputs before delivery | PII leakage, API key exposure, harmful content |
| **Behavior Guard** | Monitors AI agent behavior for policy violations | Scope violations, unauthorized data access, resource abuse |

### 🧠 Multi-Agent Security Pipeline

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Threat Modeler │    │  Security Agent │    │ SOC Intelligence│
│  (The Architect)│───▶│ (Logic Auditor) │───▶│  (The Detective)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
              ┌─────────────────────────────────┐
              │       Remediation Agent         │
              │        (The Engineer)           │
              └─────────────────────────────────┘
                                │
                                ▼
              ┌─────────────────────────────────┐
              │          Risk Agent             │
              │       (The Strategist)          │
              │    Synthesizes GO / NO-GO       │
              └─────────────────────────────────┘
```

### 📊 Local ML Analytics (Technical Novelty)

Our ML engine runs **entirely locally** with zero external API dependencies:

```python
# Shannon Entropy Calculation
def _entropy(s: str) -> float:
    probs = [c / len(s) for c in Counter(s).values()]
    return -sum(p * math.log2(p) for p in probs if p > 0)
```

**Signals Computed:**
- **Complexity Anomaly** — Token density, section entropy, document size
- **Security Pattern Frequency** — Keyword over-representation detection
- **GitHub-specific Signals** — Security-critical file clustering

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │Dashboard │  │ AI WAF   │  │ Reports  │  │  ML Analytics    │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
└─────────────────────────────┬────────────────────────────────────┘
                              │ REST API
┌─────────────────────────────▼────────────────────────────────────┐
│                     BACKEND (FastAPI)                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    WAF Endpoints                            │ │
│  │  POST /waf/input  │  POST /waf/output  │  POST /waf/behavior│ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────────┐│
│  │   Agents     │  │  ML Engine   │  │     Integrations        ││
│  │  - Threat    │  │  - Entropy   │  │  - Supabase (Logging)   ││
│  │  - Security  │  │  - Keywords  │  │  - Slack (Alerts)       ││
│  │  - SOC       │  │  - Patterns  │  │  - OpenRouter (LLM)     ││
│  │  - Remediate │  │              │  │                         ││
│  │  - Risk      │  │              │  │                         ││
│  └──────────────┘  └──────────────┘  └─────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, Recharts, Lucide Icons |
| **Backend** | FastAPI, Python 3.11+, Pydantic |
| **LLM Orchestration** | OpenRouter API (GPT-4 Turbo) |
| **ML Analytics** | Local Python (Shannon entropy, regex, statistics) |
| **Database** | Supabase (PostgreSQL) |
| **Notifications** | Slack SDK (Block Kit) |
| **Styling** | Vanilla CSS, Dark Glassmorphism Theme |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- OpenRouter API Key

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Run server
uvicorn main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

### Environment Variables

```env
# Required
OPENROUTER_API_KEY=sk-or-v1-xxxxx

# Optional (for full features)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-key
SLACK_BOT_TOKEN=xoxb-xxxxx
SLACK_CHANNEL_ID=C0XXXXXXX
```

---

## 📡 API Endpoints

### WAF Endpoints

```http
POST /waf/input
Content-Type: application/json

{
  "input": "Ignore previous instructions...",
  "metadata": {"artifact_type": "text"}
}
```

```http
POST /waf/output
Content-Type: application/json

{
  "output": "Here's the API key: sk-proj-abc123...",
  "context": {"agent_name": "Assistant"}
}
```

```http
POST /waf/behavior
Content-Type: application/json

{
  "agent_action": {
    "agent_name": "Security Agent",
    "action_type": "data_access",
    "action_details": "Attempting to read production database"
  }
}
```

### Analysis Endpoints

```http
POST /analyze/artifact
Content-Type: application/json

{
  "artifact_type": "CODE",
  "source": "direct",
  "text_content": "def login(user, password): ..."
}
```

---

## 🔒 Security Features

### Defensive Programming
- **Safe Parsing** — All LLM responses validated with graceful fallbacks
- **Confidence Clamping** — Values bounded between 0-1
- **Type Checking** — Runtime validation of AI response structures
- **Pydantic Models** — Strict schema enforcement across the pipeline

### Agent Scope Boundaries
Each agent has strictly defined permissions:

| Agent | Can Do | Cannot Do |
|-------|--------|-----------|
| Threat Modeler | Analyze architecture, identify threats | Access production data, execute code |
| Security Agent | Review code logic, find vulnerabilities | Modify code, access credentials |
| SOC Intelligence | Analyze logs, correlate alerts | Modify logs, access user data |
| Remediation Agent | Suggest fixes, generate patches | Auto-apply fixes, access production |
| Risk Agent | Synthesize findings, calculate scores | Override agents, access raw data |

---

## 📊 ML Analytics Signals

| Signal Type | Description | Detection Method |
|-------------|-------------|------------------|
| `complexity_anomaly/token_density` | Unusually high token-to-character ratio | Statistical threshold |
| `complexity_anomaly/section_entropy` | High entropy indicating obfuscation | Shannon entropy |
| `security_pattern_frequency/over_representation` | Keyword appears unusually often | Z-score analysis |
| `security_pattern_frequency/high_risk_concentration` | Cluster of security-sensitive keywords | Keyword counting |
| `github_signal/security_critical_clustering` | Multiple auth/config files changed together | Path pattern matching |

---

## 🤝 Integrations

### Supabase
- Persistent vulnerability logging
- Audit trails for compliance
- Historical analysis queries

### Slack
- Real-time security alerts
- Block Kit formatted messages
- Agent disagreement escalation
- Direct SOC team notifications

---

## 📁 Project Structure

```
SecureC_Team/
├── backend/
│   ├── app/
│   │   ├── agents/           # AI security agents
│   │   │   ├── input_guard_agent.py
│   │   │   ├── output_guard_agent.py
│   │   │   ├── behavior_guard_agent.py
│   │   │   ├── threat_agent.py
│   │   │   ├── security_agent.py
│   │   │   ├── soc_intelligence_agent.py
│   │   │   ├── remediation_agent.py
│   │   │   └── risk_agent.py
│   │   ├── services/         # Core services
│   │   │   ├── ai_service.py
│   │   │   ├── ml_analytics.py
│   │   │   ├── slack_service.py
│   │   │   └── supabase_logger.py
│   │   ├── api/              # API routes
│   │   └── models/           # Pydantic schemas
│   ├── main.py
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── pages/            # React pages
    │   ├── components/       # Reusable components
    │   ├── context/          # React Context (state)
    │   └── services/         # API client
    └── package.json
```

---

## 🏆 Technical Novelty

1. **Local ML Analytics** — Shannon entropy and keyword frequency analysis without external API dependencies
2. **Multi-Agent Orchestration** — Specialized security agents with scoped permissions
3. **Triple-Layer WAF** — Input, Output, and Behavior monitoring for AI systems
4. **Defensive AI Parsing** — Graceful handling of malformed LLM responses
5. **Immutable Signal Architecture** — ML signals are read-only, ensuring data integrity

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

<p align="center">
  <b>Built for the AI-native security landscape 🚀</b>
  <br/>
  <sub>SecureC — Rethinking application security for systems where the attack surface is a conversation.</sub>
</p>
