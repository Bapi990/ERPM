export interface DimensionScores {
  focus_results: number;
  work_discipline: number;
  accountability: number;
  punctuality: number;
  innovation: number;
  teamwork: number;
  respect_openness: number;
  problem_solving: number;
  communication: number;
}

export interface EmployeePerformanceEvaluation {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode?: string;
  employeeRole?: string;
  employeeDepartment?: string;
  employeeBranch?: string;
  employeeShift?: string;
  assignedHr?: string;
  joinedDate?: string;
  avatarUrl?: string;

  scores: DimensionScores;
  overallScore: number;
  ratingBadge: string;

  keyStrengths?: string;
  areasForImprovement?: string;
  feedbackNotes: string;

  evaluatorId: string;
  evaluatorName: string;
  evaluatorRole: string;
  evaluatedAt: string;
}

export interface DimensionConfig {
  key: keyof DimensionScores;
  num: number;
  title: string;
  description: string;
  iconName: string;
  colorName: string;
  badgeBg: string;
  badgeText: string;
  borderHover: string;
  themeHex: string;
}

export const DIMENSIONS_CONFIG: DimensionConfig[] = [
  {
    key: 'focus_results',
    num: 1,
    title: 'Focus on Results',
    description: 'Maintains high standards through effective prioritisation and resource allocation to achieve impactful and timely results.',
    iconName: 'Target',
    colorName: 'emerald',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    borderHover: 'hover:border-emerald-400',
    themeHex: '#10b981'
  },
  {
    key: 'work_discipline',
    num: 2,
    title: 'Work Discipline',
    description: 'Exemplifies steadfast commitment and diligence, setting a benchmark for work ethic and dependability.',
    iconName: 'Briefcase',
    colorName: 'blue',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    borderHover: 'hover:border-blue-400',
    themeHex: '#3b82f6'
  },
  {
    key: 'accountability',
    num: 3,
    title: 'Accountability with Discipline',
    description: 'Cultivates a high-trust environment through ownership, integrity, and proactive problem-solving.',
    iconName: 'Shield',
    colorName: 'purple',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    borderHover: 'hover:border-purple-400',
    themeHex: '#8b5cf6'
  },
  {
    key: 'punctuality',
    num: 4,
    title: 'Timing / Punctuality',
    description: 'Respects commitments, values punctuality, and meets all deadlines consistently.',
    iconName: 'Clock',
    colorName: 'amber',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    borderHover: 'hover:border-amber-400',
    themeHex: '#f59e0b'
  },
  {
    key: 'innovation',
    num: 5,
    title: 'Innovation & Entrepreneurship',
    description: 'Drives progress through calculated risk-taking, continuous improvement, and scalable innovation.',
    iconName: 'Lightbulb',
    colorName: 'pink',
    badgeBg: 'bg-pink-50',
    badgeText: 'text-pink-700',
    borderHover: 'hover:border-pink-400',
    themeHex: '#ec4899'
  },
  {
    key: 'teamwork',
    num: 6,
    title: 'Teamwork & Collaboration',
    description: 'Fosters a collaborative environment, driving team synergy and collective success.',
    iconName: 'Users',
    colorName: 'sky',
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-700',
    borderHover: 'hover:border-sky-400',
    themeHex: '#0ea5e9'
  },
  {
    key: 'respect_openness',
    num: 7,
    title: 'Respect and Openness',
    description: 'Cultivates an inclusive environment by actively listening, showing empathy, and embracing diverse perspectives.',
    iconName: 'Heart',
    colorName: 'rose',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    borderHover: 'hover:border-rose-400',
    themeHex: '#f43f5e'
  },
  {
    key: 'problem_solving',
    num: 8,
    title: 'Problem Solving & Decision Making',
    description: 'Tackles complex challenges with clear analytical thinking and delivers impactful solutions.',
    iconName: 'Puzzle',
    colorName: 'teal',
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-700',
    borderHover: 'hover:border-teal-400',
    themeHex: '#14b8a6'
  },
  {
    key: 'communication',
    num: 9,
    title: 'Communication & Interpersonal Skills',
    description: 'Fosters clear, empathetic communication, building strong connections and shared understanding across teams.',
    iconName: 'MessageSquare',
    colorName: 'indigo',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    borderHover: 'hover:border-indigo-400',
    themeHex: '#6366f1'
  }
];

export const calculateOverallScore = (scores: DimensionScores): number => {
  const values = Object.values(scores);
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, curr) => acc + (Number(curr) || 0), 0);
  const avg = sum / values.length;
  return Number(avg.toFixed(1));
};

export const getRatingBadge = (score: number): { label: string; colorClass: string } => {
  if (score <= 0) {
    return { label: 'Pending Evaluation', colorClass: 'bg-slate-100 text-slate-700 border-slate-300' };
  }
  if (score < 2.5) {
    return { label: 'Needs Improvement', colorClass: 'bg-rose-50 text-rose-700 border-rose-200' };
  }
  if (score < 3.5) {
    return { label: 'Meets Expectations', colorClass: 'bg-amber-50 text-amber-700 border-amber-200' };
  }
  if (score < 4.5) {
    return { label: 'Exceeds Expectations', colorClass: 'bg-blue-50 text-blue-700 border-blue-200' };
  }
  return { label: 'Outstanding Performer', colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
};
