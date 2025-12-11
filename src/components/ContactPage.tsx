import { useState } from 'react';
import { Mail, MessageSquare, Send, FileText } from 'lucide-react';

interface ContactPageProps {
  isDarkMode: boolean;
  onNavigate: (page: string) => void;
}

export default function ContactPage({ isDarkMode, onNavigate }: ContactPageProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      alert('Please fill in all fields before sending.');
      return;
    }

    // Create email body with professional formatting
    const emailBody = `Dear Taxaformer Team,

I hope this message finds you well. I am reaching out regarding ${formData.subject.toLowerCase()}.

${formData.message}

I would appreciate your assistance with this matter. Please feel free to contact me at your earliest convenience.

Best regards,
${formData.name}

---
Contact Information:
Name: ${formData.name}
Email: ${formData.email}
Subject: ${formData.subject}

This message was sent via the Taxaformer contact form.`;

    // Create mailto URL with pre-filled information
    const mailtoUrl = `mailto:contact.taxaformer@gmail.com?subject=${encodeURIComponent(`[Taxaformer Contact] ${formData.subject}`)}&body=${encodeURIComponent(emailBody)}`;
    
    // Open email client
    window.location.href = mailtoUrl;
    
    // Optionally reset form
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className={`text-3xl md:text-4xl mb-3 font-bold ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}>
            Contact Us
          </h1>
          <p className={`text-base ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Have questions or feedback? We'd love to hear from you.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className={`rounded-xl p-8 ${
            isDarkMode ? 'bg-slate-800/50' : 'bg-white/50'
          } backdrop-blur-md`}>
            <h2 className={`text-xl mb-6 font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Send us a message
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className={`block text-sm mb-2 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-3 rounded-lg border transition-all ${
                    isDarkMode
                      ? 'bg-slate-700 border-slate-600 text-white focus:border-cyan-400'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 ${
                    isDarkMode ? 'focus:ring-cyan-400/20' : 'focus:ring-blue-500/20'
                  }`}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className={`block text-sm mb-2 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-3 rounded-lg border transition-all ${
                    isDarkMode
                      ? 'bg-slate-700 border-slate-600 text-white focus:border-cyan-400'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 ${
                    isDarkMode ? 'focus:ring-cyan-400/20' : 'focus:ring-blue-500/20'
                  }`}
                  placeholder="your.email@example.com"
                />
              </div>
              <div>
                <label className={`block text-sm mb-2 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-3 rounded-lg border transition-all ${
                    isDarkMode
                      ? 'bg-slate-700 border-slate-600 text-white focus:border-cyan-400'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 ${
                    isDarkMode ? 'focus:ring-cyan-400/20' : 'focus:ring-blue-500/20'
                  }`}
                  placeholder="What's this about?"
                />
              </div>
              <div>
                <label className={`block text-sm mb-2 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className={`w-full px-4 py-3 rounded-lg border transition-all resize-none ${
                    isDarkMode
                      ? 'bg-slate-700 border-slate-600 text-white focus:border-cyan-400'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 ${
                    isDarkMode ? 'focus:ring-cyan-400/20' : 'focus:ring-blue-500/20'
                  }`}
                  placeholder="Tell us more..."
                />
              </div>
              <button
                type="submit"
                className={`w-full px-6 py-4 rounded-lg transition-all flex items-center justify-center gap-2 ${
                  isDarkMode
                    ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Send className="w-5 h-5" />
                Send Message
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            {/* Email */}
            <div className={`rounded-xl p-6 ${
              isDarkMode ? 'bg-slate-800/50' : 'bg-white/50'
            } backdrop-blur-md`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${
                  isDarkMode ? 'bg-cyan-500/20' : 'bg-blue-500/20'
                }`}>
                  <Mail className={`w-6 h-6 ${
                    isDarkMode ? 'text-cyan-400' : 'text-blue-500'
                  }`} />
                </div>
                <div>
                  <h3 className={`text-lg mb-1 font-bold ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}>
                    Email
                  </h3>
                  <p className={`text-sm mb-2 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    Send us an email anytime
                  </p>
                  <a
                    href="mailto:contact.taxaformer@gmail.com"
                    className={`${
                      isDarkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-600 hover:text-blue-700'
                    }`}
                  >
                    contact.taxaformer@gmail.com
                  </a>
                </div>
              </div>
            </div>


            {/* Documentation */}
            <div className={`rounded-xl p-6 ${
              isDarkMode ? 'bg-slate-800/50' : 'bg-white/50'
            } backdrop-blur-md`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${
                  isDarkMode ? 'bg-cyan-500/20' : 'bg-blue-500/20'
                }`}>
                  <FileText className={`w-6 h-6 ${
                    isDarkMode ? 'text-cyan-400' : 'text-blue-500'
                  }`} />
                </div>
                <div>
                  <h3 className={`text-lg mb-1 font-bold ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}>
                    Documentation
                  </h3>
                  <p className={`text-sm mb-2 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    Read our guides and API docs
                  </p>
                  <a
                    href="https://drive.google.com/file/d/1l5WB4pIUDuEXwNs7j4DxH1iYzScS7IC6/view?usp=sharing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${
                      isDarkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-600 hover:text-blue-700'
                    }`}
                  >
                    Google Docs
                  </a>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className={`rounded-xl p-6 ${
              isDarkMode ? 'bg-slate-800/50' : 'bg-white/50'
            } backdrop-blur-md`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${
                  isDarkMode ? 'bg-cyan-500/20' : 'bg-blue-500/20'
                }`}>
                  <MessageSquare className={`w-6 h-6 ${
                    isDarkMode ? 'text-cyan-400' : 'text-blue-500'
                  }`} />
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg mb-1 font-bold ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}>
                    FAQ
                  </h3>
                  <p className={`text-sm mb-3 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    Find answers to common questions in our FAQ section
                  </p>
                  <button
                    onClick={() => onNavigate('faq')}
                    className={`${
                      isDarkMode 
                        ? 'text-cyan-400 hover:text-cyan-300' 
                        : 'text-blue-600 hover:text-blue-700'
                    }`}
                  >
                    View All FAQs →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Deep Sea Image Section */}
        <div className={`mt-12 rounded-xl overflow-hidden ${
          isDarkMode ? 'bg-slate-800/50' : 'bg-white/50'
        } backdrop-blur-md`}>
          <img
            src="https://images.unsplash.com/photo-1719042575585-e9d866f43210?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3JhbCUyMHJlZWYlMjB1bmRlcndhdGVyfGVufDF8fHx8MTc2NDkxNjU0OHww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Coral reef underwater"
            className="w-full h-64 object-cover"
          />
        </div>
      </div>
    </div>
  );
}