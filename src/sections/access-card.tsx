'use client';

import { useRef } from 'react';
import QRCode from 'react-qr-code';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Download, Ticket } from 'lucide-react';
import { extractFirstName } from '@/lib/utils/section-adapter';

interface AccessCardProps {
  guestName: string;
  coupleName?: string;
  weddingDate?: string;
}

export function AccessCard({ guestName, coupleName, weddingDate }: AccessCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const displayCoupleName = coupleName 
    ? `${extractFirstName(coupleName.split(' & ')[0])} & ${extractFirstName(coupleName.split(' & ')[1])}`
    : 'Bride & Groom';

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Tanggal Belum Ditentukan';
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    
    const canvas = await html2canvas(cardRef.current, {
      scale: 2,
      backgroundColor: '#1a1a1a',
      useCORS: true,
    });
    
    const link = document.createElement('a');
    link.download = `kartu-akses-${guestName.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const qrValue = `${typeof window !== 'undefined' ? window.location.origin : 'https://your-wedding.com'}/?to=${encodeURIComponent(guestName)}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-2 text-primary">
        <Ticket className="w-5 h-5" />
        <span className="font-medium">Kartu Akses Tamu</span>
      </div>

      <div
        ref={cardRef}
        className="bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] rounded-2xl p-8 max-w-sm mx-auto"
      >
        <div className="text-center mb-6">
          <p className="text-white/60 text-sm uppercase tracking-widest mb-2">
            Wedding of
          </p>
          <h4 className="font-serif text-2xl text-white">{displayCoupleName}</h4>
          <p className="text-white/40 text-xs mt-1">{formatDate(weddingDate)}</p>
        </div>

        <div className="bg-background p-4 rounded-xl mb-6">
          <QRCode
            value={qrValue}
            size={160}
            style={{ height: 'auto', width: '100%' }}
            viewBox={`0 0 256 256`}
          />
        </div>

        <div className="text-center">
          <p className="text-white/60 text-xs uppercase tracking-wider mb-1">
            Tamu Undangan
          </p>
          <p className="font-serif text-xl text-white">{guestName}</p>
        </div>
      </div>

      <Button
        onClick={handleDownload}
        className="w-full bg-[#1a1a1a] hover:bg-[#2d2d2d] text-white"
      >
        <Download className="w-4 h-4 mr-2" />
        Unduh Tiket
      </Button>
    </div>
  );
}
