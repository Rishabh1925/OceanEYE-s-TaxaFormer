"""
Supabase Data Retrieval & Chart Formatting for Taxaformer
LOCAL SCRIPT - Fetches data from Supabase and formats for visualizations
NOTE: Kaggle backend handles all data storage - this only READS and FORMATS
"""

import json
from typing import Dict, List, Any, Optional, cast
from collections import defaultdict, Counter
from supabase import create_client, Client

# --------------------------------
# SUPABASE CONNECTION
# --------------------------------
url: str = "https://hdzzhfcgyvqsqoghjewz.supabase.co"
key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkenpoZmNneXZxc3FvZ2hqZXd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNjU0MTksImV4cCI6MjA4MDc0MTQxOX0.ki_x3n6hVmdhZPBqUYeYaRKgt1oYzciS68YwVlCnR6Y"

supabase: Client = create_client(url, key)


class TaxaformerDB:
    """
    LOCAL Data Retrieval & Chart Formatter
    Kaggle backend stores data → This script fetches & formats for charts
    """
    
    def __init__(self):
        self.client = supabase
        print("🔗 Connected to Supabase (Read-Only Mode)")
        print("📊 Ready to fetch & format chart data")
    
    # ================================
    # FETCH & FORMAT: TAXONOMIC COMPOSITION
    # ================================
    
    def get_taxonomic_composition(self, job_id: str, rank: str = "phylum") -> List[Dict]:
        """
        Calculate taxonomic composition at specified rank
        
        Args:
            job_id: Analysis job ID
            rank: Taxonomic rank (domain, phylum, class, order, family, genus, species)
            
        Returns:
            List of {name, value, percentage, color} for pie/bar charts
        """
        try:
            # Fetch analysis result
            response = self.client.table("analysis_jobs").select("analysis_result").eq("id", job_id).execute()
            
            if not response.data:
                raise ValueError(f"No analysis found for job_id: {job_id}")
            
            result = cast(Dict[str, Any], response.data[0])
            analysis = cast(Dict[str, Any], result.get("analysis_result", {}))
            sequences = cast(List[Dict[str, Any]], analysis.get("sequences", []))
            
            # Parse taxonomic strings and count by rank
            rank_counts = Counter()
            rank_index = {
                "domain": 0,
                "phylum": 1,
                "class": 2,
                "order": 3,
                "family": 4,
                "genus": 5,
                "species": 6
            }
            
            idx = rank_index.get(rank.lower(), 1)
            
            for seq in sequences:
                taxonomy = seq.get("taxonomy", "Unknown")
                parts = [p.strip() for p in taxonomy.split(";")]
                
                if idx < len(parts):
                    taxon = parts[idx]
                else:
                    taxon = "Unknown"
                
                rank_counts[taxon] += 1
            
            # Calculate percentages and prepare data
            total = sum(rank_counts.values())
            colors = self._generate_colors(len(rank_counts))
            
            composition = []
            for i, (taxon, count) in enumerate(rank_counts.most_common()):
                composition.append({
                    "name": taxon,
                    "value": count,
                    "percentage": round((count / total) * 100, 2),
                    "color": colors[i]
                })
            
            return composition
            
        except Exception as e:
            print(f"❌ Error calculating composition: {e}")
            raise
    
    # ================================
    # FETCH & FORMAT: HEATMAP (Multi-Sample)
    # ================================
    
    def get_heatmap_data(self, job_ids: List[str], rank: str = "class") -> Dict:
        """
        Generate heatmap data showing taxa abundance across multiple samples
        
        Args:
            job_ids: List of analysis job IDs (multiple samples)
            rank: Taxonomic rank to display
            
        Returns:
            {
                samples: [sample names],
                taxa: [taxon names],
                matrix: [[abundance values]]
            }
        """
        try:
            heatmap_data = {
                "samples": [],
                "taxa": set(),
                "matrix": []
            }
            
            sample_taxa_counts = {}
            
            for job_id in job_ids:
                response = self.client.table("analysis_jobs").select("filename, analysis_result").eq("id", job_id).execute()
                
                if not response.data:
                    continue
                
                job = cast(Dict[str, Any], response.data[0])
                sample_name = str(job.get("filename", "Unknown"))
                analysis_result = cast(Dict[str, Any], job.get("analysis_result", {}))
                sequences = cast(List[Dict[str, Any]], analysis_result.get("sequences", []))
                
                # Count taxa for this sample
                taxa_counts = Counter()
                rank_index = {"domain": 0, "phylum": 1, "class": 2, "order": 3, "family": 4, "genus": 5}
                idx = rank_index.get(rank.lower(), 2)
                
                for seq in sequences:
                    taxonomy = seq.get("taxonomy", "Unknown")
                    parts = [p.strip() for p in taxonomy.split(";")]
                    taxon = parts[idx] if idx < len(parts) else "Unknown"
                    taxa_counts[taxon] += 1
                
                sample_taxa_counts[sample_name] = taxa_counts
                heatmap_data["samples"].append(sample_name)
                heatmap_data["taxa"].update(taxa_counts.keys())
            
            # Convert to matrix
            heatmap_data["taxa"] = sorted(list(heatmap_data["taxa"]))
            matrix = []
            
            for sample in heatmap_data["samples"]:
                row = [sample_taxa_counts[sample].get(taxon, 0) for taxon in heatmap_data["taxa"]]
                matrix.append(row)
            
            heatmap_data["matrix"] = matrix
            
            return heatmap_data
            
        except Exception as e:
            print(f"❌ Error generating heatmap: {e}")
            raise
    
    # ================================
    # FETCH & FORMAT: KRONA/SUNBURST (Hierarchical)
    # ================================
    
    def get_hierarchical_data(self, job_id: str) -> Dict:
        """
        Generate hierarchical taxonomy data for Krona/Sunburst plots
        
        Returns:
            Nested structure: {name, value, children: [...]}
        """
        try:
            response = self.client.table("analysis_jobs").select("analysis_result").eq("id", job_id).execute()
            
            if not response.data:
                raise ValueError(f"No analysis found for job_id: {job_id}")
            
            result = cast(Dict[str, Any], response.data[0])
            analysis = cast(Dict[str, Any], result.get("analysis_result", {}))
            sequences = cast(List[Dict[str, Any]], analysis.get("sequences", []))
            
            # Build hierarchical tree
            tree = {"name": "Root", "children": {}}
            
            for seq in sequences:
                taxonomy = seq.get("taxonomy", "Unknown")
                parts = [p.strip() for p in taxonomy.split(";")]
                
                # Navigate/create tree structure
                current = tree["children"]
                for i, part in enumerate(parts):
                    if part not in current:
                        current[part] = {"name": part, "value": 0, "children": {}}
                    current[part]["value"] += 1
                    if i < len(parts) - 1:
                        current = current[part]["children"]
            
            # Convert to list format
            def dict_to_list(node):
                children = [dict_to_list(child) for child in node["children"].values()] if node["children"] else []
                return {
                    "name": node["name"],
                    "value": node["value"],
                    "children": children if children else None
                }
            
            hierarchy = {
                "name": "Life",
                "children": [dict_to_list(child) for child in tree["children"].values()]
            }
            
            return hierarchy
            
        except Exception as e:
            print(f"❌ Error generating hierarchy: {e}")
            raise
    
    # ================================
    # FETCH & FORMAT: BETA DIVERSITY (Sample Comparison)
    # ================================
    
    def calculate_beta_diversity(self, job_ids: List[str]) -> Dict:
        """
        Calculate beta diversity metrics between samples
        Uses Bray-Curtis dissimilarity
        
        Returns:
            {
                samples: [sample names],
                matrix: [[similarity scores]],
                pcoa: [[x, y coordinates for PCoA plot]]
            }
        """
        try:
            import numpy as np
            from scipy.spatial.distance import braycurtis
            from sklearn.decomposition import PCA
            
            sample_names = []
            abundance_vectors = []
            all_taxa = set()
            
            # Collect data from all samples
            for job_id in job_ids:
                response = self.client.table("analysis_jobs").select("filename, analysis_result").eq("id", job_id).execute()
                
                if not response.data:
                    continue
                
                job = cast(Dict[str, Any], response.data[0])
                sample_names.append(str(job.get("filename", "Unknown")))
                analysis_result = cast(Dict[str, Any], job.get("analysis_result", {}))
                sequences = cast(List[Dict[str, Any]], analysis_result.get("sequences", []))
                
                # Get species-level counts
                taxa_counts = Counter()
                for seq in sequences:
                    taxonomy = seq.get("taxonomy", "Unknown")
                    taxa_counts[taxonomy] += 1
                
                abundance_vectors.append(taxa_counts)
                all_taxa.update(taxa_counts.keys())
            
            # Create abundance matrix
            all_taxa = sorted(list(all_taxa))
            matrix_data = []
            
            for counts in abundance_vectors:
                row = [counts.get(taxon, 0) for taxon in all_taxa]
                matrix_data.append(row)
            
            matrix = np.array(matrix_data)
            
            # Calculate Bray-Curtis dissimilarity
            n_samples = len(sample_names)
            dissimilarity_matrix = np.zeros((n_samples, n_samples))
            
            for i in range(n_samples):
                for j in range(n_samples):
                    if i != j:
                        dissimilarity_matrix[i][j] = braycurtis(matrix[i], matrix[j])
            
            # PCoA (using PCA as approximation)
            pca = PCA(n_components=2)
            pcoa_coords = pca.fit_transform(matrix).tolist()
            
            return {
                "samples": sample_names,
                "dissimilarity_matrix": dissimilarity_matrix.tolist(),
                "similarity_matrix": (1 - dissimilarity_matrix).tolist(),
                "pcoa": pcoa_coords,
                "explained_variance": pca.explained_variance_ratio_.tolist()
            }
            
        except Exception as e:
            print(f"❌ Error calculating beta diversity: {e}")
            raise
    
    # ================================
    # FETCH & FORMAT: SANKEY/RIBBON (Flow Diagram)
    # ================================
    
    def get_sankey_data(self, job_id: str) -> Dict:
        """
        Generate Sankey diagram data showing taxonomic flow
        Start → Domain → Phylum → Class → Order
        
        Returns:
            {
                nodes: [{id, name}],
                links: [{source, target, value}]
            }
        """
        try:
            response = self.client.table("analysis_jobs").select("analysis_result").eq("id", job_id).execute()
            
            if not response.data:
                raise ValueError(f"No analysis found for job_id: {job_id}")
            
            result = cast(Dict[str, Any], response.data[0])
            analysis = cast(Dict[str, Any], result.get("analysis_result", {}))
            sequences = cast(List[Dict[str, Any]], analysis.get("sequences", []))
            
            # Track flows between ranks
            flows = defaultdict(int)
            nodes_set = set()
            
            nodes_set.add("Start")
            
            for seq in sequences:
                taxonomy = seq.get("taxonomy", "Unknown")
                parts = ["Start"] + [p.strip() for p in taxonomy.split(";")]
                
                # Limit to Domain → Phylum → Class → Order
                ranks = ["Start", "Domain", "Phylum", "Class", "Order"]
                max_levels = min(5, len(parts))
                
                for i in range(max_levels - 1):
                    source = parts[i] if i < len(parts) else f"Unknown {ranks[i]}"
                    target = parts[i + 1] if i + 1 < len(parts) else f"Unknown {ranks[i+1]}"
                    
                    nodes_set.add(source)
                    nodes_set.add(target)
                    flows[(source, target)] += 1
            
            # Create nodes and links
            nodes_list = sorted(list(nodes_set))
            node_indices = {name: idx for idx, name in enumerate(nodes_list)}
            
            nodes = [{"id": idx, "name": name} for idx, name in enumerate(nodes_list)]
            
            links = [
                {
                    "source": node_indices[source],
                    "target": node_indices[target],
                    "value": value
                }
                for (source, target), value in flows.items()
            ]
            
            return {
                "nodes": nodes,
                "links": links
            }
            
        except Exception as e:
            print(f"❌ Error generating Sankey data: {e}")
            raise
    
    # ================================
    # RETRIEVE JOB DATA
    # ================================
    
    def get_job_by_id(self, job_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch complete job data by ID
        (Kaggle backend already stored this)
        """
        try:
            response = self.client.table("analysis_jobs").select("*").eq("id", job_id).execute()
            if response.data:
                job = cast(Dict[str, Any], response.data[0])
                print(f"✅ Retrieved job: {job.get('filename', 'Unknown')}")
                return job
            print(f"❌ Job not found: {job_id}")
            return None
        except Exception as e:
            print(f"❌ Error fetching job: {e}")
            raise
    
    def get_all_jobs(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Retrieve all analysis jobs"""
        try:
            response = self.client.table("analysis_jobs").select("id, filename, created_at, metadata").limit(limit).order("created_at", desc=True).execute()
            jobs = cast(List[Dict[str, Any]], response.data if response.data else [])
            print(f"✅ Retrieved {len(jobs)} jobs")
            return jobs
        except Exception as e:
            print(f"❌ Error fetching jobs: {e}")
            raise
    
    # ================================
    # UTILITY METHODS
    # ================================
    
    def _generate_colors(self, count: int) -> List[str]:
        """Generate distinct colors for visualization"""
        colors = [
            '#22D3EE', '#10B981', '#F59E0B', '#EC4899', '#A78BFA',
            '#3B82F6', '#EF4444', '#8B5CF6', '#14B8A6', '#F97316',
            '#06B6D4', '#84CC16', '#F43F5E', '#6366F1', '#64748B'
        ]
        
        # Repeat colors if needed
        while len(colors) < count:
            colors.extend(colors)
        
        return colors[:count]


# ================================
# EXAMPLE USAGE - FETCH & FORMAT ONLY
# ================================

if __name__ == "__main__":
    print("\n" + "="*60)
    print("🌐 TAXAFORMER LOCAL DATA SERVICE")
    print("="*60)
    print("📊 Fetches data from Supabase (stored by Kaggle backend)")
    print("🎨 Formats data for chart visualizations")
    print("="*60 + "\n")
    
    db = TaxaformerDB()
    
    print("\n💡 Usage Examples:")
    print("─" * 60)
    print("\n# Get all jobs:")
    print("  jobs = db.get_all_jobs()")
    print("\n# Get specific job:")
    print("  job = db.get_job_by_id('your-job-id')")
    print("\n# Get chart data:")
    print("  composition = db.get_taxonomic_composition('job-id', rank='phylum')")
    print("  hierarchy = db.get_hierarchical_data('job-id')")
    print("  sankey = db.get_sankey_data('job-id')")
    print("  heatmap = db.get_heatmap_data(['job1', 'job2'], rank='class')")
    print("  diversity = db.calculate_beta_diversity(['job1', 'job2', 'job3'])")
    print("\n" + "="*60)
    print("✅ Ready to serve visualization data!")
    print("="*60 + "\n")
