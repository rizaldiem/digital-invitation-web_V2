'use client';

import { motion } from 'framer-motion';
import { SectionProps, extractTimelineData } from '@/types/section';
import { adaptTimelineProps, getCoupleName, extractFirstName } from '@/lib/utils/section-adapter';
import SectionContainer from '@/components/invitation/SectionContainer';
import { invitationText } from '@/content/invitation-text';

interface TimelineItem {
  date: string;
  title: string;
  description: string;
}

// Legacy interface for backward compatibility
interface LegacyLoveTimelineProps {
  items?: TimelineItem[];
  coupleName?: string;
}

// Union type for adaptable props
type AdaptableLoveTimelineProps = LegacyLoveTimelineProps | SectionProps;

const defaultTimelineItems: TimelineItem[] = [
  {
    date: 'September 2021',
    title: 'Awal Bertemu',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi cras fermentum odio eu feugiat pretium nibh ipsum.',
  },
  {
    date: 'September 2022',
    title: 'Menjalin Hubungan',
    description:
      'Vestibulum morbi blandit cursus risus. Facilisis sed odio morbi quis commodo odio. Condimentum mattis pellentesque id nibh.',
  },
  {
    date: 'September 2023',
    title: 'Bertunangan',
    description:
      'Arcu vitae elementum curabitur vitae nunc sed. Magna fermentum iaculis eu non.',
  },
  {
    date: 'September 2024',
    title: 'Hari Pernikahan',
    description:
      'Augue lacus viverra vitae congue eu consequat. Eget nunc scelerisque viverra mauris in aliquam sem fringilla.',
  },
];

export default function LoveTimeline(props: AdaptableLoveTimelineProps) {
  // Extract couple name from props if available
  const extractedCoupleName = props && typeof props === 'object' && 'data' in props 
    ? getCoupleName((props as SectionProps).data)
    : (props as LegacyLoveTimelineProps)?.coupleName || 'Flara & Kelvin';
  
  // Adapt props to ensure we have the data we need
  const adaptedProps = adaptTimelineProps(props, extractedCoupleName);
  
  const {
    items = defaultTimelineItems,
    coupleName = `${extractFirstName('Flara')} & ${extractFirstName('Kelvin')}`,
  } = adaptedProps;
  return (
    <section id="story" className="relative py-20" style={{ backgroundColor: 'var(--background)' }}>
      <SectionContainer>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          className="mb-16 text-center"
        >
          <h2 className="font-serif text-4xl font-light tracking-wider text-primary">
            {invitationText.sections.timelineTitle}
          </h2>
          <p className="mt-2 font-serif text-sm tracking-[0.3em] text-primary uppercase">
            {coupleName}
          </p>
        </motion.div>

        <div className="relative">
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-primary/30" />

          <div className="space-y-12">
            {items.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative flex items-center ${
                  index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
                }`}
              >
                <div
                  className={`w-1/2 ${
                    index % 2 === 0 ? 'pr-12 text-right' : 'pl-12 text-left'
                  }`}
                >
                  <div className="inline-block rounded-lg p-6 shadow-md bg-white/50 backdrop-blur-md">
                    <span className="font-serif text-sm font-medium text-primary">
                      {item.date}
                    </span>
                    <h3 className="mt-1 font-serif text-xl font-light text-primary">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-primary/80">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="absolute left-1/2 z-10 flex h-4 w-4 -translate-x-1/2 items-center justify-center">
                  <div className="h-4 w-4 rounded-full border-2 border-primary" style={{ backgroundColor: 'var(--background)' }} />
                </div>

                <div className="w-1/2" />
              </motion.div>
            ))}
          </div>
        </div>
      </SectionContainer>
    </section>
  );
}
