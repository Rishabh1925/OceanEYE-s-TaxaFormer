-- ================================
-- Supabase Database Schema for Taxaformer
-- ================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================
-- 1. ANALYSIS JOBS TABLE
-- ================================
CREATE TABLE IF NOT EXISTS analysis_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    analysis_result JSONB NOT NULL,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for faster queries
CREATE INDEX idx_jobs_created_at ON analysis_jobs(created_at DESC);
CREATE INDEX idx_jobs_status ON analysis_jobs(status);
CREATE INDEX idx_jobs_filename ON analysis_jobs(filename);

-- Add GIN index for JSONB queries
CREATE INDEX idx_jobs_metadata ON analysis_jobs USING GIN(metadata);
CREATE INDEX idx_jobs_analysis_result ON analysis_jobs USING GIN(analysis_result);

-- ================================
-- 2. SAMPLES TABLE (for multi-sample comparisons)
-- ================================
CREATE TABLE IF NOT EXISTS samples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sample_id TEXT UNIQUE NOT NULL,
    location JSONB,
    depth NUMERIC,
    datetime TIMESTAMP WITH TIME ZONE,
    environmental_data JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_samples_sample_id ON samples(sample_id);
CREATE INDEX idx_samples_depth ON samples(depth);

-- ================================
-- 3. SEQUENCES TABLE (for detailed sequence storage)
-- ================================
CREATE TABLE IF NOT EXISTS sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES analysis_jobs(id) ON DELETE CASCADE,
    accession TEXT NOT NULL,
    taxonomy TEXT NOT NULL,
    length INTEGER,
    confidence NUMERIC,
    overlap INTEGER,
    cluster TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sequences_job_id ON sequences(job_id);
CREATE INDEX idx_sequences_taxonomy ON sequences(taxonomy);
CREATE INDEX idx_sequences_cluster ON sequences(cluster);

-- ================================
-- 4. TAXONOMIC COMPOSITION VIEW
-- ================================
CREATE OR REPLACE VIEW taxonomic_composition AS
SELECT 
    j.id as job_id,
    j.filename,
    split_part(s.taxonomy, ';', 1) as domain,
    split_part(s.taxonomy, ';', 2) as phylum,
    split_part(s.taxonomy, ';', 3) as class,
    split_part(s.taxonomy, ';', 4) as "order",
    split_part(s.taxonomy, ';', 5) as family,
    split_part(s.taxonomy, ';', 6) as genus,
    COUNT(*) as count
FROM sequences s
JOIN analysis_jobs j ON s.job_id = j.id
GROUP BY j.id, j.filename, s.taxonomy;

-- ================================
-- 5. STORED FUNCTIONS
-- ================================

-- Function to get taxonomic counts at specific rank
CREATE OR REPLACE FUNCTION get_rank_counts(
    p_job_id UUID,
    p_rank TEXT DEFAULT 'phylum'
)
RETURNS TABLE(taxon TEXT, count BIGINT) AS $$
DECLARE
    rank_position INTEGER;
BEGIN
    rank_position := CASE p_rank
        WHEN 'domain' THEN 1
        WHEN 'phylum' THEN 2
        WHEN 'class' THEN 3
        WHEN 'order' THEN 4
        WHEN 'family' THEN 5
        WHEN 'genus' THEN 6
        WHEN 'species' THEN 7
        ELSE 2
    END;
    
    RETURN QUERY
    SELECT 
        COALESCE(split_part(taxonomy, ';', rank_position), 'Unknown') as taxon,
        COUNT(*) as count
    FROM sequences
    WHERE job_id = p_job_id
    GROUP BY taxon
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate sample diversity metrics
CREATE OR REPLACE FUNCTION calculate_diversity(p_job_id UUID)
RETURNS TABLE(
    total_sequences BIGINT,
    unique_taxa BIGINT,
    shannon_diversity NUMERIC,
    simpson_diversity NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH taxa_counts AS (
        SELECT 
            taxonomy,
            COUNT(*) as count,
            COUNT(*) * 1.0 / SUM(COUNT(*)) OVER () as proportion
        FROM sequences
        WHERE job_id = p_job_id
        GROUP BY taxonomy
    )
    SELECT 
        SUM(count)::BIGINT as total_sequences,
        COUNT(DISTINCT taxonomy)::BIGINT as unique_taxa,
        -SUM(proportion * LN(proportion)) as shannon_diversity,
        1 - SUM(proportion * proportion) as simpson_diversity
    FROM taxa_counts;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- 6. ROW LEVEL SECURITY (Optional)
-- ================================

-- Enable RLS on tables
-- ALTER TABLE analysis_jobs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE samples ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sequences ENABLE ROW LEVEL SECURITY;

-- Create policies (uncomment if using authentication)
-- CREATE POLICY "Allow public read access" ON analysis_jobs FOR SELECT USING (true);
-- CREATE POLICY "Allow public insert" ON analysis_jobs FOR INSERT WITH CHECK (true);

-- ================================
-- 7. TRIGGERS
-- ================================

-- Update timestamp on row update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_analysis_jobs_updated_at
    BEFORE UPDATE ON analysis_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- NOTES FOR SETUP
-- ================================

-- To run this schema in Supabase:
-- 1. Go to https://supabase.com/dashboard
-- 2. Select your project
-- 3. Navigate to SQL Editor
-- 4. Paste and run this entire script
-- 5. Tables and functions will be created automatically

-- Example queries:
-- SELECT * FROM analysis_jobs ORDER BY created_at DESC LIMIT 10;
-- SELECT * FROM get_rank_counts('job-uuid-here', 'phylum');
-- SELECT * FROM calculate_diversity('job-uuid-here');
