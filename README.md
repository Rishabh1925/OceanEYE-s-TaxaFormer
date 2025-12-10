# Taxaformer - AI-Powered eDNA Classification Platform

Transform environmental DNA sequences into biodiversity insights using Nucleotide Transformer AI.

🚀 **Latest Update**: Fixed all TypeScript build errors for Vercel deployment

## 🌊 Features

- **Nucleotide Transformer AI** - State-of-the-art deep learning for taxonomic classification
- **PR2 + SILVA Database** - Optimized for marine and deep-sea eukaryotic diversity
- **Interactive Mapping** - Visualize biodiversity on global maps
- **Diversity Metrics** - Calculate species richness and Shannon index
- **Batch Processing** - Process thousands of sequences in parallel
- **Beautiful UI** - Modern, animated interface with dark mode support

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install --legacy-peer-deps

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 📦 Tech Stack

- **Framework:** Next.js 16 with React 19
- **Styling:** Tailwind CSS v4
- **UI Components:** Radix UI + shadcn/ui
- **Animations:** GSAP, Three.js
- **Maps:** Leaflet
- **Charts:** Recharts
- **Icons:** Lucide React

## 🌐 Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/taxaformer)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Vercel will automatically detect Next.js and deploy

### Environment Variables

No environment variables required for basic deployment.

## 📁 Project Structure

```
taxaformer/
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── page.tsx      # Main application page
│   │   ├── layout.tsx    # Root layout
│   │   └── globals.css   # Global styles
│   ├── components/       # React components
│   │   ├── ui/          # shadcn/ui components
│   │   ├── charts/      # Chart components
│   │   └── *.tsx        # Page components
│   └── lib/             # Utility functions
├── public/              # Static assets
└── package.json         # Dependencies
```

## 🎨 Key Components

- **LiquidEther** - Animated fluid background using Three.js
- **ModernNav** - Responsive navigation with dropdown menus
- **MapPage** - Interactive Leaflet map for biodiversity visualization
- **UploadPage** - File upload interface for eDNA sequences
- **OutputPage** - Results display with charts and filters
- **ReportPage** - Comprehensive analysis reports

## 🔧 Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 👥 Authors

Your Name - [GitHub](https://github.com/YOUR_USERNAME)

## 🙏 Acknowledgments

- Nucleotide Transformer AI team
- PR2 and SILVA database maintainers
- shadcn/ui for the beautiful component library
