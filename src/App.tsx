import { useState, useEffect } from 'react';
import { Download, CheckCircle, ArrowRight, ArrowLeft, Loader2, FileText, Briefcase, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SYSTEM_INSTRUCTION = `You are RightRole IQ — an intelligent resume optimization engine.
Your job is to analyze a job description and a resume, then produce a strictly honest, deterministic, ATS-aware optimization result.

Primary goals:
- Preserve truth
- Improve clarity and alignment
- Show exactly what changed
- Confirm what qualifications the user ALREADY HAS
- Identify real skills gaps and help prepare for interviews
- Produce a clean, copy-paste-ready resume

ABSOLUTE REQUIREMENT:
Given the SAME job description and SAME resume input, the output MUST be IDENTICAL across runs. No randomness. No variation in wording, counts, gaps, or structure. You are NOT a hype engine. You are NOT allowed to invent, exaggerate, infer, or elevate authority.

OUTPUT FORMAT FOR UI PARSING:
Use EXACT section headers:
[OUTPUT 1: OPTIMIZED RESUME]
[OUTPUT 2: WHAT WE CHANGED]
[OUTPUT 3: YOUR QUALIFICATIONS MATCH]
[OUTPUT 4: SKILLS TO DEVELOP]
[OUTPUT 5: INTERVIEW PREP]

RULES:
- Use these headers EXACTLY as shown, with brackets
- Do NOT add any text before [OUTPUT 1: OPTIMIZED RESUME]
- Do NOT modify header text in any way
- Each section must start with its header on its own line

STRICT HONESTY RULE (CRITICAL):
- Do NOT upgrade vague descriptions into specific methodologies or authority.
- If original says "assisted", do NOT convert to "led"
- If original says "worked with", do NOT convert to "managed"
- If a tool, platform, certification, or degree is not stated, do NOT add it
- Never infer responsibility, ownership, or decision authority
- Quantify ONLY if numbers exist in the original resume
- Never add "In Progress", "Planned", or "Pursuing" unless explicitly stated

CRITICAL MATCHING RULE FOR SKILLS:
A skill counts as PRESENT only if:
1. The exact skill name appears in the resume text (case-insensitive), OR
2. The resume explicitly describes performing that skill's core tasks

SKILL PRESENCE TEST:
Can you copy-paste a sentence from the resume that explicitly shows this skill?
→ YES = PRESENT
→ NO = ABSENT
Do not rely on "context clues" or "likely used it" reasoning.

Examples of INCORRECT matching:
❌ "Windows 10/11 support" does NOT imply "Active Directory administration"
❌ "Office 365 support" does NOT imply "Exchange Online administration"
❌ "Cloud experience" does NOT imply "Azure" or "AWS"
❌ "Database work" does NOT imply specific platform (SQL Server, PostgreSQL, etc.)
❌ "Password resets" does NOT imply "Active Directory domain management"

Examples of CORRECT matching:
✓ Resume says "managed Active Directory" → AD administration is PRESENT
✓ Resume says "created user accounts in AD" → AD administration is PRESENT
✓ Resume says "configured Group Policy objects" → Group Policy is PRESENT
✓ Resume says "troubleshot login issues" → AD administration is ABSENT (support ≠ admin)

When in doubt, mark as ABSENT and flag in gaps.

AUTOMATED SCOPE CEILING CLASSIFICATION:
If NONE appear -> Scope ceiling is LOW -> Use: "supported", "contributed", "assisted", "collaborated"
If SOME appear -> Scope ceiling is MEDIUM -> Reflect coordination or oversight ONLY within stated bounds
If MULTIPLE appear -> Scope ceiling is HIGH -> Reflect management and strategy ONLY where explicitly supported

KEYWORD MATCHING RULES (DETERMINISTIC):
Extract keywords ONLY from the job description: Job titles, Required skills, Named tools/software, Certifications, Degrees, Industry-specific named platforms.
Matching rules: Case-insensitive exact text matching only. Synonyms do NOT count.

OUTPUT 1: OPTIMIZED RESUME
- Format as WORD-COMPATIBLE PLAIN TEXT inside a monospace-rendered UI panel.
- NO Markdown syntax (no ##, **, *, or special markers)
- ALL CAPS for section headers
- Hyphen (-) bullets only
- Single line spacing within sections
- One blank line between sections
- Pure plain text

OUTPUT 2: WHAT WE CHANGED
Minimum: 3 changes | Maximum: 10 changes
FORMAT:
BEFORE: "[Original text]"
AFTER: "[Improved text]"
WHY: [Under 15 words]

OUTPUT 3: YOUR QUALIFICATIONS MATCH
Minimum: 3 | Maximum: 10
ORDER: Education -> Certifications -> Experience -> Skills -> Tools
FORMAT:
✓ [Qualification from resume that matches job requirement]

OUTPUT 4: SKILLS TO DEVELOP
Minimum: 2 | Maximum: 10
Flag a skill as a gap ONLY IF ALL conditions are met:
1. Appears in Required or Preferred qualifications
2. Concrete named entity
3. Does NOT appear anywhere in the resume text
BLOCKLIST: Soft skills, Generic processes, Operational duties, Generic tech concepts without specific tool, Physical requirements, Work environment descriptors, Regulations as knowledge, Methodologies without cert requirement.
DEDUPLICATION RULES: e.g. WMS Systems -> Flag ONLY: "Warehouse Management System (WMS)"
FORMAT:
→ [Gap] — [Brief actionable suggestion]

OUTPUT 5: INTERVIEW PREP
Target: 5 strength questions + 5 gap questions
FORMAT:
Questions to highlight your strengths:
- "[Question]"
→ Your answer: [Specific guidance referencing actual resume content]

Questions to prepare for (based on gaps):
- "[Question]"
→ Suggested approach: [Honest response strategy]

ADAPTIVE BULLET VERBOSITY:
Infer experience level from resume content ONLY.
ENTRY-LEVEL (<=3 yrs): 12-18 words per bullet.
MID-LEVEL (4-8 yrs): 15-22 words per bullet.
SENIOR (9+ yrs): 18-28 words per bullet.

### EXAMPLES OF QUALITY TRANSFORMATIONS:

Example 1:
BEFORE: "IT Support Specialist with over eight years of experience working with business solutions."
AFTER: "IT Support Specialist with over eight years of experience providing technical support, managing ServiceNow ticketing workflows, and administering SQL Server databases."
WHY: Integrated specific hard skills from the resume directly into the summary.

Example 2:
BEFORE: "Respond to tickets via email and remote control software."
AFTER: "Respond to support tickets via email and remote control software, utilizing ServiceNow workflows to manage and prioritize daily requests."
WHY: Connected the existing ServiceNow skill to the daily ticket management responsibility.

Example 3:
BEFORE: "Analyze network performance to improve efficiency."
AFTER: "Analyze network performance metrics to identify potential bottlenecks and improve overall system efficiency for end-users across the organization."
WHY: Expanded to senior-level verbosity to better explain the business value of the task.

Example 4 (Gold Standard — Warehouse):
BEFORE: "Used scanner"
AFTER: "Operated handheld RF scanners to verify inventory accuracy"
WHY: Replaced vague verb with specific equipment and measurable purpose.

Match output pattern: "✓ 2+ years warehouse experience"
Gap output pattern: "→ Forklift Certification — Typically a 1-2 day course; widely available through local community colleges or employers."`;

const SAMPLE_JD = `IT Support Specialist
TechCorp Solutions | Austin, TX | Full-Time

About the Role:
TechCorp Solutions is seeking a skilled IT Support Specialist to join our growing IT department. You will serve as the primary point of contact for all technical support requests, managing day-to-day helpdesk operations while maintaining our enterprise infrastructure.

Key Responsibilities:
- Provide Tier 1 and Tier 2 technical support for 200+ end users across Windows and macOS environments
- Manage and prioritize support tickets using ServiceNow ITSM platform, ensuring SLA compliance
- Administer and maintain Active Directory user accounts, group policies, and access permissions
- Perform SQL Server database queries for reporting and minor administrative tasks
- Troubleshoot hardware, software, network connectivity, and peripheral issues via remote control software and on-site support
- Image, configure, and deploy laptops and desktops for new hire onboarding
- Collaborate with the network team on LAN/WAN connectivity and VPN support
- Document technical procedures and maintain IT asset inventory

Required Qualifications:
- 3+ years of IT support or helpdesk experience
- CompTIA A+ certification required
- Proficiency with ServiceNow or comparable ITSM ticketing system
- Experience with Microsoft Active Directory administration
- Solid understanding of Windows 10/11 and macOS in an enterprise environment
- Familiarity with SQL Server for querying and basic administration

Preferred Qualifications:
- CompTIA Network+ or Microsoft certifications
- Experience with Microsoft Intune or SCCM for endpoint management
- ITIL Foundation certification
- Experience supporting Office 365 and Azure AD environments`;

const SAMPLE_RESUME = `Michael Torres
IT Support Specialist | michael.torres@email.com | (512) 555-0182 | Austin, TX

PROFESSIONAL SUMMARY
IT Support Specialist with 5 years of experience providing technical support in fast-paced corporate environments. Skilled in managing helpdesk operations, resolving hardware and software issues, and working with business solutions to improve operational efficiency.

EXPERIENCE

IT Support Specialist — DataBridge Inc., Austin, TX (2021 – Present)
- Respond to support tickets via email and remote control software for a user base of 150 employees
- Work with ServiceNow to log, track, and close helpdesk requests
- Troubleshoot Windows 10 and macOS issues for end users across multiple departments
- Assist with new hire laptop setup and software installation
- Run SQL Server queries to pull reports for the operations team
- Coordinate with vendors for hardware repairs and warranty replacements

IT Help Desk Technician — Austin Office Pros, Austin, TX (2019 – 2021)
- Provided phone and in-person technical support for 80 users
- Managed ticket queue and escalated complex issues to senior engineers
- Performed routine system maintenance, software updates, and password resets
- Supported Office 365 setup and troubleshooting for end users

SKILLS
- Operating Systems: Windows 10/11, macOS
- Ticketing Systems: ServiceNow
- Database: SQL Server (queries and reporting)
- Remote Support: TeamViewer, Remote Desktop Protocol
- Office 365 administration and user support
- Hardware: Dell, Lenovo, Apple — setup, imaging, and troubleshooting

EDUCATION
Bachelor of Science in Information Technology
University of Texas at Austin — Graduated 2019`;

const LOADING_MESSAGES = [
  'Reading the job description...',
  'Analyzing your qualifications...',
  'Identifying skill gaps...',
  'Preparing interview prep...',
  'Polishing your optimized resume...',
];

const TABS = [
  { id: 1, label: 'Optimized Resume', icon: FileText },
  { id: 2, label: 'What Changed', icon: RefreshCw },
  { id: 3, label: 'Matches', icon: CheckCircle },
  { id: 4, label: 'Skills Gap', icon: AlertCircle },
  { id: 5, label: 'Interview Prep', icon: Briefcase },
];

function ResumePanel({ text }: { text: string }) {
  if (!text) return <div className="text-slate-400 italic">No output generated</div>;
  return (
    <div className="bg-white p-6 sm:p-8 border border-slate-200 shadow-sm rounded-lg whitespace-pre-wrap font-mono text-[13px] sm:text-sm leading-relaxed text-slate-800 overflow-x-auto min-h-[400px]">
      {text}
    </div>
  );
}

function ChangesPanel({ text }: { text: string }) {
    if (!text) return <div className="text-slate-400 italic">No output generated</div>;
    const blocks = text.split(/(?=BEFORE:)/g).filter(b => b.trim().length > 0);
    return (
        <div className="space-y-6">
            {blocks.map((block, i) => {
                const isMatchBlock = block.trim().startsWith('BEFORE:');
                if (!isMatchBlock) {
                    return <div key={i} className="text-gray-800 whitespace-pre-wrap">{block.trim()}</div>;
                }
                const beforeMatch = block.match(/BEFORE:\s*([\s\S]*?)AFTER:/);
                const afterMatch = block.match(/AFTER:\s*([\s\S]*?)WHY:/);
                const whyMatch = block.match(/WHY:\s*([\s\S]*?)$/);

                const beforeText = beforeMatch ? beforeMatch[1].trim() : '';
                const afterText = afterMatch ? afterMatch[1].trim() : '';
                const whyText = whyMatch ? whyMatch[1].trim() : '';

                if (!beforeText && !afterText) {
                    return <div key={i} className="whitespace-pre-wrap text-slate-800">{block}</div>;
                }

                return (
                    <div key={i} className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
                       <div className="p-4 bg-red-50/50 border-b border-red-100">
                         <div className="text-xs font-bold text-red-600 mb-1.5 uppercase tracking-wider">Before</div>
                         <div className="text-red-900 font-mono text-[13px]">{beforeText.replace(/^"|"$/g, '')}</div>
                       </div>
                       <div className="p-4 bg-green-50/50 border-b border-green-100">
                         <div className="text-xs font-bold text-green-600 mb-1.5 uppercase tracking-wider">After</div>
                         <div className="text-green-900 font-mono text-[13px]">{afterText.replace(/^"|"$/g, '')}</div>
                       </div>
                       {whyText && (
                         <div className="p-3 bg-slate-50 border-b border-white text-slate-600 text-sm italic">
                           <span className="font-semibold not-italic">Why: </span>{whyText}
                         </div>
                       )}
                    </div>
                );
            })}
        </div>
    );
}

function DefaultPanel({ text }: { text: string }) {
    if (!text) return <div className="text-slate-400 italic">No output generated</div>;
    return (
        <div className="whitespace-pre-wrap font-sans text-gray-800 space-y-[6px]">
            {text.split('\n').map((line, i) => {
                if (line.trim().startsWith('✓')) {
                    return (
                      <div key={i} className="flex gap-2 items-start py-1">
                        <CheckCircle className="w-5 h-5 text-[#00bfa5] flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700">{line.substring(line.indexOf('✓') + 1).trim()}</span>
                      </div>
                    );
                }
                if (line.trim().startsWith('→')) {
                    return (
                      <div key={i} className="flex gap-2 items-start py-1 p-2 bg-amber-50/50 rounded-lg border border-amber-100/50 font-medium text-slate-800">
                        <ArrowRight className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span>{line.substring(line.indexOf('→') + 1).trim()}</span>
                      </div>
                    );
                }
                if (line.trim().startsWith('-')) {
                     return (
                       <div key={i} className="flex gap-2 items-start ml-4 py-1">
                         <div className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0 mt-2 mr-1" />
                         <span className="text-slate-600 italic leading-relaxed">{line.substring(line.indexOf('-') + 1).trim()}</span>
                       </div>
                    );
                }
                if (line.match(/^Questions to .*:/)) {
                     return <div key={i} className="font-bold text-lg mt-8 mb-4 text-[#1a2744] border-b pb-2 border-slate-100">{line}</div>;
                }
                return <div key={i} className={line.trim() ? "py-1 font-semibold text-slate-800" : ""}>{line}</div>
            })}
        </div>
    );
}

function ProgressPill({ step }: { step: 'jd' | 'resume' | 'results' }) {
  const steps = ['Job Description', 'Your Resume', 'Results'];
  const currentIndex = { jd: 0, resume: 1, results: 2 }[step];
  return (
    <div className="flex items-center justify-center gap-1 mb-10">
      {steps.map((label, i) => {
        const isComplete = i < currentIndex;
        const isActive = i === currentIndex;
        return (
          <div key={label} className="flex items-center gap-1">
            <div className="flex items-center gap-1.5">
              {isComplete ? (
                <CheckCircle className="w-4 h-4 text-[#00bfa5]" />
              ) : (
                <div className={`w-2.5 h-2.5 rounded-full transition-colors ${isActive ? 'bg-[#00bfa5]' : 'border-2 border-slate-300 bg-white'}`} />
              )}
              <span className={`text-sm font-medium hidden sm:inline transition-colors ${isComplete ? 'text-[#00bfa5]' : isActive ? 'text-[#1a2744]' : 'text-slate-400'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="w-6 sm:w-10 h-px bg-slate-200 mx-1" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState<'landing' | 'jd' | 'resume' | 'results'>('landing');
  const [jd, setJd] = useState('');
  const [resume, setResume] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

  useEffect(() => {
    if (!loading) return;
    setLoadingMsgIndex(0);
    const interval = setInterval(() => {
      setLoadingMsgIndex(i => (i + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [loading]);

  const parseResults = (text: string) => {
      const getSect = (curr: string, nextObj?: string) => {
          const start = text.indexOf(curr);
          if (start === -1) return '';
          const offset = start + curr.length;
          if (!nextObj) return text.substring(offset).trim();
          const end = text.indexOf(nextObj, offset);
          if (end === -1) return text.substring(offset).trim();
          return text.substring(offset, end).trim();
      }
      return {
          opt: getSect('[OUTPUT 1: OPTIMIZED RESUME]', '[OUTPUT 2: WHAT WE CHANGED]'),
          changes: getSect('[OUTPUT 2: WHAT WE CHANGED]', '[OUTPUT 3: YOUR QUALIFICATIONS MATCH]'),
          matches: getSect('[OUTPUT 3: YOUR QUALIFICATIONS MATCH]', '[OUTPUT 4: SKILLS TO DEVELOP]'),
          gaps: getSect('[OUTPUT 4: SKILLS TO DEVELOP]', '[OUTPUT 5: INTERVIEW PREP]'),
          prep: getSect('[OUTPUT 5: INTERVIEW PREP]')
      };
  }

  const handleAnalyze = async () => {
      if (!jd.trim() || !resume.trim()) return;
      setLoading(true);
      setResults(null);
      setErrorMsg('');
      setActiveTab(1);

      const prompt = `INSTRUCTIONS:
- Preserve the resume's existing structure, section order, and layout
- Rewrite wording for clarity, professionalism, and ATS keyword alignment
- Where a JD keyword is already contextually present in the resume, use the exact keyword phrasing from the JD in the rewritten bullet
- Do NOT add, remove, or restructure sections
- Do NOT fabricate tools, certifications, degrees, or responsibilities

JOB DESCRIPTION:
${jd}

RESUME:
${resume}

---
STEP 1 — SKILL GAP ANALYSIS (perform this reasoning silently before generating any output):
1. Extract every required and preferred skill/tool/certification from the JOB DESCRIPTION above.
2. For each extracted item, search for EXACT mentions in the RESUME (case-insensitive text match only).
3. Apply the SKILL PRESENCE TEST: Can you find a sentence in the resume that explicitly demonstrates this skill?
4. If the skill name does NOT appear AND no explicit description of performing that skill exists, mark ABSENT.
5. Do NOT infer skills from adjacent work (e.g., Windows support ≠ Active Directory admin, Office 365 support ≠ Exchange admin).
6. Classify each item as: PRESENT | ABSENT (no PARTIAL category).
7. Use PRESENT items to strengthen resume bullets and populate [OUTPUT 3].
8. Use ABSENT items (that pass the BLOCKLIST filter) to populate [OUTPUT 4].
9. Use this gap map to write targeted interview prep in [OUTPUT 5].

When in doubt between PRESENT and ABSENT, always choose ABSENT.

Do NOT include this analysis in your response. Begin your response immediately with [OUTPUT 1: OPTIMIZED RESUME] and no other text.
---
`;

      try {
          const res = await fetch('/api/analyze', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ systemInstruction: SYSTEM_INSTRUCTION, prompt }),
          });

          if (!res.ok) {
              const err = await res.json().catch(() => ({ error: 'Request failed' })) as { error?: string; status?: number };
              if (err.status === 401 || err.status === 403) setErrorMsg('Server API key invalid. Check Cloudflare secret.');
              else if (err.status === 429) setErrorMsg('Rate limit reached. Please wait a moment and try again.');
              else setErrorMsg(err.error || 'Something went wrong. Please try again.');
              return;
          }

          const { text } = await res.json() as { text: string };
          if (text) {
              setResults(text);
              setStep('results');
          } else {
              setErrorMsg('No text generated. Please try again.');
          }
      } catch (e: any) {
          setErrorMsg('Network error. Check your connection and try again.');
      } finally {
          setLoading(false);
      }
  }

  const handleDownload = () => {
      if (!results) return;
      const blob = new Blob([results], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rightroleiq-results-${new Date().getTime()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
  }

  const handleReset = () => {
      setStep('landing');
      setJd('');
      setResume('');
      setResults(null);
      setErrorMsg('');
      setActiveTab(1);
  };

  const parsedData = results ? parseResults(results) : null;

  const slide = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 font-sans selection:bg-[#00bfa5]/20 selection:text-slate-900">
      <header className="bg-[#1a2744] text-white py-4 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-3">
            <Sparkles className="text-[#00bfa5] w-6 h-6 flex-shrink-0" />
            <div className="flex flex-col leading-tight">
              <span className="text-xl font-extrabold tracking-tight text-white">RightRole <span className="text-[#00bfa5]">IQ</span></span>
              <span className="text-[11px] text-slate-400 font-medium tracking-widest uppercase">Know your fit. Close the gaps. Get the role.</span>
            </div>
          </div>
          <div className="text-xs text-slate-400 font-medium tracking-wide hidden sm:block">
            AI-Powered Resume Intelligence
          </div>
        </div>
      </header>

      {/* Loading overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#1a2744]/80 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="bg-white rounded-2xl shadow-xl px-10 py-10 flex flex-col items-center gap-5 max-w-sm mx-4 text-center">
              <Loader2 className="w-10 h-10 text-[#00bfa5] animate-spin" />
              <AnimatePresence mode="wait">
                <motion.p
                  key={loadingMsgIndex}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3 }}
                  className="text-[#1a2744] font-semibold text-base"
                >
                  {LOADING_MESSAGES[loadingMsgIndex]}
                </motion.p>
              </AnimatePresence>
              <p className="text-slate-400 text-sm">This usually takes 5–15 seconds</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-4xl mx-auto px-4 sm:px-6">
        <AnimatePresence mode="wait">

          {/* LANDING */}
          {step === 'landing' && (
            <motion.div
              key="landing"
              variants={slide}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center justify-center text-center min-h-[calc(100vh-80px)] py-16"
            >
              <div className="inline-flex items-center gap-2 bg-[#00bfa5]/10 text-[#00bfa5] text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-8 border border-[#00bfa5]/20">
                <Sparkles className="w-3.5 h-3.5" /> AI-Powered · Honest · Actionable
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-2xl mb-6">
                See how your resume<br />actually stacks up
              </h1>
              <p className="text-lg text-slate-500 max-w-2xl mb-10 leading-relaxed">
                Paste a job description and your resume. Get an honest gap analysis, an optimized rewrite, and interview prep — all in under a minute.
              </p>
              <button
                onClick={() => setStep('jd')}
                className="bg-[#00bfa5] hover:bg-[#00a892] text-white font-bold text-lg py-4 px-10 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] w-full max-w-[280px]"
              >
                Analyze My Resume
              </button>
              <button
                onClick={() => { setJd(SAMPLE_JD); setResume(SAMPLE_RESUME); setStep('jd'); }}
                className="mt-4 text-slate-400 hover:text-[#00bfa5] text-sm font-medium transition-colors"
              >
                Try with sample inputs →
              </button>
            </motion.div>
          )}

          {/* JD STEP */}
          {step === 'jd' && (
            <motion.div
              key="jd"
              variants={slide}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="py-12"
            >
              <ProgressPill step="jd" />
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
                <div className="mb-4">
                  <label className="text-lg font-bold text-[#1a2744] block mb-1">Paste the job description</label>
                  <p className="text-sm text-slate-400">The more complete the JD, the sharper your analysis. Aim for 200+ words.</p>
                </div>
                <textarea
                  value={jd}
                  onChange={e => setJd(e.target.value)}
                  className="w-full h-96 p-4 rounded-xl border border-slate-300 focus:border-[#00bfa5] focus:ring-1 focus:ring-[#00bfa5] outline-none resize-none font-sans text-sm shadow-inner bg-slate-50/50 transition-all placeholder:text-slate-400"
                  placeholder="Paste the full job description here — responsibilities, requirements, qualifications..."
                  autoFocus
                />
                <div className="flex items-center justify-between mt-2 mb-6">
                  <span className="text-xs text-slate-400">{jd.length} characters</span>
                  {jd.length > 0 && jd.length < 150 && (
                    <span className="text-xs text-amber-500">Add more detail for best results</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setStep('landing')}
                    className="flex items-center gap-1.5 text-slate-500 hover:text-[#1a2744] font-semibold text-sm transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    onClick={() => setStep('resume')}
                    disabled={jd.trim().length < 150}
                    className="bg-[#00bfa5] hover:bg-[#00a892] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-xl transition-all"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* RESUME STEP */}
          {step === 'resume' && (
            <motion.div
              key="resume"
              variants={slide}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="py-12"
            >
              <ProgressPill step="resume" />
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
                <div className="mb-4">
                  <label className="text-lg font-bold text-[#1a2744] block mb-1">Paste your current resume</label>
                  <p className="text-sm text-slate-400">Plain text works best. We'll handle formatting.</p>
                </div>
                <textarea
                  value={resume}
                  onChange={e => setResume(e.target.value)}
                  className="w-full h-96 p-4 rounded-xl border border-slate-300 focus:border-[#00bfa5] focus:ring-1 focus:ring-[#00bfa5] outline-none resize-none font-sans text-sm shadow-inner bg-slate-50/50 transition-all placeholder:text-slate-400"
                  placeholder="Paste your resume as plain text here..."
                  autoFocus
                />
                <div className="flex items-center justify-between mt-2 mb-6">
                  <span className="text-xs text-slate-400">{resume.length} characters</span>
                  {resume.length > 0 && resume.length < 100 && (
                    <span className="text-xs text-amber-500">Resume seems short — paste more content</span>
                  )}
                </div>
                {errorMsg && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                    {errorMsg}
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setStep('jd')}
                    className="flex items-center gap-1.5 text-slate-500 hover:text-[#1a2744] font-semibold text-sm transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    onClick={handleAnalyze}
                    disabled={resume.trim().length < 100}
                    className="bg-[#00bfa5] hover:bg-[#00a892] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-xl transition-all"
                  >
                    Analyze Resume
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* RESULTS STEP */}
          {step === 'results' && parsedData && (
            <motion.div
              key="results"
              variants={slide}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="py-12"
            >
              <ProgressPill step="results" />
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#1a2744]">Here's your analysis</h2>
                <button
                  onClick={handleReset}
                  className="text-sm font-semibold text-slate-500 hover:text-[#1a2744] border border-slate-200 hover:border-slate-400 px-4 py-2 rounded-lg transition-all"
                >
                  Start over
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="border-b border-slate-200 bg-slate-50 p-2 sm:p-0">
                  <div className="flex flex-wrap sm:flex-nowrap sm:overflow-x-auto no-scrollbar">
                    {TABS.map(tab => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`group flex items-center gap-2 px-4 py-3 sm:py-5 text-sm font-bold transition-all duration-150 whitespace-nowrap sm:border-b-2 sm:flex-1 justify-center sm:rounded-none rounded-lg w-full sm:w-auto mb-1 sm:mb-0 cursor-pointer
                            ${isActive
                              ? 'text-[#1a2744] sm:border-[#00bfa5] bg-white sm:bg-transparent shadow-sm sm:shadow-none'
                              : 'text-slate-500 border-transparent hover:text-[#1a2744] hover:bg-white hover:shadow-sm sm:hover:border-slate-300 hover:scale-[1.02]'}
                          `}
                        >
                          <Icon className={`w-4 h-4 transition-colors duration-150 ${isActive ? 'text-[#00bfa5]' : 'text-slate-400 group-hover:text-[#00bfa5]'}`} />
                          <span className={`transition-colors duration-150 ${isActive ? '' : 'group-hover:text-[#1a2744]'}`}>{tab.label}</span>
                          {!isActive && (
                            <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-[#00bfa5] opacity-0 group-hover:opacity-100 transition-opacity duration-150 ml-0.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="p-6 md:p-8 relative">
                  <div className="flex justify-end mb-6 absolute top-4 right-4 sm:top-6 sm:right-8 z-10">
                    <button onClick={handleDownload} className="flex items-center shadow-sm gap-2 text-sm font-semibold text-[#1a2744] hover:text-white transition-colors bg-white hover:bg-[#1a2744] border border-slate-200 px-4 py-2 rounded-full">
                      <Download className="w-4 h-4" /> Download All
                    </button>
                  </div>
                  <div className="mt-8 sm:mt-12 min-h-[400px]">
                    {activeTab === 1 && <ResumePanel text={parsedData.opt} />}
                    {activeTab === 2 && <ChangesPanel text={parsedData.changes} />}
                    {activeTab === 3 && <DefaultPanel text={parsedData.matches} />}
                    {activeTab === 4 && <DefaultPanel text={parsedData.gaps} />}
                    {activeTab === 5 && <DefaultPanel text={parsedData.prep} />}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
