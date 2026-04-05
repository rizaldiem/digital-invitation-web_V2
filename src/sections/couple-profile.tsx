'use client';

import { motion } from 'framer-motion';
import { SectionProps, extractCoupleData, isLegacyCoupleProps } from '@/types/section';
import { adaptCoupleProps, extractFirstName } from '@/lib/utils/section-adapter';
import SectionContainer from '@/components/invitation/SectionContainer';
import { invitationText } from '@/content/invitation-text';

// Legacy interface for backward compatibility
interface LegacyCoupleProps {
  brideName?: string;
  brideParents?: string;
  brideDescription?: string;
  brideInstagram?: string;
  bridePhotoUrl?: string;
  groomName?: string;
  groomParents?: string;
  groomDescription?: string;
  groomInstagram?: string;
  groomPhotoUrl?: string;
}

// Union type for adaptable props
type AdaptableCoupleProps = LegacyCoupleProps | SectionProps;

export default function CoupleProfile(props: AdaptableCoupleProps) {
  // Adapt props to ensure we have the data we need
  const adaptedProps = adaptCoupleProps(props);
  
  const {
    brideName = 'Flara Patricia',
    brideParents = 'Bapak Nama Bapak & Ibu Nama Ibu',
    brideDescription = 'Putri Pertama Dari',
    brideInstagram = '@flarapatricia',
    bridePhotoUrl,
    groomName = 'Kelvin Gunawan',
    groomParents = 'Bapak Nama Bapak & Ibu Nama Ibu',
    groomDescription = 'Putra Pertama Dari',
    groomInstagram = '@kelvingunawan',
    groomPhotoUrl,
  } = adaptedProps;
return (
    <section id="couple" className="relative overflow-hidden py-20" style={{ backgroundColor: 'var(--background)' }}>
      <SectionContainer>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          className="mb-16 text-center"
        >
          <h2 className="mt-2 font-serif text-4xl font-light text-primary">
            {invitationText.sections.heroSubtitle}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col items-center text-center"
          >
            <div className="mb-6 h-48 w-48 overflow-hidden rounded-full border-4 border-primary/30">
              <img
                src={bridePhotoUrl || "/bride-photo.jpg"}
                alt={brideName}
                className="h-full w-full object-cover"
              />
            </div>

            <p className="font-serif text-sm tracking-[0.3em] text-primary uppercase">
              {invitationText.sections.coupleBride}
            </p>
            <h3 className="mt-2 font-serif text-3xl font-light text-primary">
              {brideName}
            </h3>

            <div className="mt-4 h-px w-16 bg-primary/50" />

            <p className="mt-4 font-serif text-sm text-primary/60">
              {brideDescription}
            </p>
            <p className="mt-1 font-serif text-base text-primary/80">{brideParents}</p>

            {brideInstagram && (
              <a
                href={`https://instagram.com/${brideInstagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 px-4 py-2 text-sm border border-primary/30 text-primary rounded-full hover:bg-primary/10 transition"
              >
                {brideInstagram}
              </a>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col items-center text-center"
          >
            <div className="mb-6 h-48 w-48 overflow-hidden rounded-full border-4 border-primary/30">
              <img
                src={groomPhotoUrl || "/groom-photo.jpg"}
                alt={groomName}
                className="h-full w-full object-cover"
              />
            </div>

            <p className="font-serif text-sm tracking-[0.3em] text-primary uppercase">
              {invitationText.sections.coupleGroom}
            </p>
            <h3 className="mt-2 font-serif text-3xl font-light text-primary">
              {groomName}
            </h3>

            <div className="mt-4 h-px w-16 bg-primary/50" />

            <p className="mt-4 font-serif text-sm text-primary/60">
              {groomDescription}
            </p>
            <p className="mt-1 font-serif text-base text-primary/80">{groomParents}</p>

            {groomInstagram && (
              <a
                href={`https://instagram.com/${groomInstagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 px-4 py-2 text-sm border border-primary/30 text-primary rounded-full hover:bg-primary/10 transition"
              >
                {groomInstagram}
              </a>
            )}
          </motion.div>
        </div>
      </SectionContainer>
    </section>
  );
}
