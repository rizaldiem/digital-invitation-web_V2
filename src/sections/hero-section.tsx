'use client';

import { motion } from 'framer-motion';
import { SectionProps, extractHeroData, isLegacyHeroProps } from '@/types/section';
import { adaptHeroProps } from '@/lib/utils/section-adapter';
import { extractFirstName } from '@/lib/utils/section-adapter';
import SectionContainer from '@/components/invitation/SectionContainer';
import { invitationText } from '@/content/invitation-text';

// Legacy interface for backward compatibility
interface LegacyHeroProps {
  brideName?: string;
  groomName?: string;
  weddingDate?: string;
  quote?: string;
  quoteSource?: string;
}

// Union type for adaptable props
type AdaptableHeroProps = LegacyHeroProps | SectionProps;

// Type guard for legacy props
function isLegacyProps(props: AdaptableHeroProps): props is LegacyHeroProps {
  return isLegacyHeroProps(props);
}

export default function HeroSection(props: AdaptableHeroProps) {
  // Adapt props to ensure we have the data we need
  const adaptedProps = adaptHeroProps(props);
  
  const {
    brideName = extractFirstName('Flara'),
    groomName = extractFirstName('Kelvin'),
    weddingDate = 'Sabtu, 23 September 2024',
    quote = 'Dan di antara tanda-tanda kebesaran-Nya adalah Dia menciptakan untukmu pasangan dari jenismu sendiri...',
    quoteSource = 'QS. Ar-Rum: 21',
  } = adaptedProps;
  return (
    <section id="home" className="relative min-h-screen py-20" style={{ backgroundColor: 'var(--background)' }}>
      <SectionContainer>
        <div className="flex min-h-[80vh] flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
              <p className="font-serif text-sm tracking-[0.3em] text-primary uppercase">
                {invitationText.heroTitle}
              </p>
            <h1 className="mt-4 font-serif font-light tracking-wider text-primary text-center">
              <span className="block text-5xl md:text-7xl">{brideName}</span>
              <span className="block my-3 text-2xl md:text-3xl opacity-70">&</span>
              <span className="block text-5xl md:text-7xl">{groomName}</span>
            </h1>
            <p className="mt-4 font-serif text-lg tracking-[0.2em] text-primary/70">
              {weddingDate}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 max-w-2xl text-center"
          >
            <p className="font-serif text-lg leading-relaxed text-primary/80 italic">
              &ldquo;{quote}&rdquo;
            </p>
            <p className="mt-2 font-serif text-sm text-primary/60">{quoteSource}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-px bg-primary/50" />
            </div>
          </motion.div>
        </div>
      </SectionContainer>
    </section>
  );
}
