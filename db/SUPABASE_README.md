# Supabase Database Integration for Taxaformer

Complete database solution for storing analysis results and generating visualization data.

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
cd db
pip install -r db_requirements.txt
```

### 2. Setup Supabase Tables
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `hdzzhfcgyvqsqoghjewz`
3. Navigate to **SQL Editor**
4. Copy and paste the entire `supabase_schema.sql` file
5. Click **Run** to create tables and functions

### 3. Verify Connection
```bash
python supabase_db.py
```

## 📊 Features

### 1. Store Analysis Results
```python
from db.supabase_db import TaxaformerDB

db = TaxaformerDB()

# Store analysis
job_id = db.store_analysis(
    filename="sample.fasta",
    metadata={
        "sampleId": "S101",
        "depth": 3500,
        "location": {"lat": 22.1, "lon": 71.9},
        "notes": "Deep sea run"
    },
    analysis_result={
        "metadata": {...},
        "sequences": [...],
        "taxonomy_summary": [...]
    }
)

print(f"Stored with job_id: {job_id}")
```

### 2. Taxonomic Composition Plot
```python
# Get composition data for pie/bar charts
composition = db.get_taxonomic_composition(
    job_id="your-job-id",
    rank="phylum"  # or domain, class, order, family, genus
)

# Returns:
# [
#   {"name": "Alveolata", "value": 45, "percentage": 30.0, "color": "#22D3EE"},
#   {"name": "Chlorophyta", "value": 32, "percentage": 21.3, "color": "#10B981"},
#   ...
# ]
```

### 3. Heatmap (Taxa Abundance Across Samples)
```python
# Compare multiple samples
heatmap_data = db.get_heatmap_data(
    job_ids=["job-1", "job-2", "job-3"],
    rank="class"
)

# Returns:
# {
#   "samples": ["sample1.fasta", "sample2.fasta", "sample3.fasta"],
#   "taxa": ["Dinoflagellata", "Chlorophyceae", "Copepoda"],
#   "matrix": [
#     [45, 32, 28],  # sample1 abundances
#     [38, 41, 22],  # sample2 abundances
#     [52, 29, 31]   # sample3 abundances
#   ]
# }
```

### 4. Krona/Sunburst (Hierarchical Taxonomy)
```python
# Get nested hierarchy for interactive sunburst
hierarchy = db.get_hierarchical_data(job_id="your-job-id")

# Returns:
# {
#   "name": "Life",
#   "children": [
#     {
#       "name": "Eukaryota",
#       "value": 150,
#       "children": [
#         {"name": "Alveolata", "value": 45, "children": [...]},
#         {"name": "Chlorophyta", "value": 32, "children": [...]}
#       ]
#     }
#   ]
# }
```

### 5. Beta Diversity (Between Samples)
```python
# Calculate similarity between samples
diversity = db.calculate_beta_diversity(
    job_ids=["job-1", "job-2", "job-3"]
)

# Returns:
# {
#   "samples": ["sample1", "sample2", "sample3"],
#   "dissimilarity_matrix": [[0, 0.32, 0.45], [0.32, 0, 0.28], [0.45, 0.28, 0]],
#   "similarity_matrix": [[1, 0.68, 0.55], [0.68, 1, 0.72], [0.55, 0.72, 1]],
#   "pcoa": [[0.5, 0.2], [-0.3, 0.4], [0.1, -0.6]],
#   "explained_variance": [0.65, 0.25]
# }
```

### 6. Sankey/Ribbon Plot
```python
# Get taxonomic flow diagram data
sankey = db.get_sankey_data(job_id="your-job-id")

# Returns:
# {
#   "nodes": [
#     {"id": 0, "name": "Start"},
#     {"id": 1, "name": "Eukaryota"},
#     {"id": 2, "name": "Bacteria"},
#     {"id": 3, "name": "Alveolata"},
#     ...
#   ],
#   "links": [
#     {"source": 0, "target": 1, "value": 120},  # Start → Eukaryota (120 sequences)
#     {"source": 0, "target": 2, "value": 30},   # Start → Bacteria (30 sequences)
#     {"source": 1, "target": 3, "value": 45},   # Eukaryota → Alveolata (45 sequences)
#     ...
#   ]
# }
```

## 🔌 Backend Integration

### Update `backend/main.py`

```python
from db.supabase_db import TaxaformerDB

db = TaxaformerDB()

@app.post("/analyze")
async def analyze_endpoint(
    file: UploadFile = File(...),
    metadata: Optional[str] = Form(None)
):
    # ... existing processing code ...
    
    # Parse metadata
    parsed_metadata = json.loads(metadata) if metadata else {}
    
    # Process file
    result_data = pipeline.process_file(temp_filepath, file.filename)
    
    # Store in Supabase
    job_id = db.store_analysis(
        filename=file.filename,
        metadata=parsed_metadata,
        analysis_result=result_data
    )
    
    return {
        "status": "success",
        "job_id": job_id,
        "data": result_data
    }
