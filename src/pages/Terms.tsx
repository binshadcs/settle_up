import { motion } from 'framer-motion';
import { ArrowLeft, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pt-4 pb-8 space-y-5">
        <div className="flex items-center justify-between">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <p className="text-xs font-semibold tracking-[0.18em] uppercase text-muted-foreground">Legal</p>
          <div className="w-10" />
        </div>

        <div className="card-elevated p-5 space-y-4">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Terms & Conditions
          </h1>
          <p className="text-sm text-muted-foreground">Last updated: February 22, 2026</p>
          <div className="space-y-3 text-sm text-foreground/90">
            <p>SettleUp is provided as-is for personal expense tracking.</p>
            <p>You are responsible for all data entered into the app and for account security.</p>
            <p>Cloud sync depends on Supabase availability and your network connectivity.</p>
            <p>We may update these terms from time to time. Continued use means you accept changes.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
