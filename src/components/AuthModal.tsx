import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Lock } from "lucide-react";
import { toast } from "sonner";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

const AuthModal = ({ open, onClose }: AuthModalProps) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"magic" | "signin" | "signup">("magic");
  const [loading, setLoading] = useState(false);

  const handleMagicLink = async () => {
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth` },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("magicLinkSent"));
    }
  };

  const handlePasswordAuth = async () => {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: { emailRedirectTo: `${window.location.origin}/auth` },
      });
      setLoading(false);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(t("magicLinkSent"));
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });
      setLoading(false);
      if (error) {
        toast.error(error.message);
      } else {
        onClose();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-sm border-amber-900/50"
        style={{
          background: "linear-gradient(145deg, hsl(30 25% 8%) 0%, hsl(30 20% 5%) 100%)",
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-amber-100 font-bold tracking-wider uppercase text-sm text-center">
            {mode === "signup" ? t("signUp") : t("signIn")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-300" size={14} />
            <Input
              type="email"
              placeholder={t("email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-amber-950/40 border-amber-900/40 text-sm h-9 pl-9 placeholder:text-amber-400/60 focus:border-amber-400 focus:ring-amber-300"
              style={{ color: '#fff3c4', caretColor: '#fbbf24' }}
            />
          </div>
          
          {mode === "magic" && (
            <p className="text-xs text-amber-500/70 px-1">
              {t("emailLoginHelper")}
            </p>
          )}

          {mode === "magic" ? (
            <>
              <Button
                onClick={handleMagicLink}
                disabled={loading || !email.trim()}
                className="w-full bg-amber-800 hover:bg-amber-700 text-amber-100 border border-amber-600/50 text-xs h-9"
              >
                {loading ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                {t("sendMagicLink")}
              </Button>
               <div className="text-center">
                 <button
                   onClick={() => setMode("signin")}
                   className="text-[10px] text-amber-500/70 hover:text-amber-400 uppercase tracking-wider"
                 >
                   {t("orUsePassword")}
                 </button>
               </div>
            </>
          ) : (
            <>
               <div className="relative">
                 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-300" size={14} />
                  <Input
                     type="password"
                     placeholder={t("password")}
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     className="bg-amber-950/40 border-amber-900/40 text-sm h-9 pl-9 placeholder:text-amber-400/60 focus:border-amber-400 focus:ring-amber-300"
                     style={{ color: '#fff3c4', caretColor: '#fbbf24' }}
                 />
               </div>
              <Button
                onClick={handlePasswordAuth}
                disabled={loading || !email.trim() || !password.trim()}
                className="w-full bg-amber-800 hover:bg-amber-700 text-amber-100 border border-amber-600/50 text-xs h-9"
              >
                {loading ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                {mode === "signup" ? t("signUp") : t("signIn")}
              </Button>
               <div className="flex items-center justify-between">
                 <button
                   onClick={() => setMode("magic")}
                   className="text-[10px] text-amber-500/70 hover:text-amber-400 uppercase tracking-wider"
                 >
                   {t("sendMagicLink")}
                 </button>
                 <button
                   onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
                   className="text-[10px] text-amber-500/70 hover:text-amber-400 uppercase tracking-wider"
                 >
                   {mode === "signup" ? t("haveAccount") : t("noAccount")}
                 </button>
               </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
