import { motion } from "framer-motion";
import { FileText, Image, BarChart3, Users, Sparkles, ArrowRight, Calendar } from "lucide-react";

const features = [
  {
    title: "Events",
    description: "Manage events and link all your documents in one place",
    icon: Calendar,
    color: "bg-secondary",
    span: "col-span-2",
    href: "/events",
  },
  {
    title: "Proposal",
    description: "Generate professional event proposals with live PDF preview",
    icon: FileText,
    color: "bg-primary",
    span: "col-span-1",
    href: "/generate/proposal",
  },
  {
    title: "Flyer",
    description: "AI-powered event flyers with style presets",
    icon: Image,
    color: "bg-secondary",
    span: "col-span-1",
    href: "/generate/flyer",
  },
  {
    title: "Report",
    description: "Post-event reports with charts and data visualization",
    icon: BarChart3,
    color: "bg-accent",
    span: "col-span-1",
    href: "/generate/report",
  },
  {
    title: "Attendance",
    description: "Upload rosters, mark attendance, export sheets",
    icon: Users,
    color: "bg-primary",
    span: "col-span-2",
    href: "/generate/attendance",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const item = {
  hidden: { y: 30, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const Dashboard = () => {
  return (
    <div className="min-h-screen p-6 md:p-10">
      {/* Header */}
      <motion.header
        className="flex items-center justify-between mb-10"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-foreground brutal-border flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">DocuPrint</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-muted-foreground hidden sm:block">
            Welcome back
          </span>
          <div className="w-10 h-10 bg-secondary brutal-border flex items-center justify-center">
            <span className="font-bold text-secondary-foreground text-sm">JD</span>
          </div>
        </div>
      </motion.header>

      {/* Tagline */}
      <motion.div
        className="mb-10"
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <h2 className="text-4xl md:text-5xl font-bold uppercase leading-tight max-w-2xl">
          What are we
          <br />
          <span className="text-primary">printing</span> today?
        </h2>
        <p className="font-mono text-sm text-muted-foreground mt-3 max-w-md">
          Select a document type below to start generating.
        </p>
      </motion.div>

      {/* Bento Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {features.map((feature) => (
          <motion.a
            key={feature.title}
            href={feature.href}
            className={`brutal-card group cursor-pointer ${feature.span} flex flex-col justify-between min-h-[180px]`}
            variants={item}
            whileHover={{ x: -2, y: -2 }}
          >
            <div>
              <div className={`w-12 h-12 ${feature.color} brutal-border flex items-center justify-center mb-4`}>
                <feature.icon className="w-6 h-6 text-primary-foreground" strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-bold uppercase tracking-tight">{feature.title}</h3>
              <p className="font-mono text-sm text-muted-foreground mt-1">
                {feature.description}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-4 text-sm font-bold uppercase text-primary group-hover:gap-3 transition-all">
              <span>Open</span>
              <ArrowRight className="w-4 h-4" strokeWidth={3} />
            </div>
          </motion.a>
        ))}
      </motion.div>

      {/* Footer accent */}
      <motion.div
        className="mt-12 flex items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div className="h-3 w-12 bg-primary brutal-border" />
        <div className="h-3 w-8 bg-secondary brutal-border" />
        <div className="h-3 w-5 bg-accent brutal-border" />
      </motion.div>
    </div>
  );
};

export default Dashboard;
