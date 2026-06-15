"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  User,
  Mail,
  Phone,
  AtSign,
  Fingerprint,
  Radar,
  ShieldAlert,
  Eye,
} from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    name: "",
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.username && !form.email && !form.phone && !form.name) return;

    setLoading(true);
    try {
      const res = await fetch("/api/investigate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      sessionStorage.setItem("investigation", JSON.stringify(data));
      router.push("/results");
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

      {/* Scanning line effect */}
      {loading && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="scan-line w-full h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-50" />
        </div>
      )}

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-2xl mx-auto px-6 py-16"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-accent/10 border border-accent/20 mb-6"
          >
            <Fingerprint className="w-10 h-10 text-accent" />
          </motion.div>
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            AI <span className="text-accent">Detective</span>
          </h1>
          <p className="text-muted text-lg max-w-md mx-auto">
            Enter what you know. We&apos;ll search public sources and build a
            digital profile.
          </p>
        </div>

        {/* Stats bar */}
        <div className="flex items-center justify-center gap-8 mb-10 text-sm text-muted">
          <div className="flex items-center gap-2">
            <Radar className="w-4 h-4 text-accent" />
            <span>30+ platforms</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-danger" />
            <span>Breach detection</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-accent" />
            <span>Web footprint</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            icon={<AtSign className="w-5 h-5" />}
            label="Most Used Username"
            placeholder="johndoe"
            value={form.username}
            onChange={(v) => setForm({ ...form, username: v })}
          />
          <InputField
            icon={<Mail className="w-5 h-5" />}
            label="Email Address"
            placeholder="john@example.com"
            type="email"
            value={form.email}
            onChange={(v) => setForm({ ...form, email: v })}
          />
          <InputField
            icon={<Phone className="w-5 h-5" />}
            label="Phone Number"
            placeholder="+1234567890"
            type="tel"
            value={form.phone}
            onChange={(v) => setForm({ ...form, phone: v })}
          />
          <InputField
            icon={<User className="w-5 h-5" />}
            label="Full Name"
            placeholder="John Doe"
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
          />

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={loading}
            className="w-full mt-6 h-14 rounded-xl bg-accent text-black font-semibold text-lg flex items-center justify-center gap-3 hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Investigating...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Start Investigation
              </>
            )}
          </motion.button>
        </form>

        <p className="text-center text-muted/60 text-xs mt-8">
          Only public, freely accessible information is searched. No private
          data is accessed.
        </p>
      </motion.main>
    </div>
  );
}

function InputField({
  icon,
  label,
  placeholder,
  type = "text",
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="group">
      <label className="block text-sm text-muted mb-1.5 ml-1">{label}</label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors">
          {icon}
        </div>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-13 pl-12 pr-4 rounded-xl bg-card border border-card-border text-foreground placeholder:text-muted/40 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
        />
      </div>
    </div>
  );
}
