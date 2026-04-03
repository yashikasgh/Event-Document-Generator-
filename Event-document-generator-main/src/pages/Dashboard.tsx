import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  Calendar,
  CalendarRange,
  FileBarChart,
  FileText,
  Image,
  ListChecks,
  LogOut,
  Mail,
  Search,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

const navTabs = ["Overview", "Reports", "Planning"] as const;
const workspaceTabs = ["Documents", "Attendance", "Planning", "Events"] as const;

const featureCards = [
  {
    title: "Proposal Generator",
    description: "Formal approvals, structured body text, and downloadable PDFs.",
    icon: FileText,
    color: "bg-primary",
    href: "/generate/proposal",
    category: "Documents",
  },
  {
    title: "Flyer Generator",
    description: "Theme-driven prompts for Gemini-backed creative generation.",
    icon: Image,
    color: "bg-secondary",
    href: "/generate/flyer",
    category: "Documents",
  },
  {
    title: "Attendance Sheets",
    description: "Upload Excel or CSV, filter students, and export printable sheets.",
    icon: Users,
    color: "bg-accent",
    href: "/generate/attendance",
    category: "Attendance",
  },
  {
    title: "Event Reports",
    description: "Detailed reports with highlights, outcomes, and data sections.",
    icon: FileBarChart,
    color: "bg-primary",
    href: "/generate/report",
    category: "Documents",
  },
  {
    title: "Budget Estimation",
    description: "Projected totals, contingency, sponsorship effect, and insights.",
    icon: Wallet,
    color: "bg-secondary",
    href: "/generate/budget",
    category: "Planning",
  },
  {
    title: "Activity Timelines",
    description: "Milestones for approval, outreach, execution, and follow-up.",
    icon: ListChecks,
    color: "bg-accent",
    href: "/generate/timeline",
    category: "Planning",
  },
  {
    title: "Post-Event Summary",
    description: "Attendance rate, spend variance, and improvement recommendations.",
    icon: CalendarRange,
    color: "bg-primary",
    href: "/generate/summary",
    category: "Planning",
  },
  {
    title: "Event Workspace",
    description: "Track linked documents and event records in one place.",
    icon: Calendar,
    color: "bg-secondary",
    href: "/events",
    category: "Events",
  },
];

