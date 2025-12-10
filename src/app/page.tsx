'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Upload, Dna, Map, LineChart, Database, Layers, ChevronRight, Waves, Fish, Microscope } from 'lucide-react';
// Import OGL for the 3D Gallery directly
import { Renderer, Camera, Transform, Plane, Program, Mesh, Texture } from 'ogl';

// --- Components (Assuming these exist in your project as per your structure) ---
import ModernNav from '@/components/ModernNav';
import UploadPage from '@/components/UploadPage';
import ReportPage from '@/components/ReportPage';
import ResultsPage from '@/components/ResultsPage';
import ContactPage from '@/components/ContactPage';
import OutputPage from '@/components/OutputPage';

// Dynamic imports for visual effects
const LiquidEther = dynamic(() => import('@/components/LiquidEther'), { ssr: false });
const SplitText = dynamic(() => import('@/components/SplitText'), { ssr: false });
const ClickSpark = dynamic(() => import('@/components/ClickSpark'), { ssr: false });
const GlareHover = dynamic(() => import('@/components/GlareHover'), { ssr: false });
const CardSwap = dynamic(() => import('@/components/CardSwap').then(mod => ({ default: mod.default })), { ssr: false });
const Card = dynamic(() => import('@/components/CardSwap').then(mod => ({ default: mod.Card })), { ssr: false });
const MapPage = dynamic(() => import('@/components/MapPage'), { ssr: false });

// ----------------------------------------------------------------------
// CUSTOM 3D CARD GENERATOR (Clean White Glass Style)
// ----------------------------------------------------------------------

function drawCardTexture(gl: any, title: string, description: string, color: string, isDarkMode: boolean) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  // Higher resolution for crisp text
  const width = 800; 
  const height = 1100; 
  canvas.width = width;
  canvas.height = height;

  if (ctx) {
    // 1. Draw Background
    // We use a subtle gradient to keep it looking premium, not flat
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    
    if (isDarkMode) {
      // Dark Mode: Deep Slate Glass
      gradient.addColorStop(0, 'rgba(30, 41, 59, 0.90)'); 
      gradient.addColorStop(1, 'rgba(15, 23, 42, 0.80)');  
    } else {
      // Light Mode: High-Opacity White (Matches your image)
      // Almost solid white, with just a tiny bit of transparency at the bottom
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.98)'); 
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0.92)'); 
    }
    
    // Add a strong, soft shadow to lift it off the page (3D effect)
    ctx.shadowColor = isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(148, 163, 184, 0.3)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 20;

    ctx.fillStyle = gradient;
    
    // Rounded Rectangle Path
    const radius = 60;
    ctx.beginPath();
    ctx.roundRect(10, 10, width - 20, height - 20, radius);
    ctx.fill();

    // Reset shadow for internal text
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // 2. Add a very subtle border 
    ctx.lineWidth = 2;
    // In light mode, a very faint white border adds a nice "shine" to the edge
    ctx.strokeStyle = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.4)';
    ctx.stroke();

    // 3. Draw "Icon" Glow Background (Soft colored blob behind icon)
    const glowGradient = ctx.createRadialGradient(100, 120, 0, 100, 120, 180);
    glowGradient.addColorStop(0, color + '20'); // Very subtle tint (12% opacity)
    glowGradient.addColorStop(1, color + '00'); // Fade out
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(100, 120, 180, 0, Math.PI * 2);
    ctx.fill();

    // 4. Draw Accent Icon Circle
    // In your reference image, the icon has a solid colored background box/circle
    ctx.fillStyle = color;
    // Draw a rounded square for the icon background (modern look)
    ctx.beginPath();
    ctx.roundRect(60, 80, 80, 80, 20); 
    ctx.fill();

    // 5. Draw Title
    ctx.fillStyle = isDarkMode ? '#ffffff' : '#0f172a'; // Slate-900 (Dark Navy)
    ctx.font = '800 60px Figtree, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    const titleX = 60;
    const titleY = 200; // Moved down slightly below icon
    
    // Wrap title
    const titleWords = title.split(' ');
    if (title.length > 20 || titleWords.length > 3) {
       const mid = Math.ceil(titleWords.length / 2);
       const line1 = titleWords.slice(0, mid).join(' ');
       const line2 = titleWords.slice(mid).join(' ');
       ctx.fillText(line1, titleX, titleY);
       ctx.fillText(line2, titleX, titleY + 75);
    } else {
       ctx.fillText(title, titleX, titleY);
    }

    // 6. Draw Description
    ctx.fillStyle = isDarkMode ? '#cbd5e1' : '#475569'; // Slate-600 (Professional Grey)
    ctx.font = 'normal 40px Figtree, system-ui, sans-serif';
    const descX = 60;
    let descY = 380; // Start description lower
    const maxWidth = width - 120;
    const lineHeight = 56;
    
    const words = description.split(' ');
    let line = '';
    
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, descX, descY);
        line = words[n] + ' ';
        descY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, descX, descY);
    
    // 7. Draw Bottom Accent Bar (Optional, matches the "clean" aesthetic)
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.roundRect(60, height - 40, width - 120, 6, 3);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }

  const texture = new Texture(gl, { generateMipmaps: true });
  texture.image = canvas;
  return { texture, width, height };
}

