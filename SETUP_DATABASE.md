# 🚀 Database Setup Guide - Start Here!

## What Does This Database Do?

The Supabase database:
- **Stores** all analysis results permanently (no more lost data!)
- **Generates** visualization data dynamically (charts, heatmaps, Sankey diagrams)
- **Tracks** all jobs with unique IDs
- **Enables** multi-sample comparisons

## 📋 Quick Start (5 Minutes)

### Step 1: Setup Supabase Tables (ONE TIME ONLY)

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Login and select your project
3. Click **SQL Editor** in left sidebar
4. Click **New Query**
5. Open `db/supabase_schema.sql` in VS Code
6. **Copy ALL the content** (Ctrl+A, Ctrl+C)
7. **Paste** into Supabase SQL Editor
8. Click **Run** (or press Ctrl+Enter)
9. ✅ You should see "Success" message

**This creates:**
- `analysis_jobs` table (stores all results)
- `samples` table (sample metadata)
- `sequences` table (individual sequences)
- Helper functions for calculations

### Step 2: Install Python Dependencies

```bash
# In your terminal (from project root)
pip install supabase numpy scipy scikit-learn
```

**Or use the requirements file:**
```bash
pip install -r db/db_requirements.txt
```

### Step 3: Test Database Connection

```bash
python db/supabase_db.py
```

✅ You should see: `"✅ Supabase DB module ready!"`

---

## 🔌 Integration with Backend

### Current Flow (WITHOUT Database):
```
User uploads file → Backend analyzes → Returns JSON → Frontend displays → Data lost!
```

### New Flow (WITH Database):
```
User uploads file → Backend analyzes → Saves to Supabase → Returns job_id + JSON → Frontend displays → Data saved forever!
```

---

## 🎯 What Files You Need to Modify

### 1. **Update `backend/main.py`** (Already in your project)

Add these lines at the top:
```python
from db.supabase_db import TaxaformerDB

# Initialize database
db = TaxaformerDB()
```

Update the `/analyze` endpoint:
```python
@app.post("/analyze")
async def analyze_endpoint(
    file: UploadFile = File(...),
    metadata: Optional[str] = Form(None)
):
    # ... existing validation code ...
    
    # Parse metadata
    parsed_metadata = json.loads(metadata) if metadata else {}
    
    # Process file (existing code)
    result_data = pipeline.process_file(temp_filepath, file.filename)
    
    # 🆕 NEW: Store in Supabase
    job_id = db.store_analysis(
        filename=file.filename,
        metadata=parsed_metadata,
        analysis_result=result_data
    )
    
    # Return response
    return {
        "status": "success",
        "job_id": job_id,  # 🆕 NEW: Include job_id
        "data": result_data
    }
```

### 2. **Add Visualization Endpoints** (Optional but Recommended)

Add these new endpoints to `backend/main.py`:

```python
@app.get("/visualizations/composition/{job_id}")
async def get_composition(job_id: str, rank: str = "phylum"):
    """Get taxonomic composition data for charts"""
    return db.get_taxonomic_composition(job_id, rank)

@app.get("/visualizations/hierarchy/{job_id}")
async def get_hierarchy(job_id: str):
    """Get hierarchical data for Krona/Sunburst plot"""
    return db.get_hierarchical_data(job_id)

@app.get("/visualizations/sankey/{job_id}")
async def get_sankey(job_id: str):
    """Get Sankey diagram data"""
    return db.get_sankey_data(job_id)

@app.get("/jobs")
async def list_jobs(limit: int = 50):
    """List all analysis jobs"""
    return db.get_all_jobs(limit)

@app.get("/jobs/{job_id}")
async def get_job(job_id: str):
    """Get specific job by ID"""
    return db.get_job_by_id(job_id)
```

---

## 🎬 Startup Sequence (What to Run Before Frontend)

### Option A: With Database (Recommended)

```bash
# Terminal 1: Start Backend with Database
cd backend
python main.py
```

**That's it!** The backend will:
1. Connect to Supabase automatically
2. Store all analysis results
3. Return job_id with each analysis

### Option B: Without Database (Testing Only)

Backend works without database too! It will just print warnings:
```
⚠️ MongoDB connection failed: ...
```

But analysis still works, just no data persistence.

---

## 📊 How Frontend Uses the Data

### Current Frontend Behavior:
```javascript
// UploadPage.tsx - After analysis
const result = await response.json();
// result = { status: "success", data: {...} }

localStorage.setItem('analysisResults', JSON.stringify(result.data));
```

### With Database:
```javascript
// UploadPage.tsx - After analysis
const result = await response.json();
// result = { status: "success", job_id: "uuid-here", data: {...} }

// Save to localStorage (existing)
localStorage.setItem('analysisResults', JSON.stringify(result.data));

// 🆕 NEW: Also save job_id for later retrieval
localStorage.setItem('currentJobId', result.job_id);
```

### Future Enhancement - Fetch from Database:
```javascript
// Instead of localStorage, fetch from database
const jobId = "uuid-from-previous-analysis";
const response = await fetch(`${API_URL}/jobs/${jobId}`);
const data = await response.json();
```

---

## 🧪 Testing the Database

### Test 1: Store Data
```python
from db.supabase_db import TaxaformerDB

db = TaxaformerDB()

test_result = {
    "metadata": {"sampleName": "test.fasta", "totalSequences": 100},
    "sequences": [
        {"taxonomy": "Eukaryota; Alveolata", "accession": "SEQ1"}
    ]
}

job_id = db.store_analysis("test.fasta", {"depth": 3500}, test_result)
print(f"Stored with job_id: {job_id}")
```

### Test 2: Retrieve Data
```python
# Get job back
job = db.get_job_by_id(job_id)
print(job)

# Get visualization
composition = db.get_taxonomic_composition(job_id, "phylum")
print(composition)
```

### Test 3: Check in Supabase Dashboard
1. Go to Supabase Dashboard
2. Click **Table Editor**
3. Select `analysis_jobs` table
4. You should see your test data!

---

## 🔍 Verifying Everything Works

### Checklist:
- [ ] Supabase SQL schema ran successfully
- [ ] `pip install` completed
- [ ] `python db/supabase_db.py` shows success message
- [ ] Backend starts without errors
- [ ] Frontend can upload and analyze
- [ ] Data appears in Supabase dashboard

---

## ⚡ TL;DR - Absolute Minimum Steps

```bash
# 1. Run SQL in Supabase Dashboard (copy db/supabase_schema.sql)
# 2. Install dependencies
pip install supabase numpy scipy scikit-learn

# 3. Start backend (it connects automatically)
cd backend
python main.py

# 4. Start frontend
npm run dev
```

**Done!** 🎉

---

## 🆘 Troubleshooting

### Error: "No module named 'supabase'"
```bash
pip install supabase
```

### Error: "Table 'analysis_jobs' does not exist"
→ You need to run the SQL schema in Supabase Dashboard (Step 1)

### Error: "Connection refused"
→ Check your Supabase URL and key in `db/supabase_db.py`

### Backend works but no data in Supabase
→ Check backend terminal for database errors
→ Verify SQL schema was run successfully

---

## 🎯 Summary

**Before Starting Frontend:**
1. ✅ Run SQL schema in Supabase (one time only)
2. ✅ Install Python packages: `pip install -r db/db_requirements.txt`
3. ✅ Start backend: `python backend/main.py`
4. ✅ Start frontend: `npm run dev`

**The database works automatically in the background!** No manual database operations needed during normal use.
