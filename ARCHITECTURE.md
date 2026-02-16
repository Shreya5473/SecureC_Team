# Community Feature Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Community.jsx Component                    │    │
│  │                                                          │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │    │
│  │  │   Trending   │  │  Shared WAF  │  │    Risk      │ │    │
│  │  │   Threats    │  │    Rules     │  │   Trends     │ │    │
│  │  │   Section    │  │   Section    │  │   Chart      │ │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │    │
│  │                                                          │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │         Submit Threat Modal                       │  │    │
│  │  └──────────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              │ HTTP/REST API                     │
│                              ▼                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (FastAPI)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │         community_endpoints.py Router                   │    │
│  │                                                          │    │
│  │  GET  /community/threats                                │    │
│  │  POST /community/threats                                │    │
│  │  GET  /community/threats/{id}                           │    │
│  │  GET  /community/rules                                  │    │
│  │  POST /community/rules                                  │    │
│  │  POST /community/upvote                                 │    │
│  │  GET  /community/analytics/categories                   │    │
│  │  GET  /community/analytics/trends                       │    │
│  └────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              │ Supabase Client                   │
│                              ▼                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE (Supabase)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────┐  ┌──────────────────────────┐    │
│  │  community_threats       │  │  community_rules         │    │
│  ├──────────────────────────┤  ├──────────────────────────┤    │
│  │ • id (UUID)              │  │ • id (UUID)              │    │
│  │ • title                  │  │ • name                   │    │
│  │ • description            │  │ • description            │    │
│  │ • category               │  │ • category               │    │
│  │ • confidence             │  │ • rule_type              │    │
│  │ • example_payload        │  │ • rule_config (JSONB)    │    │
│  │ • mitigation             │  │ • upvotes                │    │
│  │ • upvotes                │  │ • created_at             │    │
│  │ • created_at             │  │ • updated_at             │    │
│  │ • updated_at             │  │                          │    │
│  └──────────────────────────┘  └──────────────────────────┘    │
│                                                                  │
│  Indexes:                                                        │
│  • idx_community_threats_upvotes (upvotes DESC)                 │
│  • idx_community_threats_category (category)                    │
│  • idx_community_rules_upvotes (upvotes DESC)                   │
│  • idx_community_rules_category (category)                      │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Viewing Threats
```
User → Community Page → GET /api/v1/community/threats
                      ↓
                Supabase Query (SELECT * ORDER BY upvotes DESC LIMIT 10)
                      ↓
                Return JSON → Display in Grid
```

### 2. Submitting Threat
```
User → Click "Submit Threat" → Modal Opens
     → Fill Form → Click Submit
                      ↓
                POST /api/v1/community/threats
                      ↓
                Validate Input (category, confidence, etc.)
                      ↓
                INSERT INTO community_threats
                      ↓
                Return Created Record → Update UI → Close Modal
```

### 3. Upvoting
```
User → Click Upvote Button
                      ↓
                Optimistic UI Update (increment count immediately)
                      ↓
                POST /api/v1/community/upvote
                      ↓
                UPDATE community_threats SET upvotes = upvotes + 1
                      ↓
                Return Updated Record → Confirm UI State
```

### 4. Analytics Chart
```
Page Load → GET /api/v1/community/analytics/categories
                      ↓
                SELECT category, COUNT(*) FROM community_threats GROUP BY category
                      ↓
                Return Category Counts → Render Bar Chart
```

## Component Structure

```
Community.jsx
├── State Management
│   ├── threats (array)
│   ├── rules (array)
│   ├── categoryData (array)
│   ├── expandedThreats (Set)
│   ├── upvotedItems (Set)
│   ├── loading (boolean)
│   ├── error (string)
│   ├── showModal (boolean)
│   └── formData (object)
│
├── Effects
│   └── useEffect → fetchCommunityData()
│
├── Functions
│   ├── fetchCommunityData()
│   ├── toggleExpand(threatId)
│   ├── handleUpvote(itemId, itemType)
│   ├── handleCopyRule(rule)
│   ├── handleFormChange(e)
│   └── handleSubmitThreat(e)
│
└── Render
    ├── Header
    ├── Trending Threats Section
    │   └── Threat Cards (map)
    │       ├── Title & Badge
    │       ├── Description
    │       ├── Confidence Score
    │       ├── Upvote Button
    │       ├── Expand Button
    │       └── Details (conditional)
    │
    ├── Shared WAF Rules Section
    │   └── Rule Cards (map)
    │       ├── Name & Description
    │       ├── Category & Type Badges
    │       ├── Copy Button
    │       └── Upvote Button
    │
    ├── Risk Trends Chart Section
    │   └── Bar Chart
    │       └── Bar Items (map)
    │           ├── Label
    │           └── Bar Fill (width based on count)
    │
    └── Submit Threat Modal (conditional)
        └── Form
            ├── Title Input
            ├── Description Textarea
            ├── Category Select
            ├── Confidence Input
            ├── Example Payload Textarea
            ├── Mitigation Textarea
            └── Submit/Cancel Buttons
```

