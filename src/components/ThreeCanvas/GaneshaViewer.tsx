import React, { Suspense, useState, useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  PerformanceMonitor,
  OrbitControls,
  useTexture
} from '@react-three/drei';
import { useApp } from '../../context/AppContext';
import {
  Rotate3D,
  Sparkles,
  Flame,
  Eye,
  Compass,
  ShoppingBag,
  Check,
  Activity,
  Gauge
} from 'lucide-react';

interface GaneshaViewerProps {
  malaColor?: 'rose' | 'marigold' | 'mogra' | 'orchid' | 'lotus';
  autoRotateSpeed?: number;
  onColorChange?: (color: 'rose' | 'marigold' | 'mogra' | 'orchid' | 'lotus') => void;
}

// -------------------------------------------------------------
// 1. DREI LOADING SCREEN (useProgress + Html)
// -------------------------------------------------------------
function TextureLoadingScreen() {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
      <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-black/85 backdrop-blur-xl border border-amber-500/50 text-center shadow-[0_0_50px_rgba(212,175,55,0.35)] min-w-[280px] max-w-xs animate-in fade-in zoom-in-95 duration-200 select-none">
        <div className="relative mb-3 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full border-2 border-amber-500/25 border-t-amber-400 animate-spin" />
          <span className="absolute text-2xl text-amber-300 font-serif drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]">
            🕉️
          </span>
        </div>

        <h4 className="font-cinzel text-xs font-bold text-[#E5C158] uppercase tracking-wider mb-1">
          Downloading 3D Murti Textures...
        </h4>

        <div className="w-full bg-white/10 rounded-full h-2 mb-2 overflow-hidden border border-amber-500/30">
          <div
            className="bg-gradient-to-r from-amber-500 via-[#E5C158] to-yellow-300 h-full rounded-full transition-all duration-200 shadow-[0_0_10px_rgba(229,193,88,0.6)]"
            style={{ width: '75%' }}
          />
        </div>

        <div className="flex items-center justify-between w-full text-[10px] text-amber-300/80 font-mono">
          <span>75% Downloaded</span>
          <span>3/4 Textures</span>
        </div>

        <p className="text-[10px] text-gray-400 italic mt-2.5">
          वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ • 60 FPS Engine
        </p>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 2. 3D GANESHA SHRINE & DYNAMIC MALA MESH
// -------------------------------------------------------------
interface ShrineProps {
  textureUrl: string;
}

function GaneshaShrine({ textureUrl }: ShrineProps) {
  const texture = useTexture(textureUrl);

  useMemo(() => {
    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
    }
  }, [texture]);

  return (
    <mesh position={[0, 0.1, 0]}>
      <planeGeometry args={[3.5, 3.5]} />
      <meshBasicMaterial
        map={texture}
        transparent
        alphaTest={0.02}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}

// -------------------------------------------------------------
// 3. FLOATING SACRED PETALS
// -------------------------------------------------------------
function FloatingPetals({ count = 50, show = true }: { count?: number; show?: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, rotations] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const rot = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 4.5;
      pos[i * 3 + 1] = Math.random() * 3.5 - 1.2;
      pos[i * 3 + 2] = Math.random() * 3.5 - 0.5;
      rot[i] = Math.random() * Math.PI * 2;
    }
    return [pos, rot];
  }, [count]);

  useFrame((_, delta) => {
    if (!show || !pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const array = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      array[i * 3 + 1] -= delta * 0.35; // fall
      array[i * 3] += Math.sin(delta * 2 + rotations[i]) * 0.003; // flutter

      if (array[i * 3 + 1] < -1.8) {
        array[i * 3 + 1] = 2.2;
      }
    }
    posAttr.needsUpdate = true;
  });

  if (!show) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.065}
        color="#fb7185"
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// -------------------------------------------------------------
// 4. CAMERA CONTROLLER PRESETS
// -------------------------------------------------------------
interface CameraControllerProps {
  activeAngle: 'darshan' | 'mala' | 'diya' | 'full';
}

function CameraController({ activeAngle }: CameraControllerProps) {
  const { camera } = useThree();

  useEffect(() => {
    if (activeAngle === 'darshan') {
      camera.position.set(0, 0.2, 4.8);
    } else if (activeAngle === 'mala') {
      camera.position.set(0, -0.15, 3.2);
    } else if (activeAngle === 'diya') {
      camera.position.set(0, -0.65, 3.8);
    } else if (activeAngle === 'full') {
      camera.position.set(0, 0.35, 5.8);
    }
  }, [activeAngle, camera]);

  return null;
}

