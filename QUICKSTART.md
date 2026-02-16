# 🚀 Quick Start Guide - Community Feature

## ⚡ 5-Minute Setup

### Step 1: Database Setup (2 minutes)
1. Open your **Supabase Dashboard**: https://app.supabase.com
2. Select your project
3. Go to **SQL Editor**
4. Copy the entire contents of `backend/community_schema.sql`
5. Paste and click **Run**
6. ✅ You should see "Success. No rows returned"

### Step 2: Start Backend (1 minute)
```bash
cd backend
python main.py
```
✅ You should see: "Uvicorn running on http://0.0.0.0:8000"

### Step 3: Start Frontend (1 minute)
```bash
cd frontend
npm run dev
```
✅ You should see: "Local: http://localhost:5173"

### Step 4: Test the Feature (1 minute)
1. Open browser: http://localhost:5173/community
2. You should see:
   - ✅ 10 sample threats in cards
   - ✅ 8 sample WAF rules
   - ✅ A bar chart showing threat categories

## 🎯 Quick Test Checklist

### View Data
- [ ] Navigate to `/community` in sidebar
- [ ] See trending threats displayed
- [ ] See WAF rules displayed
- [ ] See analytics chart at bottom

### Interact with Threats
- [ ] Click "More" button on a threat
- [ ] See example payload and mitigation
- [ ] Click upvote button
- [ ] See count increment

### Submit New Threat
- [ ] Click "Submit Threat" button
- [ ] Fill in the form:
  - Title: "Test Threat"
  - Description: "This is a test"
  - Category: Select any
- [ ] Click "Submit Threat"
- [ ] See your threat appear at the top

### Copy WAF Rule
- [ ] Find any WAF rule card
- [ ] Click "Copy to Workspace"
- [ ] See success message
- [ ] Paste somewhere to verify (Cmd+V / Ctrl+V)

## 🔍 Verify API Endpoints

Open http://localhost:8000/docs and test:

1. **GET /api/v1/community/threats**
   - Click "Try it out"
   - Click "Execute"
   - ✅ Should return 10 threats

2. **POST /api/v1/community/upvote**
   - Click "Try it out"
   - Enter:
     ```json
     {
       "item_id": "copy-any-threat-id-from-above",
       "item_type": "threat"
     }
     ```
   - Click "Execute"
   - ✅ Should return success

3. **GET /api/v1/community/analytics/categories**
   - Click "Try it out"
   - Click "Execute"
   - ✅ Should return category counts

## 🐛 Troubleshooting

### "Loading..." forever
**Problem:** Frontend can't reach backend
**Solution:**
```bash
# Check backend is running
curl http://localhost:8000/api/v1/

# Check CORS settings in backend/.env
# Ensure FRONTEND_URL is set correctly
```

### "Failed to fetch community data"
**Problem:** Database tables don't exist
**Solution:**
```bash
# Re-run the SQL schema in Supabase
# Check Supabase credentials in backend/.env:
SUPABASE_URL=your-url
SUPABASE_SERVICE_ROLE_KEY=your-key
```

### No sample data showing
**Problem:** SQL script didn't insert data
**Solution:**
```sql
-- Run this in Supabase SQL Editor to check:
SELECT COUNT(*) FROM community_threats;
SELECT COUNT(*) FROM community_rules;

-- If both return 0, re-run the schema file
```

### Upvote button not working
**Problem:** API request failing
**Solution:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Click upvote
4. Check for failed requests
5. Look at error message

## 📊 Sample Data Overview

After running the schema, you'll have:

**10 Threats:**
- SQL Injection (42 upvotes)
- AI Prompt Injection (45 upvotes)
- XSS Attacks (38 upvotes)
- JWT Token Manipulation (35 upvotes)
- And 6 more...

**8 WAF Rules:**
- Detect Prompt Injection (48 upvotes)
- Block SQL Keywords (40 upvotes)
- Sanitize HTML Tags (36 upvotes)
- Redact PII in Outputs (33 upvotes)
- And 4 more...

## 🎨 Visual Guide

### What You Should See:

```
┌─────────────────────────────────────────────────┐
│   Global AI Security Community                  │
│   Shared threat intelligence and AI defense     │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 🔥 Trending Threats          [Submit Threat]    │
├─────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│ │ SQL Inject  │ │ XSS Attack  │ │ JWT Manip   ││
│ │ [Injection] │ │ [XSS]       │ │ [Auth]      ││
│ │ Confidence  │ │ Confidence  │ │ Confidence  ││
│ │ 👍 42 [More]│ │ 👍 38 [More]│ │ 👍 35 [More]││
│ └─────────────┘ └─────────────┘ └─────────────┘│
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 🛡️ Shared AI WAF Rules                          │
├─────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│ │ Block SQL   │ │ Sanitize    │ │ Redact PII  ││
│ │ Keywords    │ │ HTML Tags   │ │ in Outputs  ││
│ │ [Copy] 👍 40│ │ [Copy] 👍 36│ │ [Copy] 👍 33││
│ └─────────────┘ └─────────────┘ └─────────────┘│
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 📊 Threat Distribution by Category              │
├─────────────────────────────────────────────────┤
│ AI Security    ████████████████████ 3           │
│ Injection      ████████████ 2                   │
│ XSS            ████████ 1                       │
│ Authentication ████████ 1                       │
└─────────────────────────────────────────────────┘
```

## 🎉 Success Indicators

You know it's working when:
- ✅ Page loads without errors
- ✅ Cards display with data
- ✅ Upvote buttons increment counts
- ✅ Modal opens when clicking "Submit Threat"
- ✅ Chart shows colored bars
- ✅ Copy button shows success message
- ✅ No console errors in DevTools

## 📚 Next Steps

Once everything is working:

1. **Read Full Documentation**
   - `COMMUNITY_FEATURE.md` - Complete feature guide
   - `ARCHITECTURE.md` - System architecture
   - `IMPLEMENTATION_SUMMARY.md` - What was built

2. **Customize**
   - Add more categories
   - Modify styling in `Community.css`
   - Add authentication
   - Implement rate limiting

3. **Deploy**
   - Set up production Supabase
   - Deploy backend to Railway/Render
   - Deploy frontend to Vercel/Netlify

## 💡 Pro Tips

1. **Use the API Docs**: http://localhost:8000/docs is your friend
2. **Check Browser Console**: F12 → Console for errors
3. **Monitor Network Tab**: See all API requests/responses
4. **Test with Sample Data**: Don't delete it until you're comfortable
5. **Read Error Messages**: They usually tell you exactly what's wrong

## 🆘 Still Having Issues?

1. Check all environment variables are set
2. Verify Supabase connection works
3. Ensure both frontend and backend are running
4. Clear browser cache and reload
5. Check the terminal for error messages

## ✨ You're Ready!

If you've completed the checklist above, you now have a fully functional Community feature for sharing threat intelligence and WAF rules. Enjoy! 🎊