// ----------------------------------------------------------------------
// EMBEDDED CIRCULAR GALLERY LOGIC
// ----------------------------------------------------------------------

function debounce(func: any, wait: number) {
  let timeout: any;
  return function (this: any, ...args: any[]) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function lerp(p1: number, p2: number, t: number) {
  return p1 + (p2 - p1) * t;
}

class Media {
  geometry: any;
  gl: any;
  title: string;
  description: string;
  color: string;
  index: number;
  length: number;
  renderer: any;
  scene: any;
  screen: any;
  viewport: any;
  bend: number;
  isDarkMode: boolean;
  program: any;
  plane: any;
  speed: number = 0;
  extra: number = 0;
  widthTotal: number = 0;
  x: number = 0;
  width: number = 0;
  padding: number = 0;
  scale: number = 0;
  isBefore: boolean = false;
  isAfter: boolean = false;

  constructor({ geometry, gl, title, description, color, index, length, renderer, scene, screen, viewport, bend, isDarkMode }: any) {
    this.geometry = geometry;
    this.gl = gl;
    this.title = title;
    this.description = description;
    this.color = color;
    this.index = index;
    this.length = length;
    this.renderer = renderer;
    this.scene = scene;
    this.screen = screen;
    this.viewport = viewport;
    this.bend = bend;
    this.isDarkMode = isDarkMode;
    
    this.createShader();
    this.createMesh();
    this.onResize();
  }

  createShader() {
    // Generate the card texture dynamically
    const { texture, width, height } = drawCardTexture(this.gl, this.title, this.description, this.color, this.isDarkMode);
    
    this.program = new Program(this.gl, {
      depthTest: false,
      depthWrite: false,
      vertex: `
        precision highp float;
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform float uTime;
        uniform float uSpeed;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 p = position;
          // The bend effect
          p.z = (sin(p.x * 4.0 + uTime) * 1.5 + cos(p.y * 2.0 + uTime) * 1.5) * (0.1 + uSpeed * 0.5);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform sampler2D tMap;
        varying vec2 vUv;
        void main() {
          vec4 color = texture2D(tMap, vUv);
          gl_FragColor = color;
        }
      `,
      uniforms: {
        tMap: { value: texture },
        uTime: { value: 0 },
        uSpeed: { value: 0 }
      },
      transparent: true
    });
  }

  createMesh() {
    this.plane = new Mesh(this.gl, { geometry: this.geometry, program: this.program });
    this.plane.setParent(this.scene);
  }

  update(scroll: any, direction: any) {
    this.plane.position.x = this.x - scroll.current - this.extra;
    const x = this.plane.position.x;
    const H = this.viewport.width / 2;

    // Bending Logic
    if (this.bend === 0) {
      this.plane.position.y = 0;
      this.plane.rotation.z = 0;
    } else {
      const B_abs = Math.abs(this.bend);
      const R = (H * H + B_abs * B_abs) / (2 * B_abs);
      const effectiveX = Math.min(Math.abs(x), H);
      const arc = R - Math.sqrt(R * R - effectiveX * effectiveX);
      if (this.bend > 0) {
        this.plane.position.y = -arc;
        this.plane.rotation.z = -Math.sign(x) * Math.asin(effectiveX / R);
      } else {
        this.plane.position.y = arc;
        this.plane.rotation.z = Math.sign(x) * Math.asin(effectiveX / R);
      }
    }

    this.speed = scroll.current - scroll.last;
    this.program.uniforms.uTime.value += 0.04;
    this.program.uniforms.uSpeed.value = this.speed;

    const planeOffset = this.plane.scale.x / 2;
    const viewportOffset = this.viewport.width / 2;
    this.isBefore = this.plane.position.x + planeOffset < -viewportOffset;
    this.isAfter = this.plane.position.x - planeOffset > viewportOffset;
    
    if (direction === 'right' && this.isBefore) {
      this.extra -= this.widthTotal;
      this.isBefore = this.isAfter = false;
    }
    if (direction === 'left' && this.isAfter) {
      this.extra += this.widthTotal;
      this.isBefore = this.isAfter = false;
    }
  }

  onResize({ screen, viewport }: any = {}) {
    if (screen) this.screen = screen;
    if (viewport) this.viewport = viewport;
    
    this.scale = this.screen.height / 1500;
    
    // INCREASED SIZE HERE: 
    // Was 800/600, now significantly larger relative to viewport to make them "Big"
    this.plane.scale.y = (this.viewport.height * (1100 * this.scale)) / this.screen.height; 
    this.plane.scale.x = (this.viewport.width * (800 * this.scale)) / this.screen.width;
    
    this.padding = 2.5; // Slightly more padding for spacing
    this.width = this.plane.scale.x + this.padding;
    this.widthTotal = this.width * this.length;
    this.x = this.width * this.index;
  }
}

class App {
  container: any;
  scroll: any;
  onCheckDebounce: any;
  renderer: any;
  gl: any;
  camera: any;
  scene: any;
  planeGeometry: any;
  medias: any[] = [];
  screen: any;
  viewport: any;
  isDown: boolean = false;
  start: number = 0;
  raf: any;
  boundOnResize: any;
  boundOnWheel: any;
  boundOnTouchDown: any;
  boundOnTouchMove: any;
  boundOnTouchUp: any;

  constructor(container: any, { items, bend, isDarkMode }: any) {
    this.container = container;
    this.scroll = { ease: 0.05, current: 0, target: 0, last: 0 };
    this.onCheckDebounce = debounce(this.onCheck, 200);
    this.createRenderer();
    this.createCamera();
    this.createScene();
    this.onResize();
    this.createGeometry();
    this.createMedias(items, bend, isDarkMode);
    this.update();
    this.addEventListeners();
  }

  createRenderer() {
    this.renderer = new Renderer({ alpha: true, antialias: true, dpr: Math.min(window.devicePixelRatio || 1, 2) });
    this.gl = this.renderer.gl;
    this.gl.clearColor(0, 0, 0, 0);
    this.container.appendChild(this.gl.canvas);
  }

  createCamera() {
    this.camera = new Camera(this.gl);
    this.camera.fov = 45;
    this.camera.position.z = 20;
  }

  createScene() {
    this.scene = new Transform();
  }

  createGeometry() {
    this.planeGeometry = new Plane(this.gl, { heightSegments: 20, widthSegments: 20 });
  }

  createMedias(items: any[], bend: number, isDarkMode: boolean) {
    // Duplicate items for infinite scroll illusion
    const galleryItems = items.concat(items);
    this.medias = galleryItems.map((data, index) => {
      return new Media({
        geometry: this.planeGeometry,
        gl: this.gl,
        title: data.title,
        description: data.description,
        color: data.color,
        index,
        length: galleryItems.length,
        renderer: this.renderer,
        scene: this.scene,
        screen: this.screen,
        viewport: this.viewport,
        bend,
        isDarkMode
      });
    });
  }

  onTouchDown(e: any) {
    this.isDown = true;
    this.scroll.position = this.scroll.current;
    this.start = e.touches ? e.touches[0].clientX : e.clientX;
  }

  onTouchMove(e: any) {
    if (!this.isDown) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const distance = (this.start - x) * 0.05;
    this.scroll.target = this.scroll.position + distance;
  }

  onTouchUp() {
    this.isDown = false;
    this.onCheck();
  }

  onWheel(e: any) {
    const delta = e.deltaY || e.wheelDelta || e.detail;
    this.scroll.target += delta * 0.05;
    this.onCheckDebounce();
  }

  onCheck() {
    if (!this.medias || !this.medias[0]) return;
    const width = this.medias[0].width;
    const itemIndex = Math.round(Math.abs(this.scroll.target) / width);
    const item = width * itemIndex;
    this.scroll.target = this.scroll.target < 0 ? -item : item;
  }

  onResize() {
    this.screen = { width: this.container.clientWidth, height: this.container.clientHeight };
    this.renderer.setSize(this.screen.width, this.screen.height);
    this.camera.perspective({ aspect: this.screen.width / this.screen.height });
    const fov = (this.camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
    const width = height * this.camera.aspect;
    this.viewport = { width, height };
    if (this.medias) {
      this.medias.forEach(media => media.onResize({ screen: this.screen, viewport: this.viewport }));
    }
  }

  update() {
    this.scroll.current = lerp(this.scroll.current, this.scroll.target, this.scroll.ease);
    const direction = this.scroll.current > this.scroll.last ? 'right' : 'left';
    if (this.medias) {
      this.medias.forEach(media => media.update(this.scroll, direction));
    }
    this.renderer.render({ scene: this.scene, camera: this.camera });
    this.scroll.last = this.scroll.current;
    this.raf = window.requestAnimationFrame(this.update.bind(this));
  }

  addEventListeners() {
    this.boundOnResize = this.onResize.bind(this);
    this.boundOnWheel = this.onWheel.bind(this);
    this.boundOnTouchDown = this.onTouchDown.bind(this);
    this.boundOnTouchMove = this.onTouchMove.bind(this);
    this.boundOnTouchUp = this.onTouchUp.bind(this);
    window.addEventListener('resize', this.boundOnResize);
    window.addEventListener('mousewheel', this.boundOnWheel);
    window.addEventListener('wheel', this.boundOnWheel);
    window.addEventListener('mousedown', this.boundOnTouchDown);
    window.addEventListener('mousemove', this.boundOnTouchMove);
    window.addEventListener('mouseup', this.boundOnTouchUp);
    window.addEventListener('touchstart', this.boundOnTouchDown);
    window.addEventListener('touchmove', this.boundOnTouchMove);
    window.addEventListener('touchend', this.boundOnTouchUp);
  }

  destroy() {
    window.cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.boundOnResize);
  }
}

// The Component
function CircularGallery({ items, bend = 3, isDarkMode }: any) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Re-initialize app when dark mode changes to redraw textures
  useEffect(() => {
    if(!containerRef.current) return;
    // Clear previous canvas
    containerRef.current.innerHTML = '';
    
    const app = new App(containerRef.current, { items, bend, isDarkMode });
    return () => {
      app.destroy();
    };
  }, [items, bend, isDarkMode]);
  
  return <div className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing" ref={containerRef} />;
}


