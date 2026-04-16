import { useState } from 'react';
import { Download, CheckCircle, ArrowRight, Loader2, FileText, Briefcase, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
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

export default function App() {
  const [jd, setJd] = useState('');
  const [resume, setResume] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');

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
2. For each extracted item, check whether it appears (case-insensitive) anywhere in the RESUME above.
3. Classify each item as: PRESENT | ABSENT | PARTIAL.
4. Use PRESENT items to strengthen resume bullets and populate [OUTPUT 3].
5. Use ABSENT items (that pass the BLOCKLIST filter) to populate [OUTPUT 4].
6. Use this gap map to write targeted interview prep in [OUTPUT 5].
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
          if (text) setResults(text);
          else setErrorMsg('No text generated. Please try again.');
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
      a.download = `jobfit-results-${new Date().getTime()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
  }

  const parsedData = results ? parseResults(results) : null;

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 font-sans selection:bg-[#00bfa5]/20 selection:text-slate-900">
      <header className="bg-[#1a2744] text-white py-4 shadow-md sticky top-0 z-50">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="space-y-2">
                <label className="font-semibold text-slate-700 flex justify-between tracking-tight text-sm uppercase">
                  Job Description
                  <span className="text-xs text-slate-400 font-normal mt-[1px] normal-case tracking-normal">Paste JD here</span>
                </label>
                <textarea 
                   value={jd} 
                   onChange={e => setJd(e.target.value)} 
                   className="w-full h-80 p-4 rounded-xl border border-slate-300 focus:border-[#00bfa5] focus:ring-1 focus:ring-[#00bfa5] outline-none resize-none font-sans text-sm shadow-inner bg-slate-50/50 transition-all placeholder:text-slate-400"
                   placeholder="Key responsibilities, requirements, qualifications..."
                />
              </div>
              <div className="space-y-2">
                <label className="font-semibold text-slate-700 flex justify-between tracking-tight text-sm uppercase">
                  Current Resume
                  <span className="text-xs text-slate-400 font-normal mt-[1px] normal-case tracking-normal">Paste plain text</span>
                </label>
                <textarea 
                   value={resume} 
                   onChange={e => setResume(e.target.value)} 
                   className="w-full h-80 p-4 rounded-xl border border-slate-300 focus:border-[#00bfa5] focus:ring-1 focus:ring-[#00bfa5] outline-none resize-none font-sans text-sm shadow-inner bg-slate-50/50 transition-all placeholder:text-slate-400"
                   placeholder="John Doe&#10;Software Engineer&#10;&#10;Experience&#10;- Built web applications..."
                />
              </div>
           </div>
           
           {errorMsg && (
             <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm whitespace-pre-wrap">
                {errorMsg}
             </div>
           )}

           <button 
              onClick={handleAnalyze} 
              disabled={loading || !jd.trim() || !resume.trim()}
              className="w-full bg-[#00bfa5] hover:bg-[#00a892] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-lg py-4 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2"
           >
              {loading ? (
                 <>
                   <Loader2 className="animate-spin w-5 h-5 flex-shrink-0" />
                   Analyzing & Optimizing...
                 </>
              ) : (
                 <>
                   Analyze Resume
                 </>
              )}
           </button>
        </div>

        <AnimatePresence>
          {parsedData && (
              <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -20 }}
                 className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
              >
                  <div className="border-b border-slate-200 bg-slate-50 p-2 sm:p-0">
                     <div className="flex flex-wrap sm:flex-nowrap sm:overflow-x-auto no-scrollbar">
                        {TABS.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                  key={tab.id}
                                  onClick={() => setActiveTab(tab.id)}
                                  className={`flex items-center gap-2 px-4 py-3 sm:py-5 text-sm font-bold transition-all whitespace-nowrap sm:border-b-2 sm:flex-1 justify-center sm:rounded-none rounded-lg w-full sm:w-auto mb-1 sm:mb-0
                                      ${isActive ? 'text-[#1a2744] sm:border-[#00bfa5] bg-white sm:bg-transparent shadow-sm sm:shadow-none translate-y-[-1px] sm:translate-y-0' : 'text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-100'}
                                  `}
                                >
                                   <Icon className={`w-4 h-4 ${isActive ? 'text-[#00bfa5]' : 'opacity-70'}`} />
                                   {tab.label}
                                </button>
                            )
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
              </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
