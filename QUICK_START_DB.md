# 🚀 QUICK START - DATABASE SETUP

## Architecture
```
┌─────────────────────┐
│ KAGGLE BACKEND      │ ← Analyzes files & stores to Supabase
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ SUPABASE DATABASE   │ ← Cloud storage (job_id + results)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ LOCAL API (Port 3001)│ ← Fetches & formats for charts
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ FRONTEND            │ ← Displays visualizations
└─────────────────────┘
```

## Before Starting Frontend (First Time Only)

### 1️⃣ Setup Supabase Tables (5 minutes, ONE TIME)
```
1. Open: https://supabase.com/dashboard
2. Click: SQL Editor → New Query
3. Copy: All content from db/supabase_schema.sql
4. Paste & Run in Supabase
5. ✅ Done! Tables created
```

### 2️⃣ Install Dependencies (1 minute)
```bash
pip install supabase numpy scipy scikit-learn
```

### 3️⃣ Test Database (30 seconds)
```bash
python test_database.py
```
✅ Should see: "🎉 ALL TESTS PASSED!"

---

## Starting Your App (Every Time)

### 1. Kaggle Backend (Analysis + Storage)
Run your Kaggle notebook with `main.py`
- Analyzes FASTA files
- Stores results in Supabase with job_id

### 2. Local Visualization API (Data Formatter)
```bash
python local_api.py
```
**Runs on:** `http://localhost:3001`
**Purpose:** Fetches from Supabase, formats for charts

### 3. Frontend
```bash
npm run dev
```
## What Each File Does

| File | Purpose | Where |
|------|---------|-------|
| `db/supabase_db.py` | Fetches & formats data from Supabase | LOCAL |
| `db/supabase_schema.sql` | Creates tables in Supabase (run once) | SUPABASE |
| `local_api.py` | **LOCAL API SERVER** - Serves visualization endpoints | LOCAL (Port 3001) |
| `backend/main.py` | Analysis backend (stores to Supabase) | KAGGLE |
| `test_database.py` | Tests if database connection works | LOCAL |ores & retrieves data) |
| `db/supabase_schema.sql` | Creates tables in Supabase (run once) |
| `backend/main_with_db.py` | Backend with database integration |
| `backend/main.py` | Original backend (no database) |
| `test_database.py` | Tests if database works |

---

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│ USER UPLOADS FILE                                        │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ BACKEND (main_with_db.py)                                │
│  1. Analyzes FASTA file                                  │
│  2. Generates results JSON                               │
│  3. Saves to Supabase ← NEW!                            │
│  4. Returns job_id + data                                │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ FRONTEND                                                 │
│  - Displays results                                      │
│  - Saves to localStorage (existing)                      │
│  - Can retrieve from database later ← NEW!              │
└─────────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ SUPABASE DATABASE                                        │
│  ✅ Stores all results permanently                      │
│  ✅ Enables multi-sample comparisons                    │
│  ✅ Provides visualization data                         │
└─────────────────────────────────────────────────────────┘
```

---

## New API Endpoints (With Database)

### Analysis (existing, now returns job_id)
```
POST /analyze
→ Returns: { status: "success", job_id: "uuid", data: {...} }
```

### Visualizations (new!)
```
GET /visualizations/composition/{job_id}?rank=phylum
GET /visualizations/hierarchy/{job_id}
GET /visualizations/sankey/{job_id}
GET /visualizations/heatmap?job_ids=id1,id2,id3
GET /visualizations/diversity?job_ids=id1,id2,id3
```

### Job Management (new!)
```
GET /jobs          → List all jobs
GET /jobs/{job_id} → Get specific job
```

---

## Frontend Changes Needed (Optional)

Current code works as-is! But you can enhance it:

```javascript
// UploadPage.tsx - After analysis completes
const result = await response.json();

// EXISTING (keep this)
localStorage.setItem('analysisResults', JSON.stringify(result.data));

// NEW (optional - save job_id for later)
if (result.job_id) {
  localStorage.setItem('currentJobId', result.job_id);
  console.log('💾 Saved job_id:', result.job_id);
}
```

---

## Troubleshooting

### "No module named 'supabase'"
```bash
pip install supabase
```

### "Table does not exist"
→ Run `db/supabase_schema.sql` in Supabase Dashboard

### Backend starts but warnings appear
```
⚠️ Database not available: ...
```
→ This is OK! Backend works without database
→ Just no data persistence

### Test script fails
```bash
# Check installation
pip list | grep supabase

# Reinstall
pip install --upgrade supabase
```

---

## Summary

✅ **One-time setup:** Run SQL in Supabase, install packages  
✅ **Every time:** Just start backend, then frontend  
✅ **Database is optional:** Backend works without it  
✅ **No frontend changes required:** Works with existing code  

**Ready? → Run `python test_database.py`**