// ----------------------------------------------------------------------
// MAIN PAGE COMPONENT
// ----------------------------------------------------------------------

type PageType = 'home' | 'upload' | 'map' | 'report' | 'contact' | 'output' | 'results';

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageType>('home');

  const handleScrollTo = useCallback((id: string) => {
    const element = document.getElementById(id.replace('#', ''));
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleNavigate = useCallback((page: string) => {
    setCurrentPage(page as PageType);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const navItems = [
    { label: "Home", onClick: () => handleNavigate('home') },
    {
      label: "Platform",
      items: [
        { label: "Upload Sequences", onClick: () => handleNavigate('upload'), description: "Upload and process eDNA sequences", icon: <Upload className="w-5 h-5" /> },
        { label: "View Map", onClick: () => handleNavigate('map'), description: "Explore global biodiversity distribution", icon: <Map className="w-5 h-5" /> }
      ]
    },
    {
      label: "Analysis",
      items: [
        { label: "View Results", onClick: () => handleNavigate('output'), description: "Examine detailed classification results", icon: <Database className="w-5 h-5" /> },
        { label: "Analysis Charts", onClick: () => handleNavigate('results'), description: "View detailed charts and graphs", icon: <LineChart className="w-5 h-5" /> },
        { label: "View Report", onClick: () => handleNavigate('report'), description: "Generate comprehensive analysis reports", icon: <Layers className="w-5 h-5" /> }
      ]
    },
    { label: "Contact", onClick: () => handleNavigate('contact') }
  ];

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const handleUpload = () => handleNavigate('upload');
  const handleDemo = () => {
    if (currentPage !== 'home') {
      setCurrentPage('home');
      setTimeout(() => handleScrollTo('features'), 100);
    } else {
      handleScrollTo('features');
    }
  };

  return (
    <ClickSpark sparkColor={isDarkMode ? '#60A5FA' : '#3B82F6'} sparkSize={12} sparkRadius={20} sparkCount={8} duration={500}>
      <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white' : 'bg-gradient-to-b from-sky-100 via-sky-50 to-blue-50 text-slate-900'}`}>
        <div className="fixed inset-0 z-0 opacity-70">
          <LiquidEther colors={isDarkMode ? ['#0891B2', '#0E7490', '#155E75'] : ['#38BDF8', '#60A5FA', '#A78BFA']} bgColor={isDarkMode ? '#0F172A' : '#F0F9FF'} mouseForce={20} cursorSize={100} isViscous={false} viscous={30} iterationsViscous={32} iterationsPoisson={32} resolution={0.5} isBounce={false} autoDemo={true} autoSpeed={0.5} autoIntensity={2.2} takeoverDuration={0.25} autoResumeDelay={3000} autoRampDuration={0.6} />
        </div>

        <ModernNav items={navItems} onLogoClick={() => handleNavigate('home')} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} currentPage={currentPage} />

        <div className="relative z-10 pt-24">
          {currentPage === 'home' && <HomePage isDarkMode={isDarkMode} onNavigate={handleNavigate} handleScrollTo={handleScrollTo} handleUpload={handleUpload} handleDemo={handleDemo} />}
          {currentPage === 'upload' && <UploadPage isDarkMode={isDarkMode} onNavigate={handleNavigate} />}
          {currentPage === 'map' && <MapPage isDarkMode={isDarkMode} onNavigate={handleNavigate} />}
          {currentPage === 'report' && <ReportPage isDarkMode={isDarkMode} onNavigate={handleNavigate} />}
          {currentPage === 'results' && <ResultsPage isDarkMode={isDarkMode} onNavigate={handleNavigate} />}
          {currentPage === 'contact' && <ContactPage isDarkMode={isDarkMode} onNavigate={handleNavigate} />}
          {currentPage === 'output' && <OutputPage isDarkMode={isDarkMode} onNavigate={handleNavigate} />}
        </div>
      </div>
    </ClickSpark>
  );
}

// HomePage Component
function HomePage({ isDarkMode, onNavigate, handleScrollTo, handleUpload, handleDemo }: { isDarkMode: boolean; onNavigate: (page: string) => void; handleScrollTo: (id: string) => void; handleUpload: () => void; handleDemo: () => void; }) {
  
  // Data for the 3D Cards
  const features = [
    { title: "Nucleotide Transformer AI", description: "State-of-the-art deep learning model trained on eukaryotic sequences for accurate taxonomic classification from phylum to genus level.", color: "#06b6d4" },
    { title: "PR2 + SILVA Database", description: "Combined reference database specifically optimized for marine and deep-sea eukaryotic diversity analysis.", color: "#3b82f6" },
    { title: "Spatial Biodiversity Mapping", description: "Visualize eDNA results on interactive global maps with color-coded taxa and diversity metrics per sampling site.", color: "#8b5cf6" },
    { title: "Diversity Metrics", description: "Calculate species richness, Shannon index, and abundance estimates with confidence intervals.", color: "#ec4899" },
    { title: "Multi-Layer Filtering", description: "Filter results by taxonomic level, confidence threshold, depth range, and environmental parameters.", color: "#10b981" },
    { title: "Batch Processing", description: "Upload multiple samples with metadata and process thousands of sequences in parallel.", color: "#f59e0b" }
  ];

  return (
    <>
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-2">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
          <div className="relative">
            <div className="space-y-2 md:space-y-4 text-center">
              <div className="flex items-center justify-center gap-4 md:gap-6">
                <div className={`hidden md:block w-16 md:w-20 h-1 ${isDarkMode ? 'bg-cyan-400' : 'bg-cyan-600'}`}></div>
                <h1 className={`text-4xl md:text-6xl lg:text-7xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>DECODE THE</h1>
              </div>
              <div className="relative inline-block">
                <h1 className={`text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-none ${isDarkMode ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-blue-600' : 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-blue-600 to-blue-700'}`}>
                  OCEAN<span className={isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}>.</span>
                </h1>
              </div>
              <div className="flex items-center justify-center gap-4 md:gap-6">
                <h1 className={`text-4xl md:text-6xl lg:text-7xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>WITH AI</h1>
                <div className={`hidden md:block w-16 md:w-20 h-1 ${isDarkMode ? 'bg-cyan-400' : 'bg-cyan-600'}`}></div>
              </div>
            </div>
            <div className="mt-8 max-w-xl mx-auto text-center">
              <p className={`text-lg md:text-xl font-bold mb-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>AI-Powered eDNA Classification Platform</p>
              <p className={`text-sm md:text-base ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
  Uncover ecological patterns hidden in DNA with Taxaformer’s transformer-based analysis </p>

            </div>
            <div className="mt-10 md:mt-12 flex justify-center">
              <button type="button" onClick={handleUpload} className={`group px-10 py-4 rounded-full text-base font-bold transition-all flex items-center gap-3 ${isDarkMode ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-900 text-white hover:bg-slate-800'} shadow-lg`}>
                START ANALYZING <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section (Using 3D Card Scroll) */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-full mx-auto">
          <div className="text-center mb-10">
            <SplitText text="Powerful Features" tag="h2" className={`text-2xl md:text-3xl mb-4 font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`} delay={40} duration={0.6} ease="power3.out" splitType="chars" from={{ opacity: 0, y: 50 }} to={{ opacity: 1, y: 0 }} threshold={0.1} rootMargin="-100px" textAlign="center" />
            <p className={`text-base ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Everything you need for comprehensive eDNA analysis</p>
          </div>
          <div style={{ height: '700px', position: 'relative' }} className="w-full">
            <CircularGallery
              items={features}
              bend={2}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>
      </section>

      {/* Marine Biodiversity Data Showcase */}
      <section className={`py-20 px-4 sm:px-6 lg:px-8 ${isDarkMode ? 'bg-slate-800/30' : 'bg-white/20'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <SplitText text="Marine Biodiversity Data" tag="h2" className={`text-2xl md:text-3xl mb-6 font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`} delay={40} duration={0.6} ease="power3.out" splitType="chars" from={{ opacity: 0, y: 50 }} to={{ opacity: 1, y: 0 }} threshold={0.1} rootMargin="-100px" textAlign="left" />
              <p className={`text-base mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Explore comprehensive marine biodiversity analytics powered by advanced eDNA sequencing and AI classification.</p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className={`mt-1 p-2 rounded-lg ${isDarkMode ? 'bg-cyan-500/20' : 'bg-cyan-600/20'}`}><Dna className={`w-5 h-5 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`} /></div>
                  <div><h4 className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Genomic Transformer Core</h4><p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Powered by a fine-tuned Nucleotide Transformer for context-aware DNA syntax analysis</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <div className={`mt-1 p-2 rounded-lg ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-600/20'}`}><Waves className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} /></div>
                  <div><h4 className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>High-Speed Inference</h4><p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Uses smart compression and efficient sorting to analyze huge DNA datasets in just seconds</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <div className={`mt-1 p-2 rounded-lg ${isDarkMode ? 'bg-purple-500/20' : 'bg-purple-600/20'}`}><Fish className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} /></div>
                  <div><h4 className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Novelty Detection</h4><p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Automated embedding distance metrics flag unknown variants and potentially undiscovered species</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <div className={`mt-1 p-2 rounded-lg ${isDarkMode ? 'bg-pink-500/20' : 'bg-pink-600/20'}`}><Microscope className={`w-5 h-5 ${isDarkMode ? 'text-pink-400' : 'text-pink-600'}`} /></div>
                  <div><h4 className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Interactive Global Map</h4><p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Visualize and compare your findings against known areas of high ecological importance</p></div>
                </div>
              </div>
            </div>
            <div style={{ height: '600px', position: 'relative' }}>
              <CardSwap cardDistance={50} verticalDistance={60} delay={4000} pauseOnHover={true} width={480} height={400}>
                <Card customClass={!isDarkMode ? 'light-mode' : ''}>
                  <div className="p-6 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600"><Dna className="w-6 h-6 text-white" /></div>
                      <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-500/20 text-blue-600'}`}>Feature 1</span>
                    </div>
                    <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>DNA Sequencing</h3>
                    <p className={`text-sm mb-4 flex-grow ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Advanced eDNA extraction and sequencing from environmental samples</p>
                    <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-700/50">
                      <div><div className={`text-lg font-bold ${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`}>1.2M+</div><div className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Sequences</div></div>
                      <div><div className={`text-lg font-bold ${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`}>99.8%</div><div className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Accuracy</div></div>
                      <div><div className={`text-lg font-bold ${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`}>&lt; 24h</div><div className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Processing</div></div>
                    </div>
                  </div>
                </Card>
                <Card customClass={!isDarkMode ? 'light-mode' : ''}>
                    <div className="p-6 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600"><Waves className="w-6 h-6 text-white" /></div>
                      <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-500/20 text-blue-600'}`}>Feature 2</span>
                    </div>
                    <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Ocean Mapping</h3>
                    <p className={`text-sm mb-4 flex-grow ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Real-time biodiversity mapping across global marine ecosystems</p>
                    <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-700/50">
                      <div><div className={`text-lg font-bold ${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`}>47</div><div className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Locations</div></div>
                      <div><div className={`text-lg font-bold ${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`}>2.3M km²</div><div className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Coverage</div></div>
                      <div><div className={`text-lg font-bold ${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`}>0-6000m</div><div className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Depth</div></div>
                    </div>
                  </div>
                </Card>
                <Card customClass={!isDarkMode ? 'light-mode' : ''}>
                  <div className="p-6 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600"><Fish className="w-6 h-6 text-white" /></div>
                      <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-500/20 text-blue-600'}`}>Feature 3</span>
                    </div>
                    <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Species Detection</h3>
                    <p className={`text-sm mb-4 flex-grow ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>AI-powered taxonomic classification</p>
                    <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-700/50">
                      <div><div className={`text-lg font-bold ${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`}>1,284</div><div className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Species</div></div>
                      <div><div className={`text-lg font-bold ${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`}>23</div><div className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Phyla</div></div>
                      <div><div className={`text-lg font-bold ${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`}>PR2+SILVA</div><div className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Database</div></div>
                    </div>
                  </div>
                </Card>
                <Card customClass={!isDarkMode ? 'light-mode' : ''}>
                  <div className="p-6 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600"><Microscope className="w-6 h-6 text-white" /></div>
                      <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-500/20 text-blue-600'}`}>Feature 4</span>
                    </div>
                    <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Analysis Tools</h3>
                    <p className={`text-sm mb-4 flex-grow ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Comprehensive biodiversity analysis</p>
                    <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-700/50">
                      <div><div className={`text-lg font-bold ${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`}>661</div><div className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Samples</div></div>
                      <div><div className={`text-lg font-bold ${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`}>23</div><div className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Countries</div></div>
                      <div><div className={`text-lg font-bold ${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`}>18</div><div className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Projects</div></div>
                    </div>
                  </div>
                </Card>
              </CardSwap>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}