## API Endpoint Details

### GET /community/threats
**Query Params:**
- `limit` (optional, default: 10)

**Response:**
```json
{
  "count": 10,
  "threats": [
    {
      "id": "uuid",
      "title": "SQL Injection via User Input",
      "description": "...",
      "category": "Injection",
      "confidence": 0.95,
      "example_payload": "...",
      "mitigation": "...",
      "upvotes": 42,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /community/threats
**Request Body:**
```json
{
  "title": "New Threat",
  "description": "Threat description",
  "category": "Injection",
  "confidence": 0.8,
  "example_payload": "malicious code",
  "mitigation": "how to fix"
}
```

**Response:**
```json
{
  "success": true,
  "threat": { /* created threat object */ }
}
```

### POST /community/upvote
**Request Body:**
```json
{
  "item_id": "uuid",
  "item_type": "threat"  // or "rule"
}
```

**Response:**
```json
{
  "success": true,
  "item": { /* updated item with new upvote count */ }
}
```

### GET /community/analytics/categories
**Response:**
```json
{
  "total_threats": 10,
  "categories": [
    { "category": "AI Security", "count": 3 },
    { "category": "Injection", "count": 2 },
    { "category": "XSS", "count": 1 }
  ]
}
```

## Styling Architecture

```
Community.css
├── Layout
│   ├── .community-page (container)
│   ├── .community-header (title section)
│   └── .community-section (each major section)
│
├── Components
│   ├── Threat Cards
│   │   ├── .threat-card
│   │   ├── .threat-title
│   │   ├── .category-badge
│   │   ├── .threat-description
│   │   └── .threat-details
│   │
│   ├── Rule Cards
│   │   ├── .rule-card
│   │   ├── .rule-name
│   │   ├── .rule-type-badge
│   │   └── .copy-btn
│   │
│   ├── Chart
│   │   ├── .chart-container
│   │   ├── .bar-chart
│   │   ├── .bar-item
│   │   └── .bar-fill
│   │
│   └── Modal
│       ├── .modal-overlay
│       ├── .modal-content
│       ├── .form-group
│       └── .form-input
│
└── States
    ├── Hover effects
    ├── Active states
    ├── Loading states
    └── Error states
```

## Security Flow

```
User Input
    ↓
Frontend Validation (React)
    ↓
API Request
    ↓
Backend Validation (Pydantic)
    ├── Category whitelist check
    ├── Confidence range check (0-1)
    ├── Required field validation
    └── Type validation
    ↓
Supabase Client (Parameterized Queries)
    ↓
Database (RLS if configured)
    ↓
Response
    ↓
Frontend Display (Auto-escaped by React)
```

## Performance Optimizations

1. **Database Indexes**
   - Upvotes DESC for trending queries
   - Category for filtering
   - Created_at for time-based queries

2. **Query Limits**
   - Default limit of 10 items
   - Prevents large data transfers

3. **Optimistic UI**
   - Immediate visual feedback
   - Better perceived performance

4. **Efficient Queries**
   - SELECT only needed columns
   - Use of indexes for sorting

## Error Handling

```
Try-Catch Blocks
    ├── Frontend
    │   ├── fetchCommunityData() → setError()
    │   ├── handleUpvote() → console.error()
    │   └── handleSubmitThreat() → alert()
    │
    └── Backend
        ├── HTTPException for validation errors
        ├── 404 for not found
        ├── 400 for bad requests
        └── 500 for server errors
```