const agendaItems = [
  {
    title: "Proposal Review Window",
    time: "09:00 AM - 10:00 AM",
    tone: "border-primary/50 text-primary",
  },
  {
    title: "Flyer Content Freeze",
    time: "11:00 AM - 12:30 PM",
    tone: "border-secondary/60 text-secondary",
  },
  {
    title: "Volunteer Coordination",
    time: "02:00 PM - 03:30 PM",
    tone: "border-accent/60 text-accent",
  },
];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState<(typeof navTabs)[number]>("Overview");
  const [activeWorkspace, setActiveWorkspace] = useState<(typeof workspaceTabs)[number]>("Documents");
  const [query, setQuery] = useState("");

  const fullName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "DocuPrint User";
  const initials = fullName
    .split(" ")
    .map((chunk: string) => chunk[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const filteredCards = featureCards.filter((card) => {
    const matchesCategory =
      activeWorkspace === "Documents"
        ? card.category === "Documents"
        : card.category === activeWorkspace;
    const matchesSearch =
      !query ||
      card.title.toLowerCase().includes(query.toLowerCase()) ||
      card.description.toLowerCase().includes(query.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen px-4 py-4 md:px-8 md:py-8">
      <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[34px] brutal-border bg-card xl:grid-cols-[1.65fr_0.95fr]">
        <section className="bg-[hsl(180_27%_94%)]/60 p-5 md:p-8 xl:p-10">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-card brutal-border">
                  <div className="h-10 w-10 rounded-full bg-foreground" />
                </div>
                <div className="flex flex-wrap gap-5">
                  {navTabs.map((tab) => (
                    <button key={tab} onClick={() => setActiveNav(tab)} className="group text-left">
                      <p className={`text-sm font-bold ${activeNav === tab ? "text-foreground" : "text-muted-foreground"}`}>{tab}</p>
                      <div className={`mt-2 h-1 rounded-full transition-all ${activeNav === tab ? "w-6 bg-primary" : "w-0 bg-primary group-hover:w-6"}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="flex min-w-[240px] items-center gap-3 rounded-full bg-card px-5 py-3 brutal-border md:min-w-[330px]">
                  <Search className="h-4 w-4 text-muted-foreground" strokeWidth={2.5} />
                  <input
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    placeholder="Search generators"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </label>
                <Link to="/events" className="brutal-btn-outline flex items-center justify-center gap-2 py-3">
                  Manage
                  <ArrowRight className="h-4 w-4" strokeWidth={3} />
                </Link>
              </div>
            </div>

            <div className="pt-6 md:pt-10">
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Main Dashboard</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                A structured command center for event documentation, planning, attendance handling, and post-event reporting.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2">
              {workspaceTabs.map((tab) => (
                <button key={tab} onClick={() => setActiveWorkspace(tab)} className="group text-left">
                  <p className={`text-sm font-bold ${activeWorkspace === tab ? "text-foreground" : "text-muted-foreground"}`}>{tab}</p>
                  <div className={`mt-2 h-1 rounded-full transition-all ${activeWorkspace === tab ? "w-8 bg-accent" : "w-0 bg-accent group-hover:w-8"}`} />
                </button>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-[0.95fr_0.95fr_1.3fr]">
              <div className="brutal-border rounded-[26px] bg-card p-5">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Today&apos;s Output</p>
                <p className="mt-3 text-4xl font-bold">07</p>
                <p className="mt-2 text-sm text-muted-foreground">Documents generated across proposal, report, and attendance flows.</p>
              </div>

              <div className="rounded-[26px] bg-secondary p-5 brutal-border text-secondary-foreground">
                <p className="font-mono text-xs uppercase tracking-[0.2em]">Active Events</p>
                <p className="mt-3 text-4xl font-bold">20</p>
                <p className="mt-2 text-sm text-secondary-foreground/80">Current projects being planned, reviewed, or closed.</p>
              </div>

              <div className="relative min-h-[190px] overflow-hidden rounded-[26px] bg-[linear-gradient(160deg,hsl(180_40%_96%),hsl(180_22%_88%))] brutal-border p-5">
                <div className="absolute right-5 top-5 rounded-full bg-card/90 p-3 brutal-border">
                  <Sparkles className="h-4 w-4 text-primary" strokeWidth={2.5} />
                </div>
                <div className="flex h-full flex-col justify-between">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Workspace Highlight</p>
                    <h3 className="mt-3 max-w-xs text-2xl font-bold uppercase">Generate every event document from one smooth workspace</h3>
                  </div>
                  <div className="mt-6 flex items-end justify-between gap-4">
                    <p className="max-w-sm text-sm leading-7 text-muted-foreground">Switch between proposals, flyers, budget planning, and summaries without losing the current theme or rhythm of the product.</p>
                    <Link to="/generate/proposal" className="brutal-btn-primary px-4 py-3 text-xs">
                      Open Flow
                    </Link>
                  </div>
                </div>
              </div>

              <div className="rounded-[26px] bg-accent p-5 brutal-border text-accent-foreground md:col-span-1">
                <p className="text-4xl font-bold">20% OFF</p>
                <p className="mt-2 text-sm text-accent-foreground/85">Save time on repetitive event paperwork with one connected workflow.</p>
                <Link to="/generate/flyer" className="mt-6 inline-flex rounded-full border-2 border-accent-foreground/70 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em]">
                  Try Flyer
                </Link>
              </div>

              <div className="rounded-[26px] bg-card p-5 brutal-border md:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Active Workspace</p>
                    <h3 className="mt-2 text-2xl font-bold uppercase">{activeWorkspace}</h3>
                  </div>
                  <Link to="/profile" className="text-sm font-bold uppercase text-primary underline underline-offset-4">
                    Open Profile
                  </Link>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {filteredCards.slice(0, 4).map((card) => (
                    <Link key={card.title} to={card.href} className="group rounded-[24px] bg-background p-5 brutal-border transition-transform hover:-translate-y-1">
                      <div className={`flex h-12 w-12 items-center justify-center ${card.color} brutal-border`}>
                        <card.icon className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
                      </div>
                      <h4 className="mt-5 text-lg font-bold uppercase">{card.title}</h4>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">{card.description}</p>
                      <div className="mt-5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                        Open
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={3} />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="text-3xl font-bold tracking-tight">Active Bookings</h2>
                <Link to="/events" className="text-sm font-bold uppercase text-primary underline underline-offset-4">
                  Check All
                </Link>
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                {[
                  {
                    title: "Award Ceremony",
                    time: "12:30 - 15:45",
                    tags: ["Team", "Meeting"],
                  },
                  {
                    title: "Design Discussion",
                    time: "16:30 - 20:00",
                    tags: ["Team", "Meeting"],
                  },
                ].map((item, index) => (
                  <motion.div key={item.title} className="rounded-[28px] bg-card p-6 brutal-border" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * index }}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-2xl font-bold">{item.title}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">{item.time}</p>
                      </div>
                      <button className="h-6 w-12 rounded-full bg-muted p-1 brutal-border">
                        <div className="ml-auto h-4 w-4 rounded-full bg-accent" />
                      </button>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <span key={tag} className="rounded-full border-2 border-foreground/10 bg-muted/40 px-3 py-1 text-xs font-bold uppercase">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="mt-8 flex items-center justify-between">
                      <div className="flex -space-x-3">
                        {["A", "R", "+2"].map((avatar) => (
                          <div key={avatar} className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary brutal-border text-sm font-bold text-secondary-foreground">
                            {avatar}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-3">
                        <Link to="/events" className="flex h-11 w-11 items-center justify-center rounded-full bg-card brutal-border">
                          <Search className="h-4 w-4" strokeWidth={2.5} />
                        </Link>
                        <Link to="/generate/summary" className="flex h-11 w-11 items-center justify-center rounded-full bg-foreground brutal-border text-primary-foreground">
                          <ArrowRight className="h-4 w-4" strokeWidth={3} />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <aside className="bg-card p-5 md:p-8">
          <div className="flex items-start justify-between gap-4 border-b-2 border-foreground/10 pb-6">
            <div className="flex gap-3 text-foreground">
              <button className="rounded-full bg-background p-3 brutal-border">
                <Mail className="h-5 w-5" strokeWidth={2.2} />
              </button>
              <button className="rounded-full bg-background p-3 brutal-border">
                <Bell className="h-5 w-5" strokeWidth={2.2} />
              </button>
            </div>
            <Link to="/profile" className="flex items-center gap-3 rounded-full bg-background px-3 py-2 brutal-border">
              <div className="text-right">
                <p className="text-lg font-bold">{fullName}</p>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Workspace Admin</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary brutal-border text-lg font-bold text-primary-foreground">
                {initials}
              </div>
            </Link>
          </div>

          <div className="pt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-4xl font-bold leading-none">
                Jan, 21 <span className="font-normal text-muted-foreground">Tuesday</span>
              </h2>
              <button onClick={handleSignOut} className="rounded-full bg-background p-3 brutal-border" title="Sign out">
                <LogOut className="h-5 w-5" strokeWidth={2.3} />
              </button>
            </div>

            <div className="mt-8 grid grid-cols-7 gap-3 text-center">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <p key={day} className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {day}
                </p>
              ))}
              {[31, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 25, 26, 27, 28, 29].map((date) => {
                const active = [10, 12, 20, 21].includes(date);
                const palette =
                  date === 20 ? "bg-secondary text-secondary-foreground" : date === 21 ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground";
                return (
                  <button
                    key={date}
                    className={`flex h-12 items-center justify-center rounded-full text-lg font-bold ${active ? `${palette} brutal-border` : "text-foreground/80"}`}
                  >
                    {date}
                  </button>
                );
              })}
            </div>

            <div className="mt-10 space-y-5">
              {agendaItems.map((item) => (
                <button
                  key={item.title}
                  className={`w-full rounded-[24px] border-2 bg-background px-5 py-5 text-left transition-transform hover:-translate-y-1 ${item.tone}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xl font-bold">{item.title}</p>
                    <ArrowRight className="h-4 w-4" strokeWidth={3} />
                  </div>
                  <p className="mt-2 font-mono text-sm uppercase tracking-[0.12em]">{item.time}</p>
                </button>
              ))}
            </div>

            <div className="mt-8 rounded-[28px] bg-[hsl(180_27%_94%)] p-5 brutal-border">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Quick Access</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Link to="/generate/report" className="brutal-btn-primary text-center py-3">
                  Report
                </Link>
                <Link to="/generate/budget" className="brutal-btn-secondary text-center py-3">
                  Budget
                </Link>
                <Link to="/generate/attendance" className="brutal-btn-outline text-center py-3">
                  Attendance
                </Link>
                <Link to="/profile" className="brutal-btn-outline text-center py-3">
                  Profile
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
