import { useState, useEffect } from 'react';
import { Upload, FileText, Database, ChevronRight, Loader2, Cpu, Zap, Brain, CheckCircle2, MapPin, Calendar, Thermometer, Droplets, Info } from 'lucide-react';
import { fetchSampleDataFromSupabase } from '@/utils/supabaseClient';
import { fetchSampleFilesFromSupabase } from '@/utils/supabaseClient';
// import { fetchSampleFilesFromSupabase, fetchSampleDataFromSupabase } from '../utils/supabaseClient';

// 🛑 STEP 1: PASTE YOUR NGROK URL HERE
// Leave empty to use mock data for testing
// Set to "" to test UI without backend, or paste your active ngrok URL
const API_URL: string = "https://unexcited-nondepreciatively-justice.ngrok-free.dev";

interface UploadPageProps {
  isDarkMode: boolean;
  onNavigate: (page: string) => void;
}

interface SampleMetadata {
  sampleId: string;
  location: {
    latitude: string;
    longitude: string;
    depth: string;
    site: string;
  };
  datetime: {
    date: string;
    time: string;
  };
  environmental: {
    temperature: string;
    salinity: string;
    pH: string;
    dissolvedOxygen: string;
  };
  notes: string;
}

interface SampleFile {
  job_id: string;
  filename: string;
  total_sequences: number;
  created_at: string;
  file_size_mb: number;
  avg_confidence: number;
  novel_species_count: number;
}