```

### Add Visualization Endpoints

```python
@app.get("/visualizations/composition/{job_id}")
async def get_composition(job_id: str, rank: str = "phylum"):
    return db.get_taxonomic_composition(job_id, rank)

@app.get("/visualizations/heatmap")
async def get_heatmap(job_ids: str, rank: str = "class"):
    ids = job_ids.split(",")
    return db.get_heatmap_data(ids, rank)

@app.get("/visualizations/hierarchy/{job_id}")
async def get_hierarchy(job_id: str):
    return db.get_hierarchical_data(job_id)

@app.get("/visualizations/diversity")
async def get_diversity(job_ids: str):
    ids = job_ids.split(",")
    return db.calculate_beta_diversity(ids)

@app.get("/visualizations/sankey/{job_id}")
async def get_sankey(job_id: str):
    return db.get_sankey_data(job_id)

@app.get("/jobs")
async def list_jobs(limit: int = 50):
    return db.get_all_jobs(limit)

@app.get("/jobs/{job_id}")
async def get_job(job_id: str):
    return db.get_job_by_id(job_id)
```

## 📈 Database Schema

### Tables Created:
1. **analysis_jobs** - Main storage for analysis results
   - `id` (UUID) - Primary key
   - `filename` (TEXT) - Original file name
   - `metadata` (JSONB) - User metadata (location, depth, etc.)
   - `analysis_result` (JSONB) - Complete analysis JSON
   - `status` (TEXT) - Job status
   - `created_at` (TIMESTAMP) - Creation timestamp

2. **samples** - Sample information (optional)
3. **sequences** - Individual sequence records (optional)

### Stored Functions:
- `get_rank_counts(job_id, rank)` - Get taxonomic counts at specific rank
- `calculate_diversity(job_id)` - Calculate Shannon & Simpson diversity indices

## 🧪 Testing

```python
# Test script
from db.supabase_db import TaxaformerDB

db = TaxaformerDB()

# Create test data
test_metadata = {
    "sampleId": "TEST_001",
    "depth": 3500,
    "location": {"lat": 22.1, "lon": 71.9}
}

test_result = {
    "metadata": {"sampleName": "test.fasta", "totalSequences": 100},
    "sequences": [
        {"taxonomy": "Eukaryota; Alveolata; Dinoflagellata", "accession": "SEQ1"},
        {"taxonomy": "Eukaryota; Chlorophyta; Chlorophyceae", "accession": "SEQ2"}
    ]
}

# Store
job_id = db.store_analysis("test.fasta", test_metadata, test_result)
print(f"✅ Stored: {job_id}")

# Retrieve visualizations
comp = db.get_taxonomic_composition(job_id, "phylum")
print(f"✅ Composition: {comp}")

hier = db.get_hierarchical_data(job_id)
print(f"✅ Hierarchy: {hier}")

sankey = db.get_sankey_data(job_id)
print(f"✅ Sankey: {sankey}")
```

## 🔍 Direct SQL Queries

You can also query directly in Supabase SQL Editor:

```sql
-- Get all recent jobs
SELECT id, filename, created_at, status
FROM analysis_jobs
ORDER BY created_at DESC
LIMIT 10;

-- Get taxonomic counts for a specific job
SELECT * FROM get_rank_counts('your-job-id-here', 'phylum');

-- Calculate diversity metrics
SELECT * FROM calculate_diversity('your-job-id-here');

-- Search by metadata
SELECT id, filename, metadata->>'sampleId' as sample_id
FROM analysis_jobs
WHERE metadata->>'depth' > '3000'
ORDER BY created_at DESC;
```

## 📝 Notes

- All data is stored in JSON format for flexibility
- Indexes are optimized for fast queries
- Functions handle dynamic calculation of visualization data
- Beta diversity uses Bray-Curtis dissimilarity
- PCoA uses PCA as approximation for dimensionality reduction

## 🆘 Troubleshooting

### Connection Issues
```python
# Test connection
from supabase import create_client

url = "https://hdzzhfcgyvqsqoghjewz.supabase.co"
key = "your-key-here"
client = create_client(url, key)

# Test query
result = client.table("analysis_jobs").select("count").execute()
print(f"Connection OK: {result}")
```

### SSL Errors
The script uses proper SSL handling. If you still get SSL errors:
```bash
pip install --upgrade certifi
```

## 🎯 Next Steps

1. **Run the schema script** in Supabase SQL Editor
2. **Install dependencies**: `pip install -r db_requirements.txt`
3. **Test connection**: `python supabase_db.py`
4. **Integrate with backend**: Add to `main.py`
5. **Update frontend**: Fetch visualization data from new endpoints

---

**Project**: Taxaformer  
**Database**: Supabase PostgreSQL  
**Version**: 1.0.0
