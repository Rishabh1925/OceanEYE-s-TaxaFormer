import { useState, useEffect } from 'react';
import { ArrowLeft, Download, Share2, TrendingUp, Database } from 'lucide-react';
import { ChartTaxaAbundance } from './charts/ChartTaxaAbundance';
import { ChartTaxonomyComposition } from './charts/ChartTaxonomyComposition';
import { ChartTaxonomySankey } from './charts/ChartTaxonomySankey';
import { ChartTaxonomyRainbow } from './charts/ChartTaxonomyRainbow';
import { ChartRadarDots } from './charts/ChartRadarDots';
import { ChartBarDefault } from './charts/ChartBarDefault';
import { ChartPieInteractive } from './charts/ChartPieInteractive';
import ChartAreaInteractive from './ui/chart-area-interactive.tsx';

interface CSVRow {
  Sequence_ID: string;
  Predicted_Taxonomy: string;
  Novelty_Score: number;
  Status: string;
  Nearest_Neighbor_Taxonomy: string;
  Nearest_Neighbor_Dist: number;
}

interface ResultsPageProps {
  isDarkMode: boolean;
  onNavigate: (page: string) => void;
}

export default function ResultsPage({ isDarkMode, onNavigate }: ResultsPageProps) {
  const [loading, setLoading] = useState(true);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load CSV data from the results folder
    const loadCSVData = async () => {
      try {
        const response = await fetch('/results/novel_candidates_list.csv');
        if (!response.ok) {
          throw new Error('Failed to load CSV file');
        }
        
        const text = await response.text();
        const rows = text.split('\n').slice(1); // Skip header
        
        const parsedData: CSVRow[] = rows
          .filter(row => row.trim())
          .map(row => {
            const cols = row.split(',');
            return {
              Sequence_ID: cols[0]?.trim() || '',
              Predicted_Taxonomy: cols[1]?.trim() || '',
              Novelty_Score: parseFloat(cols[2]) || 0,
              Status: cols[3]?.trim() || '',
              Nearest_Neighbor_Taxonomy: cols[4]?.trim() || '',
              Nearest_Neighbor_Dist: parseFloat(cols[5]) || 0,
            };
          });
        
        setCsvData(parsedData);
        setLoading(false);
      } catch (err) {
        console.error('Error loading CSV:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setLoading(false);
      }
    };

    loadCSVData();
  }, []);

  // Calculate summary stats
  const stats = {
    total: csvData.length,
    avgNoveltyScore: csvData.length > 0 
      ? (csvData.reduce((sum, row) => sum + row.Novelty_Score, 0) / csvData.length).toFixed(4)
      : '0.0000',
    uniqueTaxa: new Set(csvData.map(row => row.Predicted_Taxonomy)).size,
    potentiallyNovel: csvData.filter(row => row.Novelty_Score > 0.15).length,
  };

  // Prepare data for novelty score bar chart (using same ranges as histogram)
  const noveltyBins = [
    { min: 0.15, max: 0.17, label: '0.15-0.17' },
    { min: 0.17, max: 0.19, label: '0.17-0.19' },
    { min: 0.19, max: 0.21, label: '0.19-0.21' },
    { min: 0.21, max: 0.23, label: '0.21-0.23' },
    { min: 0.23, max: 0.25, label: '0.23-0.25' },
    { min: 0.25, max: 0.31, label: '0.25+' },
  ];

  const noveltyBarData: { category: string; value: number }[] = noveltyBins.map(bin => ({
    category: bin.label,
    value: csvData.filter(row => {
      const score = row.Novelty_Score;
      // Last bin is open-ended on the upper side
      if (bin.label === '0.25+') {
        return score >= bin.min;
      }
      return score >= bin.min && score < bin.max;
    }).length,
  }));

  // Prepare data for sequence status composition pie chart
  const statusCounts: Record<string, number> = csvData.reduce((acc, row) => {
    const key = row.Status && row.Status.trim().length > 0 ? row.Status.trim() : 'Unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieColors = ['#A855F7', '#22C55E', '#EAB308', '#3B82F6', '#F97316', '#EC4899'];
  const totalSequences = csvData.length || 1;

  const statusPieData: { name: string; value: number; color: string }[] = Object.entries(statusCounts).map(
    ([status, count], index) => ({
      name: `${status} (${((count / totalSequences) * 100).toFixed(1)}%)`,
      value: count,
      color: pieColors[index % pieColors.length],
    })
  );

  // Prepare data for taxonomy radar chart (top phyla by sequence count)
  const radarLevelCounts = new Map<string, number>();
  csvData.forEach(row => {
    const parts = row.Predicted_Taxonomy.split(';');
    const firstPart = parts[0]?.trim() || '';
    const secondPart = parts[1]?.trim() || '';

    // CSV format: "ACCESSION Eukaryota;Amorphea;Obazoa;..."
    // Use the second taxonomy token if available, otherwise fall back to the
    // domain name from the first part (after removing the accession prefix).
    let phylumPart = secondPart;
    if (!phylumPart && firstPart) {
      const tokens = firstPart.split(' ');
      phylumPart = tokens.slice(1).join(' ').trim() || firstPart;
    }

    if (phylumPart) {
      radarLevelCounts.set(phylumPart, (radarLevelCounts.get(phylumPart) || 0) + 1);
    }
  });

  const taxonomyRadarData: { category: string; value: number }[] = Array.from(radarLevelCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([name, value]) => ({
      category: name.length > 18 ? name.substring(0, 18) + '...' : name,
      value,
    }));

  const taxonomyRainbowData: { label: string; value: number }[] = Array.from(
    radarLevelCounts.entries()
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value]) => ({ label, value }));

  const handleExport = () => {
    const dataStr = JSON.stringify(csvData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `taxaformer-results-${Date.now()}.json`;
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className={`text-lg ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          Loading Results...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          Error Loading Data
        </h2>
        <p className={`mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          {error}
        </p>
        <button
          onClick={() => onNavigate('upload')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Upload
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <button
                onClick={() => onNavigate('output')}
                className={`flex items-center gap-2 mb-4 text-sm font-semibold transition-colors ${
                  isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <ArrowLeft className="w-4 h-4" /> Back to Output
              </button>
              <h1 className={`text-3xl md:text-4xl mb-2 font-bold ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                Taxonomic Analysis Results
              </h1>
              <p className={`text-base ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Comprehensive visualization of novel candidates and taxonomy distribution
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'Taxaformer Results',
                      text: `Analysis complete: ${stats.total} sequences analyzed`
                    });
                  }
                }}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  isDarkMode
                    ? 'bg-slate-700 hover:bg-slate-600 text-white'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-900'
                }`}
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button
                onClick={handleExport}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  isDarkMode
                    ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { 
              label: 'Total Sequences', 
              value: stats.total.toString(), 
              change: 'Analyzed', 
              icon: Database,
              color: isDarkMode ? 'text-cyan-400' : 'text-blue-500'
            },
            { 
              label: 'Unique Taxa', 
              value: stats.uniqueTaxa.toString(), 
              change: 'Identified', 
              icon: TrendingUp,
              color: isDarkMode ? 'text-emerald-400' : 'text-green-500'
            },
            { 
              label: 'Avg Novelty Score', 
              value: stats.avgNoveltyScore, 
              change: 'Score', 
              icon: TrendingUp,
              color: isDarkMode ? 'text-purple-400' : 'text-purple-500'
            },
            { 
              label: 'Potentially Novel', 
              value: stats.potentiallyNovel.toString(), 
              change: 'Candidates', 
              icon: Database,
              color: isDarkMode ? 'text-amber-400' : 'text-orange-500'
            }
          ].map((stat, idx) => (
            <div
              key={idx}
              className={`rounded-xl p-6 ${
                isDarkMode ? 'bg-slate-800/50' : 'bg-white/50'
              } backdrop-blur-md border ${
                isDarkMode ? 'border-slate-700' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
                <span className={`text-xs px-2 py-1 rounded ${
                  isDarkMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-100 text-blue-700'
                }`}>
                  {stat.change}
                </span>
              </div>
              <div className={`text-2xl font-bold mb-1 ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                {stat.value}
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="space-y-8">
          {/* Interactive Area Chart (demo data) */}
          <div>
            <ChartAreaInteractive />
          </div>

          {/* Sequence Status Composition Pie & Novelty Score Bar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChartPieInteractive
              data={statusPieData}
              title="Sequence Status Composition"
              description="Percentage of sequences by status (all identified sequences)"
              isDarkMode={isDarkMode}
            />
            <ChartBarDefault
              data={noveltyBarData}
              title="Novelty Score"
              description="Counts of sequences in each novelty score range"
              isDarkMode={isDarkMode}
            />
          </div>


          {/* Taxonomy Classification Flow (full width) */}
          <div>
            <ChartTaxonomySankey data={csvData} isDarkMode={isDarkMode} />
          </div>

          {/* Rainbow Taxonomy Plot & Radar Composition */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChartTaxonomyRainbow
              data={taxonomyRainbowData}
              title="Taxonomic Rainbow Plot"
              description="Radial composition of top phyla across all sequences"
              isDarkMode={isDarkMode}
            />
            <ChartRadarDots
              data={taxonomyRadarData}
              title="Taxonomic Composition Plots"
              description="Radar view of top phyla across all sequences"
              isDarkMode={isDarkMode}
            />
          </div>
        </div>

        {/* Data Table */}
        <div className={`mt-8 rounded-xl p-6 ${
          isDarkMode ? 'bg-slate-800/50' : 'bg-white/50'
        } backdrop-blur-md border ${
          isDarkMode ? 'border-slate-700' : 'border-slate-200'
        }`}>
          <h3 className={`text-lg mb-6 font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Sample Data (First 10 Sequences)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${
                  isDarkMode ? 'border-slate-700' : 'border-slate-200'
                }`}>
                  <th className={`text-left py-3 px-4 text-sm ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Sequence ID
                  </th>
                  <th className={`text-left py-3 px-4 text-sm ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Taxonomy (Last Level)
                  </th>
                  <th className={`text-left py-3 px-4 text-sm ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Novelty Score
                  </th>
                  <th className={`text-left py-3 px-4 text-sm ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {csvData.slice(0, 10).map((row, idx) => {
                  const taxParts = row.Predicted_Taxonomy.split(';');
                  const lastTax = taxParts[taxParts.length - 1]?.split(' ').slice(1).join(' ') || 'Unknown';
                  
                  return (
                    <tr
                      key={idx}
                      className={`border-b ${
                        isDarkMode ? 'border-slate-700 hover:bg-slate-700/30' : 'border-slate-200 hover:bg-slate-100/50'
                      }`}
                    >
                      <td className={`py-3 px-4 font-mono text-sm ${
                        isDarkMode ? 'text-cyan-400' : 'text-blue-600'
                      }`}>
                        {row.Sequence_ID}
                      </td>
                      <td className={`py-3 px-4 text-sm ${
                        isDarkMode ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        {lastTax.length > 50 ? lastTax.substring(0, 50) + '...' : lastTax}
                      </td>
                      <td className={`py-3 px-4 text-sm ${
                        isDarkMode ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          row.Novelty_Score > 0.15
                            ? isDarkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'
                            : isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                        }`}>
                          {row.Novelty_Score.toFixed(4)}
                        </span>
                      </td>
                      <td className={`py-3 px-4 text-sm ${
                        isDarkMode ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                          isDarkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {row.Status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