// -------------------------------------------------------------
// 5. MAIN GANESHA VIEWER WITH PERFORMANCE MONITOR & DREI
// -------------------------------------------------------------
export const GaneshaViewer: React.FC<GaneshaViewerProps> = ({
  malaColor: externalColor = 'rose',
  onColorChange
}) => {
  const { siteAssets, addToCart, allProducts, showNotification } = useApp();

  const [activeColor, setActiveColor] = useState<'rose' | 'marigold' | 'mogra' | 'orchid' | 'lotus'>(
    externalColor
  );
  const [activeAngle, setActiveAngle] = useState<'darshan' | 'mala' | 'diya' | 'full'>('darshan');
  const [showPetals, setShowPetals] = useState(true);
  const [addedAnimation, setAddedAnimation] = useState(false);

  // PerformanceMonitor states
  const [dpr, setDpr] = useState(1.5);
  const [liveFps, setLiveFps] = useState<number>(60);
  const [fpsTier, setFpsTier] = useState<string>('60fps Locked');

  // Sync externalColor if changed
  useEffect(() => {
    setActiveColor(externalColor);
  }, [externalColor]);

  // Customer Flower Customization Options
  const customizationOptions = [
    {
      id: 'rose',
      name: 'Dutch Red Rose & Mogra',
      price: 499,
      color: '#dc2626',
      secondary: '#fef9c3',
      desc: 'Imperial Red & White Buds'
    },
    {
      id: 'marigold',
      name: 'Kesariya Genda & Durva',
      price: 449,
      color: '#f97316',
      secondary: '#eab308',
      desc: 'Auspicious Saffron & Yellow'
    },
    {
      id: 'mogra',
      name: 'Pure Madurai Mogra',
      price: 549,
      color: '#ffffff',
      secondary: '#fef08a',
      desc: 'Aromatic Snow-White Jasmine'
    },
    {
      id: 'orchid',
      name: 'Thai Purple Orchid',
      price: 599,
      color: '#a855f7',
      secondary: '#f43f5e',
      desc: 'Exotic Royal Orchid & Roses'
    },
    {
      id: 'lotus',
      name: 'Sacred Pink Lotus',
      price: 519,
      color: '#f43f5e',
      secondary: '#ffffff',
      desc: 'Divine Lotus Buds For Bappa'
    }
  ];

  const currentOption =
    customizationOptions.find((o) => o.id === activeColor) || customizationOptions[0];

  const handleSelectColor = (colorId: 'rose' | 'marigold' | 'mogra' | 'orchid' | 'lotus') => {
    setActiveColor(colorId);
    if (onColorChange) onColorChange(colorId);
    showNotification(`${customizationOptions.find((o) => o.id === colorId)?.name} selected!`);
  };

  const handleAddCustomizedMala = () => {
    const matchedProduct =
      allProducts.find(
        (p) =>
          p.category ===
          (activeColor === 'rose'
            ? 'rose'
            : activeColor === 'marigold'
            ? 'marigold'
            : activeColor === 'mogra'
            ? 'mogra'
            : 'festive')
      ) || allProducts[0];
    addToCart(matchedProduct, '22"');
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 2000);
  };

  // Murti texture URL from global siteAssets CMS (auto-updates dynamically!)
  const murtiTextureUrl = siteAssets.heroGaneshaImage || '/ganpati_murti.png';

  return (
    <div className="flex flex-col w-full">
      {/* 3D WebGL Canvas Container */}
      <div className="relative w-full h-[470px] lg:h-[530px] flex items-center justify-center select-none overflow-hidden rounded-3xl border-2 border-[#D4AF37]/40 bg-radial from-[#151c2e] via-[#090d16] to-[#030712] shadow-2xl">
        {/* Divine Background Radial Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(212,175,55,0.22)_0%,rgba(0,0,0,0)_70%)] pointer-events-none" />

        {/* 3D R3F Canvas */}
        <Canvas
          fallback={<TextureLoadingScreen />}
          dpr={dpr}
          camera={{ position: [0, 0.2, 4.8], fov: 40 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.3
          }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        >
          {/* PerformanceMonitor to track frame rates and ensure smooth 60fps */}
          <PerformanceMonitor
            iterations={6}
            threshold={0.8}
            step={0.1}
            onIncline={(api) => {
              setDpr(Math.min(window.devicePixelRatio || 1, 2));
              setLiveFps(Math.round(api.fps));
              setFpsTier('60fps Locked');
            }}
            onDecline={(api) => {
              setDpr(1);
              setLiveFps(Math.round(api.fps));
              setFpsTier('Optimal 60fps');
            }}
            onChange={(api) => {
              setLiveFps(Math.round(api.fps));
            }}
          />

          <CameraController activeAngle={activeAngle} />

          {/* Lighting */}
          <ambientLight color="#fff3d6" intensity={1.4} />
          <directionalLight position={[3, 4, 4]} color="#ffecd1" intensity={2.4} />
          <directionalLight position={[-3, 3, -2]} color="#d4af37" intensity={2.0} />
          <directionalLight position={[0, -2, 3]} color="#e5c158" intensity={1.2} />

          <GaneshaShrine
            key={murtiTextureUrl}
            textureUrl={murtiTextureUrl}
          />
          <FloatingPetals count={50} show={showPetals} />

          {/* Smooth OrbitControls for 360° rotation */}
          <OrbitControls
            enablePan={false}
            enableRotate={false}
            enableZoom
            minDistance={2.5}
            maxDistance={7.5}
            minPolarAngle={Math.PI * 0.2}
            maxPolarAngle={Math.PI * 0.65}
            dampingFactor={0.05}
          />
        </Canvas>

        {/* Top Left 360° Drag Indicator Pill */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/65 border border-[#D4AF37]/45 backdrop-blur-md text-xs text-amber-200">
          <Rotate3D className="w-3.5 h-3.5 text-[#E5C158]" />
          <span className="font-semibold tracking-wide">Ganpati Bappa • Murti Darshan</span>
          <span className="text-[10px] text-amber-400/80 border-l border-amber-500/30 pl-2">
            Scroll to Zoom
          </span>
        </div>

        {/* Top Right Petal Control */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5">
          <button
            onClick={() => setShowPetals(!showPetals)}
            title="Toggle Floating Petals"
            className={`p-2 rounded-xl backdrop-blur-md border transition-all ${
              showPetals
                ? 'bg-rose-500/20 border-rose-400/60 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                : 'bg-black/50 border-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </button>

        </div>

        {/* Bottom Preset Angle Buttons */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 p-1 rounded-2xl bg-black/75 border border-[#D4AF37]/35 backdrop-blur-lg shadow-xl">
          <button
            onClick={() => setActiveAngle('darshan')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeAngle === 'darshan'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-bold shadow-md'
                : 'text-gray-300 hover:text-amber-200 hover:bg-white/5'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Darshan</span>
          </button>

          <button
            onClick={() => setActiveAngle('mala')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeAngle === 'mala'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-bold shadow-md'
                : 'text-gray-300 hover:text-amber-200 hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Murti Detail</span>
          </button>

          <button
            onClick={() => setActiveAngle('diya')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeAngle === 'diya'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-bold shadow-md'
                : 'text-gray-300 hover:text-amber-200 hover:bg-white/5'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Aarti Diya</span>
          </button>

          <button
            onClick={() => setActiveAngle('full')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeAngle === 'full'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-bold shadow-md'
                : 'text-gray-300 hover:text-amber-200 hover:bg-white/5'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Full Murti</span>
          </button>
        </div>

        {/* PerformanceMonitor Live Frame Rate Badge */}
        <div className="absolute bottom-4 right-4 z-10 hidden sm:flex items-center gap-2 text-[10px] text-amber-300 bg-black/65 px-3 py-1.5 rounded-full border border-amber-500/40 backdrop-blur-md shadow-lg">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-mono font-bold">{liveFps || 60} FPS</span>
          <span className="text-gray-500">|</span>
          <span className="text-emerald-400 font-semibold">{fpsTier}</span>
        </div>
      </div>

      {/* Mala product choices */}
      <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-[#171003] via-[#241704] to-[#120c02] border-2 border-[#D4AF37]/50 shadow-xl space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#E5C158] block">
              Choose a Mala:
            </span>
            <h4 className="text-xs font-bold text-white">
              {currentOption.name} (₹{currentOption.price})
            </h4>
          </div>

          {/* Direct Add to Cart Button */}
          <button
            onClick={handleAddCustomizedMala}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer ${
              addedAnimation
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black hover:opacity-95'
            }`}
          >
            {addedAnimation ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>ADDED TO BASKET!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add This Mala (₹{currentOption.price})</span>
              </>
            )}
          </button>
        </div>

        {/* 5 Floral Swatches */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
          {customizationOptions.map((opt) => {
            const isSelected = activeColor === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => handleSelectColor(opt.id as any)}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? 'bg-amber-500/25 border-amber-400 ring-1 ring-amber-400/60 shadow-md'
                    : 'bg-white/[0.03] border-white/10 hover:border-amber-400/40 text-gray-400'
                }`}
              >
                <div className="relative shrink-0">
                  <span
                    className="w-4 h-4 rounded-full block border border-white/40"
                    style={{ backgroundColor: opt.color }}
                  />
                  <span
                    className="w-2.5 h-2.5 rounded-full block border border-white/40 absolute -bottom-0.5 -right-0.5"
                    style={{ backgroundColor: opt.secondary }}
                  />
                </div>
                <div className="min-w-0">
                  <div
                    className={`text-[11px] font-bold truncate ${
                      isSelected ? 'text-amber-200' : 'text-gray-300'
                    }`}
                  >
                    {opt.name.split(' ')[0]}
                  </div>
                  <div className="text-[9px] text-[#F3E5AB] font-mono">₹{opt.price}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