export default function UploadPage({ isDarkMode, onNavigate }: UploadPageProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showMetadata, setShowMetadata] = useState(false);
  const [metadata, setMetadata] = useState<SampleMetadata>({
    sampleId: '',
    location: {
      latitude: '',
      longitude: '',
      depth: '',
      site: ''
    },
    datetime: {
      date: '',
      time: ''
    },
    environmental: {
      temperature: '',
      salinity: '',
      pH: '',
      dissolvedOxygen: ''
    },
    notes: ''
  });

  // Sample files state
  const [sampleFiles, setSampleFiles] = useState<SampleFile[]>([]);
  const [loadingSamples, setLoadingSamples] = useState(false);
  const [sortBy, setSortBy] = useState<'latest' | 'heavy' | 'sequences' | 'confidence'>('latest');

  // Loading stages with messages
  const loadingStages = [
    { icon: Upload, text: "Uploading sequences to GPU cluster...", color: "cyan" },
    { icon: Cpu, text: "Initializing Nucleotide Transformer model...", color: "blue" },
    { icon: Brain, text: "Processing DNA sequences on GPU...", color: "purple" },
    { icon: Zap, text: "Running taxonomic classification...", color: "pink" },
    { icon: Database, text: "Matching against marine databases...", color: "indigo" },
    { icon: CheckCircle2, text: "Finalizing results...", color: "green" }
  ];

  // Simulate loading progress
  useEffect(() => {
    if (isLoading) {
      setLoadingStage(0);
      setProgress(0);

      const stageInterval = setInterval(() => {
        setLoadingStage(prev => {
          if (prev < loadingStages.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 3000);

      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 95) {
            return prev + Math.random() * 3;
          }
          return prev;
        });
      }, 200);

      return () => {
        clearInterval(stageInterval);
        clearInterval(progressInterval);
      };
    } else {
      setProgress(0);
      setLoadingStage(0);
    }
  }, [isLoading]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      setUploadedFiles(prev => [...prev, ...files]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const files = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...files]);
    }
  };

  const handleMetadataChange = (section: keyof SampleMetadata, field: string, value: string) => {
    setMetadata(prev => {
      if (section === 'sampleId' || section === 'notes') {
        return { ...prev, [section]: value };
      }
      return {
        ...prev,
        [section]: {
          ...(prev[section] as any),
          [field]: value
        }
      };
    });
  };

  // --- 📊 SAMPLE FILES FUNCTIONS ---
  const fetchSampleFiles = async () => {
    setLoadingSamples(true);
    
    try {
      // Try to fetch real data from Supabase first
      const realSamples = await fetchSampleFilesFromSupabase();
      console.log("✅ Loaded real sample files from database:", realSamples.length);
      setSampleFiles(realSamples);
    } catch (error) {
      console.warn("⚠️ Failed to fetch from database, using mock data:", error);
      // Fallback to mock data
      const mockSamples = [
        {
          job_id: "sample_001",
          filename: "monterey_bay_sample.fasta",
          total_sequences: 245,
          created_at: "2024-12-10T14:30:00Z",
          file_size_mb: 12.5,
          avg_confidence: 0.89,
          novel_species_count: 3
        },
        {
          job_id: "sample_002", 
          filename: "pacific_deep_water.fasta",
          total_sequences: 189,
          created_at: "2024-12-09T09:15:00Z",
          file_size_mb: 8.7,
          avg_confidence: 0.92,
          novel_species_count: 1
        },
        {
          job_id: "sample_003",
          filename: "coral_reef_biodiversity.fasta", 
          total_sequences: 312,
          created_at: "2024-12-08T16:45:00Z",
          file_size_mb: 18.3,
          avg_confidence: 0.85,
          novel_species_count: 5
        }
      ];
      setSampleFiles(mockSamples);
    } finally {
      setLoadingSamples(false);
    }
  };

  const handleSampleSelect = async (jobId: string) => {
    try {
      console.log("🔍 Loading sample data for job:", jobId);
      
      // Try to fetch real data from Supabase first
      const realData = await fetchSampleDataFromSupabase(jobId);
      console.log("✅ Loaded real sample data from database");
      
      localStorage.setItem('analysisResults', JSON.stringify(realData));
      onNavigate('output');
    } catch (error) {
      console.warn("⚠️ Failed to fetch real data, using mock data:", error);
      
      // Fallback to mock data
      const mockSampleData = {
        metadata: {
          sampleName: `Sample ${jobId}`,
          totalSequences: 245,
          processingTime: "3.2s",
          avgConfidence: 89
        },
        taxonomy_summary: [
          { name: 'Alveolata', value: 65, color: '#22D3EE' },
          { name: 'Chlorophyta', value: 42, color: '#10B981' },
          { name: 'Fungi', value: 28, color: '#A78BFA' },
          { name: 'Metazoa', value: 38, color: '#F59E0B' },
          { name: 'Rhodophyta', value: 25, color: '#EC4899' },
          { name: 'Unknown', value: 47, color: '#64748B' }
        ],
        sequences: [
          { accession: 'SEQ_001', taxonomy: 'Alveolata; Dinoflagellata; Gymnodiniales', length: 1842, confidence: 0.94, overlap: 87, cluster: 'C1' },
          { accession: 'SEQ_002', taxonomy: 'Chlorophyta; Chlorophyceae; Chlamydomonadales', length: 1654, confidence: 0.89, overlap: 92, cluster: 'C2' },
          { accession: 'SEQ_003', taxonomy: 'Metazoa; Arthropoda; Copepoda', length: 2103, confidence: 0.96, overlap: 94, cluster: 'C3' }
        ],
        cluster_data: [
          { x: 12.5, y: 8.3, z: 65, cluster: 'Alveolata', color: '#22D3EE' },
          { x: -8.2, y: 15.1, z: 42, cluster: 'Chlorophyta', color: '#10B981' },
          { x: 3.4, y: -12.7, z: 38, cluster: 'Metazoa', color: '#F59E0B' }
        ]
      };

      localStorage.setItem('analysisResults', JSON.stringify(mockSampleData));
      onNavigate('output');
    }
  };

  const getSortedSamples = () => {
    const sorted = [...sampleFiles];
    switch (sortBy) {
      case 'latest':
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'heavy':
        return sorted.sort((a, b) => b.file_size_mb - a.file_size_mb);
      case 'sequences':
        return sorted.sort((a, b) => b.total_sequences - a.total_sequences);
      case 'confidence':
        return sorted.sort((a, b) => b.avg_confidence - a.avg_confidence);
      default:
        return sorted;
    }
  };

  // Load sample files on component mount
  useEffect(() => {
    fetchSampleFiles();
  }, []);

  const handleAnalyze = async () => {
    if (uploadedFiles.length === 0) {
      alert('Please upload at least one file first');
      return;
    }

    setIsLoading(true);

    try {
      // If no API URL is set, use mock data for testing
      if (!API_URL || (typeof API_URL === 'string' && API_URL.trim() === "")) {
        console.log("⚠️ No API URL configured - Using mock data");
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Mock data
        const mockData = {
          metadata: {
            sampleName: uploadedFiles[0].name,
            totalSequences: 150,
            processingTime: "2.8s",
            avgConfidence: 89
          },
          taxonomy_summary: [
            { name: 'Alveolata', value: 45, color: '#22D3EE' },
            { name: 'Chlorophyta', value: 32, color: '#10B981' },
            { name: 'Fungi', value: 15, color: '#A78BFA' },
            { name: 'Metazoa', value: 28, color: '#F59E0B' },
            { name: 'Rhodophyta', value: 18, color: '#EC4899' },
            { name: 'Unknown', value: 12, color: '#64748B' }
          ],
          sequences: [
            { accession: 'SEQ_001', taxonomy: 'Alveolata; Dinoflagellata; Gymnodiniales', length: 1842, confidence: 0.94, overlap: 87, cluster: 'C1' },
            { accession: 'SEQ_002', taxonomy: 'Chlorophyta; Chlorophyceae; Chlamydomonadales', length: 1654, confidence: 0.89, overlap: 92, cluster: 'C2' },
            { accession: 'SEQ_003', taxonomy: 'Metazoa; Arthropoda; Copepoda', length: 2103, confidence: 0.96, overlap: 94, cluster: 'C3' }
          ],
          cluster_data: [
            { x: 12.5, y: 8.3, z: 45, cluster: 'Alveolata', color: '#22D3EE' },
            { x: -8.2, y: 15.1, z: 32, cluster: 'Chlorophyta', color: '#10B981' },
            { x: 3.4, y: -12.7, z: 28, cluster: 'Metazoa', color: '#F59E0B' }
          ]
        };

        // Complete the progress bar
        setProgress(100);
        setLoadingStage(loadingStages.length - 1);

        // Wait a moment to show completion
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Save mock data
        localStorage.setItem('analysisResults', JSON.stringify(mockData));
        console.log("💾 Saved mock data to localStorage");

        // Navigate to results
        onNavigate('output');
        return;
      }

      // If API URL is configured, try to use backend
      const formData = new FormData();
      formData.append("file", uploadedFiles[0]);
      
      console.log("🚀 Sending to Backend...");
      console.log("📁 File:", uploadedFiles[0].name);
      console.log("🔗 API URL:", API_URL);

      const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        body: formData,
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      });

      console.log("📡 Response Status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Server Error Response:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log("📦 Received Result:", result);

      if (result.status === "success") {
        console.log("✅ Analysis Complete!");
        
        // Complete the progress bar
        setProgress(100);
        setLoadingStage(loadingStages.length - 1);

        // Save data to localStorage
        localStorage.setItem('analysisResults', JSON.stringify(result.data));
        console.log("💾 Saved to localStorage");

        // Navigate to results
        onNavigate('output');
      } else {
        console.error("❌ Server returned error:", result.message);
        throw new Error("Server Error: " + (result.message || "Unknown error"));
      }
    } catch (error) {
      console.error("❌ Connection Failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      setIsLoading(false);
      setProgress(0);
      setLoadingStage(0);
      
      alert(`❌ Backend Connection Failed\\n\\nError: ${errorMessage}\\n\\n🔍 Troubleshooting:\\n\\n1. Check if Kaggle backend is running\\n2. Verify ngrok URL is correct:\\n   Current: ${API_URL}\\n\\n3. Check Kaggle notebook output for errors`);
      
      return;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <h1 className={`text-2xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-7xl font-bold leading-none tracking-tight ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              <span className="block">Transform</span>
              <span className={`block ${
                isDarkMode 
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400' 
                  : 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600'
              }`}>
                eDNA Sequences
              </span>
              <span className="block">Into Insights</span>
            </h1>

            <p className={`text-lg sm:text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed ${
              isDarkMode ? 'text-slate-300' : 'text-slate-600'
            }`}>
              AI-Powered biodiversity classification using <b>Taxaformer</b> and comprehensive marine databases
            </p>

            <div className="pt-8">
              <a 
                href="#upload"
                className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold rounded-full 
                           bg-black hover:bg-neutral-900 text-white 
                           shadow-lg shadow-black/30 transition-all"
              >
                Upload Sequences
                <ChevronRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div id="upload" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className={`text-2xl md:text-3xl mb-3 font-bold ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}>
            Upload Your Data
          </h2>
          <p className={`text-base ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Upload your eDNA sequence files for AI-powered taxonomic classification
          </p>
        </div>

        {/* Upload Area */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 transition-all ${
              dragActive
                ? isDarkMode
                  ? 'border-cyan-400 bg-cyan-500/10'
                  : 'border-blue-500 bg-blue-50'
                : isDarkMode
                ? 'border-slate-600 bg-slate-800/50'
                : 'border-slate-300 bg-white/50'
            } backdrop-blur-md`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="text-center">
              <Upload className={`w-16 h-16 mx-auto mb-4 ${
                isDarkMode ? 'text-cyan-400' : 'text-blue-500'
              }`} />
              <h3 className={`text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Drag & Drop Files
              </h3>
              <p className={`text-sm mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                or click to browse
              </p>
              <input
                type="file"
                multiple
                accept=".fasta,.fa,.fna"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className={`inline-block px-6 py-3 rounded-lg cursor-pointer transition-all ${
                  isDarkMode
                    ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Choose Files
              </label>
              <p className={`text-xs mt-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                Supported formats: .fasta, .fa, .fna
              </p>
            </div>
          </div>

          <div className={`rounded-xl p-8 ${
            isDarkMode ? 'bg-slate-800/50' : 'bg-white/50'
          } backdrop-blur-md`}>
            <h3 className={`text-lg mb-4 font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Upload Guidelines
            </h3>
            <ul className={`space-y-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              <li className="flex items-start gap-2">
                <Database className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Upload FASTA formatted files containing DNA sequences</span>
              </li>
              <li className="flex items-start gap-2">
                <FileText className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Multiple files can be uploaded at once</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Sequences will be classified using Nucleotide Transformer AI</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className={`rounded-xl p-6 mb-8 ${
            isDarkMode ? 'bg-slate-800/50' : 'bg-white/50'
          } backdrop-blur-md`}>
            <h3 className={`text-lg mb-4 font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Uploaded Files ({uploadedFiles.length})
            </h3>
            <div className="space-y-2">
              {uploadedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    isDarkMode ? 'bg-slate-700/50' : 'bg-slate-100/50'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>{file.name}</span>
                </div>
              ))}
            </div>

            {!isLoading ? (
              <button
                onClick={handleAnalyze}
                className={`mt-6 w-full px-8 py-4 rounded-lg transition-all flex items-center justify-center gap-2 font-semibold ${
                  isDarkMode
                    ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-500/30'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30'
                }`}
              >
                Analyze Sequences
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <div className={`mt-6 w-full rounded-xl p-8 ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700' 
                  : 'bg-gradient-to-br from-white to-slate-50 border border-slate-200'
              }`}>
                <div className="space-y-6">
                  <div className="flex items-center justify-center gap-4">
                    {(() => {
                      const CurrentIcon = loadingStages[loadingStage].icon;
                      return (
                        <>
                          <div className={`relative ${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`}>
                            <CurrentIcon className="w-8 h-8 animate-pulse" />
                            <div className={`absolute inset-0 animate-ping opacity-20`}>
                              <CurrentIcon className="w-8 h-8" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                              {loadingStages[loadingStage].text}
                            </p>
                            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                              Stage {loadingStage + 1} of {loadingStages.length}
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  <div className="space-y-2">
                    <div className={`h-3 rounded-full overflow-hidden ${
                      isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
                    }`}>
                      <div
                        className={`h-full transition-all duration-500 ease-out ${
                          isDarkMode
                            ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500'
                            : 'bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      >
                        <div className="h-full w-full animate-pulse opacity-50 bg-white"></div>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
                        Processing...
                      </span>
                      <span className={`font-mono ${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`}>
                        {Math.round(progress)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sample Files Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
        <div className="mb-8">
          <h2 className={`text-2xl md:text-3xl mb-3 font-bold ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}>
            Explore Sample Analyses
          </h2>
          <p className={`text-base ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Browse existing analysis results from other users to see what insights you can discover
          </p>
        </div>

        {/* Sort Controls */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Sort by:
            </span>
            {[
              { key: 'latest', label: 'Latest' },
              { key: 'heavy', label: 'Largest Files' },
              { key: 'sequences', label: 'Most Sequences' },
              { key: 'confidence', label: 'Highest Confidence' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSortBy(key as any)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                  sortBy === key
                    ? isDarkMode
                      ? 'bg-cyan-600 text-white'
                      : 'bg-blue-600 text-white'
                    : isDarkMode
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Sample Files Grid */}
        {loadingSamples ? (
          <div className={`flex items-center justify-center py-12 rounded-xl ${
            isDarkMode ? 'bg-slate-800/50' : 'bg-white/50'
          } backdrop-blur-md`}>
            <Loader2 className={`w-8 h-8 animate-spin ${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`} />
            <span className={`ml-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Loading sample files...
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getSortedSamples().slice(0, 10).map((sample) => (
              <div
                key={sample.job_id}
                onClick={() => handleSampleSelect(sample.job_id)}
                className={`p-6 rounded-xl cursor-pointer transition-all hover:scale-105 ${
                  isDarkMode 
                    ? 'bg-slate-800/50 hover:bg-slate-800/70 border border-slate-700 hover:border-cyan-500/50' 
                    : 'bg-white/50 hover:bg-white/70 border border-slate-200 hover:border-blue-500/50'
                } backdrop-blur-md shadow-lg hover:shadow-xl`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {sample.filename}
                      </h3>
                      <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {new Date(sample.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <FileText className={`w-5 h-5 flex-shrink-0 ${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-100/50'}`}>
                      <div className={`font-medium ${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`}>
                        {sample.total_sequences}
                      </div>
                      <div className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
                        Sequences
                      </div>
                    </div>
                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-100/50'}`}>
                      <div className={`font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                        {Math.round(sample.avg_confidence * 100)}%
                      </div>
                      <div className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
                        Confidence
                      </div>
                    </div>
                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-100/50'}`}>
                      <div className={`font-medium ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                        {sample.file_size_mb.toFixed(1)} MB
                      </div>
                      <div className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
                        File Size
                      </div>
                    </div>
                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-100/50'}`}>
                      <div className={`font-medium ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                        {sample.novel_species_count}
                      </div>
                      <div className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
                        Novel Species
                      </div>
                    </div>
                  </div>

                  <button className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    isDarkMode
                      ? 'bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30'
                      : 'bg-blue-600/20 text-blue-600 hover:bg-blue-600/30'
                  }`}>
                    View Analysis Results
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {sampleFiles.length === 0 && !loadingSamples && (
          <div className={`text-center py-12 rounded-xl ${
            isDarkMode ? 'bg-slate-800/50' : 'bg-white/50'
          } backdrop-blur-md`}>
            <Database className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
            <p className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              No sample files available
            </p>
            <p className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
              Be the first to upload and analyze sequences!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}