# Community Feature - Setup Instructions

## Overview
The Community feature enables users to share threat intelligence and AI WAF rules across the SecureC platform. It includes:
- **Trending Threats**: Community-submitted security threats with upvoting
- **Shared WAF Rules**: Reusable security rules for AI WAF
- **Analytics Dashboard**: Visual representation of threat distribution by category

## Database Setup

### 1. Run the Community Schema
Execute the SQL schema in your Supabase project:

```bash
# The schema file is located at:
backend/community_schema.sql
```

**Steps:**
1. Open your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `backend/community_schema.sql`
4. Execute the SQL to create tables and insert sample data

### 2. Tables Created
- `community_threats`: Stores threat intelligence submissions
- `community_rules`: Stores shared WAF rules

### 3. Sample Data
The schema includes 10 sample threats and 8 sample WAF rules to get you started.

## Backend Setup

### New API Endpoints
The following endpoints are now available at `/api/v1/community/*`:

#### Threats
- `GET /community/threats?limit=10` - Get trending threats
- `POST /community/threats` - Submit new threat
- `GET /community/threats/{threat_id}` - Get threat details

#### WAF Rules
- `GET /community/rules?limit=10&rule_type=input_guard` - Get WAF rules
- `POST /community/rules` - Submit new WAF rule

#### Upvoting
- `POST /community/upvote` - Upvote a threat or rule

#### Analytics
- `GET /community/analytics/categories` - Get threat distribution by category
- `GET /community/analytics/trends` - Get community statistics

### Files Added
- `backend/app/api/community_endpoints.py` - Community API endpoints
- `backend/community_schema.sql` - Database schema

### Files Modified
- `backend/main.py` - Added community router

## Frontend Setup

### New Page
Access the Community page at: `/community`

### Files Added
- `frontend/src/pages/Community.jsx` - Main community page component
- `frontend/src/pages/Community.css` - Styling for community page

### Files Modified
- `frontend/src/App.jsx` - Added Community route
- `frontend/src/components/layout/Sidebar.jsx` - Added Community navigation

## Features

### 1. Trending Threats Section
- View top 10 threats ordered by upvotes
- Expand to see example payloads and mitigation strategies
- Upvote threats to increase visibility
- Submit new threats via modal form

### 2. Shared WAF Rules Section
- View top 10 WAF rules ordered by upvotes
- Copy rule configurations to clipboard
- Upvote useful rules
- Filter by rule type (input_guard, output_guard, behavior_guard)

### 3. Threat Distribution Chart
- Visual bar chart showing threat counts by category
- Real-time updates based on community submissions

### 4. Submit Threat Modal
- Form fields:
  - Title (required)
  - Description (required)
  - Category (dropdown)
  - Confidence Score (0-1)
  - Example Payload (optional)
  - Mitigation (optional)

## Usage

### Viewing Community Data
1. Navigate to the Community page from the sidebar
2. Browse trending threats and WAF rules
3. Expand threats to see detailed information
4. View the analytics chart at the bottom

### Submitting a Threat
1. Click "Submit Threat" button
2. Fill in the form fields
3. Click "Submit Threat" to add to the community
4. Your threat will appear in the list

### Upvoting
1. Click the upvote button on any threat or rule
2. The count increments immediately (optimistic UI)
3. You can only upvote each item once per session

### Copying WAF Rules
1. Click "Copy to Workspace" on any rule card
2. The rule configuration is copied to your clipboard
3. Paste into your WAF configuration files

## API Request Examples

### Submit a Threat
```bash
curl -X POST http://localhost:8000/api/v1/community/threats \
  -H "Content-Type: application/json" \
  -d '{
    "title": "API Rate Limiting Bypass",
    "description": "Attackers can bypass rate limiting using distributed requests",
    "category": "Authentication",
    "confidence": 0.85,
    "example_payload": "Multiple requests from different IPs",
    "mitigation": "Implement distributed rate limiting with Redis"
  }'
```

### Upvote a Threat
```bash
curl -X POST http://localhost:8000/api/v1/community/upvote \
  -H "Content-Type: application/json" \
  -d '{
    "item_id": "uuid-here",
    "item_type": "threat"
  }'
```

### Get Analytics
```bash
curl http://localhost:8000/api/v1/community/analytics/categories
```

## Customization

### Adding New Categories
Edit the `categories` array in:
- `frontend/src/pages/Community.jsx` (line ~155)
- `backend/app/api/community_endpoints.py` (line ~72 and ~163)

### Changing Limits
Modify the `limit` parameter in API calls:
```javascript
fetch(getApiUrl('/community/threats?limit=20'))
```

### Styling
All styles are in `frontend/src/pages/Community.css`. The design follows the existing SecureC dark theme with:
- Cyan (#22d3ee) and blue (#3b82f6) accents
- Dark backgrounds with subtle borders
- Smooth hover animations
- Professional security aesthetic

## Security Considerations

1. **Input Validation**: All submissions are validated on the backend
2. **Rate Limiting**: Consider adding rate limits to prevent spam
3. **Content Moderation**: Implement moderation for user submissions
4. **SQL Injection**: All queries use parameterized statements
5. **XSS Prevention**: User inputs are sanitized in the frontend

## Future Enhancements

- User authentication and profiles
- Comments and discussions on threats
- Rule effectiveness ratings
- Export functionality for threats and rules
- Advanced filtering and search
- Email notifications for high-severity threats
- Integration with external threat intelligence feeds

## Troubleshooting

### Community page shows "Loading..."
- Check that backend is running on port 8000
- Verify Supabase connection in `.env`
- Check browser console for API errors

### "Failed to fetch community data" error
- Ensure community tables exist in Supabase
- Verify API endpoints are registered in `main.py`
- Check CORS settings in backend

### Upvotes not working
- Check network tab for failed POST requests
- Verify Supabase credentials
- Ensure table permissions are set correctly

### No sample data showing
- Re-run the `community_schema.sql` script
- Check Supabase table editor to verify data exists
- Clear browser cache and reload

## Support

For issues or questions about the Community feature, please check:
1. Backend logs: `backend/main.py` console output
2. Frontend console: Browser developer tools
3. Supabase logs: Supabase dashboard → Logs
4. API documentation: http://localhost:8000/docs
