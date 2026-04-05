'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Clock, Navigation } from 'lucide-react';
import { SectionProps, extractEventData, isLegacyEventProps } from '@/types/section';
import { adaptEventProps, getCoupleName, extractFirstName } from '@/lib/utils/section-adapter';
import SectionContainer from '@/components/invitation/SectionContainer';
import { invitationText } from '@/content/invitation-text';

// Legacy interface for backward compatibility
interface LegacyEventProps {
  weddingDate?: string;
  ceremonyTime?: string;
  receptionTime?: string;
  venueName?: string;
  venueAddress?: string;
  venueMapsUrl?: string;
  coupleName?: string;
}

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

// Union type for adaptable props
type AdaptableEventProps = LegacyEventProps | SectionProps;

export default function EventDetails(props: AdaptableEventProps) {
  // Extract couple name from props if available
  const extractedCoupleName = props && typeof props === 'object' && 'data' in props 
    ? getCoupleName((props as SectionProps).data)
    : (props as LegacyEventProps)?.coupleName || 'Flara & Kelvin';
  
  // Adapt props to ensure we have the data we need
  const adaptedProps = adaptEventProps(props, extractedCoupleName);
  
  const {
    weddingDate = '2024-09-23',
    ceremonyTime = '08:00 - 10.00 WIB',
    receptionTime = '11:00 - 14:00 WIB',
    venueName = 'Vue Palace Hotel',
    venueAddress = 'Jl. Otto Iskandar Dinata No.3, Babakan Ciamis, Kec. Sumur Bandung, Kota Bandung',
    venueMapsUrl = 'https://maps.google.com/?q=Vue+Palace+Hotel+Bandung',
    coupleName = `${extractFirstName('Flara')} & ${extractFirstName('Kelvin')}`,
  } = adaptedProps;

  const [countdown, setCountdown] = useState<CountdownTime>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const targetDate = new Date(weddingDate).getTime();

    const calculateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setCountdown({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);

    return () => clearInterval(interval);
  }, [weddingDate]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const generateCalendarUrl = () => {
    const date = new Date(weddingDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const title = encodeURIComponent(`The Wedding of ${coupleName}`);
    const details = encodeURIComponent(`Undangan Pernikahan ${coupleName}\nLocation: ${venueName}`);
    const location = encodeURIComponent(venueName);
    const dates = `${year}${month}${day}T210000Z/${year}${month}${day}T070000Z`;
    
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${dates}`;
  };

return (
    <>
      <section className="relative py-20 bg-primary/5">
        <SectionContainer>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="mb-12 text-center"
          >
            <h2 className="font-serif text-4xl font-light tracking-wider text-primary">
              {invitationText.saveDateTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl font-serif text-sm leading-relaxed text-primary/80">
              &ldquo;{invitationText.events.saveDateQuote}&rdquo;
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-12 flex justify-center"
          >
            <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
              {[
                { value: countdown.days, label: invitationText.countdown.days },
                { value: countdown.hours, label: invitationText.countdown.hours },
                { value: countdown.minutes, label: invitationText.countdown.minutes },
                { value: countdown.seconds, label: invitationText.countdown.seconds },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex min-w-[80px] flex-col items-center rounded-lg px-4 py-4 shadow-md bg-white/50 backdrop-blur-md"
                >
                  <span className="font-serif text-3xl font-light text-primary">
                    {String(item.value).padStart(2, '0')}
                  </span>
                  <span className="mt-1 text-xs uppercase tracking-wider text-primary/60">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex justify-center"
          >
            <a
              href={generateCalendarUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-medium text-white transition-all duration-300 hover:bg-primary/80"
            >
              <Calendar className="h-4 w-4" />
              {invitationText.calendarButton}
            </a>
          </motion.div>
        </SectionContainer>
      </section>

      <section id="event" className="relative py-20 bg-primary/5">
        <SectionContainer>
          <div className="grid gap-8 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex flex-col items-center rounded-lg px-8 py-8 shadow-md text-center bg-white/50 backdrop-blur-md">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-serif text-2xl font-light text-primary">
                  {invitationText.eventTitles.ceremony}
                </h3>
                <p className="mt-2 font-serif text-sm text-primary">
                  {formatDate(weddingDate)}
                </p>
                <p className="mt-1 font-serif text-sm text-primary/60">
                  {ceremonyTime}
                </p>

                <div className="mt-6 flex h-px w-24 bg-primary/30" />

                <div className="mt-6 flex items-center gap-2 text-primary/60">
                  <MapPin className="h-4 w-4 text-primary" />
                  <p className="text-sm">{venueName}</p>
                </div>
                <p className="mt-1 text-xs text-primary/60">{venueAddress}</p>

                <a
                  href={venueMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary px-6 py-2 text-sm text-primary transition-all duration-300 hover:bg-primary/10"
                >
                  <Navigation className="h-4 w-4" />
                  Google Maps
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="flex flex-col items-center rounded-lg px-8 py-8 shadow-md text-center bg-white/50 backdrop-blur-md">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-serif text-2xl font-light text-primary">
                  {invitationText.eventTitles.reception}
                </h3>
                <p className="mt-2 font-serif text-sm text-primary">
                  {formatDate(weddingDate)}
                </p>
                <p className="mt-1 font-serif text-sm text-primary/60">
                  {receptionTime}
                </p>

                <div className="mt-6 flex h-px w-24 bg-primary/30" />

                <div className="mt-6 flex items-center gap-2 text-primary/60">
                  <MapPin className="h-4 w-4 text-primary" />
                  <p className="text-sm">{venueName}</p>
                </div>
                <p className="mt-1 text-xs text-primary/60">{venueAddress}</p>

                <a
                  href={venueMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary px-6 py-2 text-sm text-primary transition-all duration-300 hover:bg-primary/10"
                >
                  <Navigation className="h-4 w-4" />
                  Google Maps
                </a>
              </div>
            </motion.div>
          </div>
        </SectionContainer>
      </section>
    </>
  );
}
