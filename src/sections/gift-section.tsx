'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Gift, Copy, Check, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import SectionContainer from '@/components/invitation/SectionContainer';
import { invitationText } from '@/content/invitation-text';

interface GiftAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  display_order: number;
}

export default function GiftSection() {
  const [accounts, setAccounts] = useState<GiftAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAccounts() {
      const { data, error } = await supabase
        .from('gift_accounts')
        .select('*')
        .order('display_order', { ascending: true });

      if (!error && data) {
        setAccounts(data);
      }
      setLoading(false);
    }
    fetchAccounts();
  }, []);

  const handleCopy = async (accountNumber: string, id: string) => {
    await navigator.clipboard.writeText(accountNumber);
    setCopiedId(id);
    toast.success('Nomor Rekening Disalin!', {
      duration: 3000,
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <section className="py-20" style={{ backgroundColor: 'var(--background)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="bg-background rounded-lg p-8 animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mx-auto mb-8"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </section>
    );
  }

  if (accounts.length === 0) {
    return null;
  }

  return (
    <section className="py-20" style={{ backgroundColor: 'var(--background)' }}>
      <SectionContainer>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-serif text-3xl md:text-4xl font-light tracking-wider text-primary mb-4">
            {invitationText.giftTitle}
          </h2>
          <p className="text-primary/60">
            {invitationText.sections.giftSubtitle}
          </p>
        </motion.div>

        <div className="space-y-6">
          {accounts.map((account, index) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/50 backdrop-blur-md rounded-lg p-6"
            >
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Gift className="w-6 h-6 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm text-primary/60">Bank</p>
                  <p className="font-serif text-xl text-primary">{account.bank_name}</p>
                </div>
              </div>

              <div className="bg-muted/30 rounded-lg p-5 mb-5">
                <p className="text-sm text-primary/60 mb-2">Nomor Rekening</p>
                <div className="flex items-center justify-between">
                  <p className="font-mono text-xl md:text-2xl text-primary tracking-wider">
                    {account.account_number}
                  </p>
                  <Button
                    onClick={() => handleCopy(account.account_number, account.id)}
                    variant="outline"
                    size="sm"
                    className="border-primary text-primary hover:bg-primary/10"
                  >
                    {copiedId === account.id ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Tersalin
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        Salin
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-3 justify-center">
                <Building2 className="w-5 h-5 text-primary/60" />
                <div>
                  <p className="text-sm text-primary/60">Nama Penerima</p>
                  <p className="font-medium text-primary">{account.account_name}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </SectionContainer>
    </section>
  );
}
