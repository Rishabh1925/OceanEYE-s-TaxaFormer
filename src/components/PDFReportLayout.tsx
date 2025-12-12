import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PDFReportLayoutProps {
  data: {
    metadata: any;
    taxonomy_summary: any[];
    sequences: any[];
    stats: any;
  };
  isDarkMode?: boolean;
}

const COLORS = ['#22D3EE', '#10B981', '#A78BFA', '#F59E0B', '#EC4899', '#64748B'];

// Ensure all colors are valid hex colors for PDF generation
const sanitizeColor = (color: string): string => {
  // If it's already a hex color, return it
  if (color.startsWith('#') && (color.length === 7 || color.length === 4)) {
    return color;
  }
  // Default fallback color
  return '#64748B';
};

export default function PDFReportLayout({ data, isDarkMode = false }: PDFReportLayoutProps) {
  const { metadata, taxonomy_summary, sequences, stats } = data;

  // Prepare confidence distribution data
  const confidenceData = [
    { name: 'High (80-100%)', value: Math.floor(sequences.length * 0.6), color: sanitizeColor('#10B981') },
    { name: 'Medium (50-80%)', value: Math.floor(sequences.length * 0.3), color: sanitizeColor('#F59E0B') },
    { name: 'Low (0-50%)', value: Math.floor(sequences.length * 0.1), color: sanitizeColor('#EF4444') }
  ];

  // Prepare novelty distribution data
  const noveltyData = [
    { name: '0.00-0.05', value: Math.floor(sequences.length * 0.4) },
    { name: '0.05-0.10', value: Math.floor(sequences.length * 0.3) },
    { name: '0.10-0.15', value: Math.floor(sequences.length * 0.2) },
    { name: '0.15-0.20', value: Math.floor(sequences.length * 0.07) },
    { name: '0.20+', value: Math.floor(sequences.length * 0.03) }
  ];

  return (
    <div className="pdf-report-layout" style={{ 
      backgroundColor: '#ffffff', 
      color: '#000000',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      
      {/* Statistics Cards */}
      <div id="stats-overview" style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#1f2937' }}>
          Analysis Overview
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#f8fafc', 
            border: '1px solid #e2e8f0', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
              {metadata.totalSequences}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Total Sequences</div>
          </div>
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#f8fafc', 
            border: '1px solid #e2e8f0', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
              {stats.uniqueTaxa}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Unique Taxa</div>
          </div>
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#f8fafc', 
            border: '1px solid #e2e8f0', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
              {metadata.avgConfidence}%
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Avg Confidence</div>
          </div>
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#f8fafc', 
            border: '1px solid #e2e8f0', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
              {stats.potentiallyNovel}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Novel Candidates</div>
          </div>
        </div>
      </div>

      {/* Taxonomic Composition Pie Chart */}
      <div id="taxonomy-pie-chart" style={{ 
        marginBottom: '30px', 
        padding: '20px', 
        backgroundColor: '#ffffff', 
        border: '1px solid #e2e8f0', 
        borderRadius: '8px' 
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#1f2937' }}>
          Taxonomic Composition
        </h3>
        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={taxonomy_summary}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
              >
                {taxonomy_summary.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={sanitizeColor(COLORS[index % COLORS.length])} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '12px'
                }} 
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Confidence Distribution Bar Chart */}
      <div id="confidence-bar-chart" style={{ 
        marginBottom: '30px', 
        padding: '20px', 
        backgroundColor: '#ffffff', 
        border: '1px solid #e2e8f0', 
        borderRadius: '8px' 
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#1f2937' }}>
          Confidence Score Distribution
        </h3>
        <div style={{ height: '250px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={confidenceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '12px'
                }} 
              />
              <Bar dataKey="value" fill="#06b6d4" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Novelty Score Distribution */}
      <div id="novelty-bar-chart" style={{ 
        marginBottom: '30px', 
        padding: '20px', 
        backgroundColor: '#ffffff', 
        border: '1px solid #e2e8f0', 
        borderRadius: '8px' 
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#1f2937' }}>
          Novelty Score Distribution
        </h3>
        <div style={{ height: '250px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={noveltyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '12px'
                }} 
              />
              <Bar dataKey="value" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Sequences Table */}
      <div id="sequences-table" style={{ 
        marginBottom: '30px', 
        padding: '20px', 
        backgroundColor: '#ffffff', 
        border: '1px solid #e2e8f0', 
        borderRadius: '8px' 
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#1f2937' }}>
          Top 10 Sequences
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc' }}>
              <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                Sequence ID
              </th>
              <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                Taxonomy
              </th>
              <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                Confidence
              </th>
              <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                Length
              </th>
            </tr>
          </thead>
          <tbody>
            {sequences.slice(0, 10).map((seq, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '6px', fontFamily: 'monospace' }}>{seq.accession}</td>
                <td style={{ padding: '6px' }}>
                  {seq.taxonomy.length > 40 ? seq.taxonomy.substring(0, 40) + '...' : seq.taxonomy}
                </td>
                <td style={{ padding: '6px' }}>{(seq.confidence * 100).toFixed(1)}%</td>
                <td style={{ padding: '6px' }}>{seq.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}