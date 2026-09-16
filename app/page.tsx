import { HeroSection } from '@/components/landing/HeroSection';
import { ExploreSection } from '@/components/landing/ExploreSection';
import { FeatureShowcase } from '@/components/landing/FeatureShowcase';

/**
 * صفحة الهبوط.
 * الهيرو وقسم الاستكشاف تفاعليان ('use client')، أما قسم المزايا والتذييل
 * فيُرسلان HTML جاهزاً بلا تكلفة JS.
 */
export default function LandingPage() {
  return (
    <main className="relative">
      <HeroSection />
      <ExploreSection />
      <FeatureShowcase />
    </main>
  );
}
