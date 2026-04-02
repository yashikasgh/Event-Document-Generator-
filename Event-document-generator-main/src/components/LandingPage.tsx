import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Printer } from "lucide-react";

type Phase = "printer" | "expanding" | "form";

const PrinterAnimation = ({ onComplete }: { onComplete: () => void }) => {
  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen gap-8"
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      {/* Printer body */}
      <motion.div
        className="relative"
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="brutal-border bg-foreground p-8 relative z-10">
          <Printer className="w-20 h-20 text-primary-foreground" strokeWidth={2.5} />
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-3 bg-primary brutal-border" />
        </div>

        {/* Paper slot */}
        <div className="w-full h-2 bg-muted brutal-border border-t-0" />

        {/* Document coming out */}
        <motion.div
          className="mx-auto w-[90%] bg-card brutal-border border-t-0 overflow-hidden"
          initial={{ height: 0 }}
          animate={{ height: 180 }}
          transition={{ delay: 0.8, duration: 1.2, ease: "easeInOut" }}
          onAnimationComplete={onComplete}
        >
          <div className="p-4 space-y-2">
            <motion.div
              className="h-3 bg-primary/30 w-3/4"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1.2, duration: 0.4 }}
              style={{ transformOrigin: "left" }}
            />
            <motion.div
              className="h-2 bg-muted-foreground/20 w-full"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1.4, duration: 0.3 }}
              style={{ transformOrigin: "left" }}
            />
            <motion.div
              className="h-2 bg-muted-foreground/20 w-5/6"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1.5, duration: 0.3 }}
              style={{ transformOrigin: "left" }}
            />
            <motion.div
              className="h-2 bg-secondary/40 w-2/3"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1.6, duration: 0.3 }}
              style={{ transformOrigin: "left" }}
            />
          </div>
        </motion.div>
      </motion.div>

      <motion.p
        className="font-mono text-sm text-muted-foreground uppercase tracking-widest"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.5, 1] }}
        transition={{ delay: 0.4, duration: 1.5, repeat: 1 }}
      >
        Printing your workspace...
      </motion.p>
    </motion.div>
  );
};

const SignUpForm = () => {
  return (
    <motion.div
      className="flex items-center justify-center min-h-screen p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="w-full max-w-md"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
      >
        <div className="brutal-card space-y-6">
          <div>
            <motion.h1
              className="text-3xl font-bold uppercase tracking-tight"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Get Started
            </motion.h1>
            <motion.p
              className="text-muted-foreground font-mono text-sm mt-1"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Create documents that demand attention.
            </motion.p>
          </div>

          <motion.div
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div>
              <label className="font-bold text-sm uppercase tracking-wider block mb-2">
                Full Name
              </label>
              <input type="text" placeholder="Jane Doe" className="brutal-input" />
            </div>
            <div>
              <label className="font-bold text-sm uppercase tracking-wider block mb-2">
                Email
              </label>
              <input type="email" placeholder="jane@school.edu" className="brutal-input" />
            </div>
            <div>
              <label className="font-bold text-sm uppercase tracking-wider block mb-2">
                Password
              </label>
              <input type="password" placeholder="••••••••" className="brutal-input" />
            </div>
          </motion.div>

          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <a href="/dashboard" className="brutal-btn-primary block text-center w-full">
              Create Account →
            </a>
            <p className="text-center text-sm text-muted-foreground font-mono">
              Already have an account?{" "}
              <a href="/dashboard" className="text-primary font-bold underline underline-offset-4 decoration-2">
                Sign in
              </a>
            </p>
          </motion.div>
        </div>

        <motion.div
          className="mt-6 flex items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="h-4 w-4 bg-primary brutal-border" />
          <div className="h-4 w-4 bg-secondary brutal-border" />
          <div className="h-4 w-4 bg-accent brutal-border" />
          <span className="font-mono text-xs text-muted-foreground ml-2">
            DOCUPRINT — v1.0
          </span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

const LandingPage = () => {
  const [phase, setPhase] = useState<Phase>("printer");

  return (
    <AnimatePresence mode="wait">
      {phase === "printer" ? (
        <PrinterAnimation
          key="printer"
          onComplete={() => setTimeout(() => setPhase("form"), 600)}
        />
      ) : (
        <SignUpForm key="form" />
      )}
    </AnimatePresence>
  );
};

export default LandingPage;
