import { ChevronLeft } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

interface FAQPageProps {
  isDarkMode: boolean;
  onNavigate: (page: string) => void;
}

const faqData = [
  {
    question: "What is Taxaformer and how does it differ from traditional BLAST analysis?",
    answer: "Taxaformer is an AI-powered eDNA classification platform that uses a fine-tuned Nucleotide Transformer model instead of traditional sequence alignment. While traditional methods like BLAST can take days to process large datasets, Taxaformer analyzes millions of reads in minutes with >90% taxonomic accuracy, specifically optimized for marine and deep-sea eukaryotic diversity."
  },
  {
    question: "What file formats can I upload?",
    answer: "We support .FASTA sequence files. You can also upload .FA and .FN files containing sample metadata. The system supports drag-and-drop uploads with a maximum file containing 12000 eDNA sequences."
  },
  {
    question: "Who is this platform designed for?",
    answer: "The platform is built for Marine Biologists, Conservation Researchers, and Bioinformaticians. It is particularly useful for detecting biodiversity patterns in deep-sea environments where reference databases are often incomplete."
  },
  {
    question: "What reference databases do you use?",
    answer: "We utilize a combined reference database including PR2 and SILVA, specifically optimized for marine eukaryotic diversity. This allows for precise classification from the Phylum down to the Genus level."
  },
  {
    question: "What is \"novelty score\"?",
    answer: "It is a metric showing how different a sequence is from known references. Higher scores indicate potential:\n• New species\n• Divergent lineages\n• Rare organisms"
  },
  {
    question: "How does the system detect \"Novel Species\"?",
    answer: "Our system identifies novel species using a confidence threshold mechanism. If a sequence is classified with a confidence score lower than 0.7 (70%), it is flagged as \"Potentially Novel\". We calculate a Novelty Score (0-100) based on its distance from known clusters in our reference database (PR2/SILVA). You can view these sequences in the dedicated \"Novel Species Detected\" panel on your dashboard."
  },
  {
    question: "How do you interpret the \"Confidence Score\"?",
    answer: "The Confidence Score indicates the model's certainty in its taxonomic prediction.\n• > 90%: High certainty (Species/Genus level match)\n• 70% - 90%: Moderate certainty (Likely Family/Order level match)\n• < 70%: Low certainty (Flagged as Potential Novel Species)"
  },
  {
    question: "What biodiversity metrics are calculated automatically?",
    answer: "The platform automatically computes five key ecological metrics:\n• Species Richness: Total unique taxa identified\n• Shannon Diversity Index: Measure of diversity taking into account abundance\n• Simpson Index: Probability that two individuals selected are the same species"
  },
  {
    question: "Can multiple users analyze data at the same time?",
    answer: "Yes, FastAPI backend + database supports concurrent requests. Each analysis runs independently without affecting others."
  },
  {
    question: "Does TaxaFormer store my previous analyses?",
    answer: "Yes. Every analysis is stored in our database, and you can revisit:\n• Results\n• Taxonomic breakdown\n• Novelty indicators\n• Location mapping\nwithout re-running the model."
  },
  {
    question: "Can I visualize my data on a map?",
    answer: "Yes. The Global Biodiversity Map module allows you to view your sampling sites interactively. You can toggle \"Depth Heat Maps,\" view coverage circles (1-500km radius), and click on specific markers to see location-specific biodiversity stats."
  },
  {
    question: "How does the 3D Cluster Visualization work?",
    answer: "We use Graph Neural Networks (GNN) to cluster DNA embeddings in 3D space. Sequences that are genetically similar appear closer together. This helps visualize relationships between known taxa and potential novel clusters that don't fit into existing groups."
  },
  {
    question: "Can I export my results for publication?",
    answer: "Absolutely. You can generate a comprehensive PDF Report that includes an executive summary, visualizations, and methodology. For raw data analysis, you can export your taxonomy tables and metrics in CSV, JSON, or Excel formats."
  },
  {
    question: "What are the system performance limits?",
    answer: "The system is designed to process approximately 21.7 million nucleotide base pairs per batch. Processing a standard 10MB file typically completes within 5 minutes."
  }
];

export default function FAQPage({ isDarkMode, onNavigate }: FAQPageProps) {
  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <div className="pt-12 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => onNavigate('contact')}
            className={`flex items-center gap-2 mb-8 text-sm transition-colors ${
              isDarkMode 
                ? 'text-cyan-400 hover:text-cyan-300' 
                : 'text-blue-600 hover:text-blue-700'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Contact
          </button>
          
          <div>
            <h1 className={`text-3xl md:text-4xl mb-4 font-bold ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              Frequently Asked Questions
            </h1>
            <p className={`text-base ${
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Find answers to common questions about Taxaformer
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="py-5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className={`rounded-xl p-6 md:p-8 ${
            isDarkMode ? 'bg-slate-800/50' : 'bg-white/50'
          }`}>
            <Accordion type="single" collapsible className="w-full">
              {faqData.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className={isDarkMode ? 'border-slate-700' : 'border-slate-200'}
                >
                  <AccordionTrigger className={`hover:no-underline ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}>
                    <span className="text-left pr-4">
                      <span className={`inline-block mr-3 ${
                        isDarkMode ? 'text-cyan-400' : 'text-blue-600'
                      }`}>
                        Q:
                      </span>
                      {faq.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className={`${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  } pl-8`}>
                    <div className="whitespace-pre-line">
                      <span className={`font-semibold mr-2 ${
                        isDarkMode ? 'text-cyan-400' : 'text-blue-600'
                      }`}>
                        A:
                      </span>
                      {faq.answer}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Contact CTA */}
          <div className={`mt-8 rounded-xl p-6 text-center ${
            isDarkMode ? 'bg-slate-800/50' : 'bg-white/50'
          }`}>
            <h3 className={`text-lg mb-2 font-bold ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              Still have questions?
            </h3>
            <p className={`text-sm mb-4 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Our team is here to help you get started with Taxaformer
            </p>
            <button
              onClick={() => onNavigate('contact')}
              className={`px-6 py-3 rounded-lg transition-colors ${
                isDarkMode
                  ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Contact Us
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}