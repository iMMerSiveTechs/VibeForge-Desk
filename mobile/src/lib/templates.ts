import type { ItemKind } from './constants';

export interface EditorTemplate {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide icon name (we'll map it in UI)
  suggestedKind: ItemKind;
  titleTemplate: string;
  bodyTemplate: string;
  category: 'Daily' | 'Weekly' | 'Project' | 'Personal' | 'Pro' | 'Journal' | 'Plus';
}

export const TEMPLATES: EditorTemplate[] = [
  // ---- DAILY ----
  {
    id: 'daily-review',
    name: 'Daily Review',
    description: 'End-of-day reflection and planning',
    icon: 'Sun',
    suggestedKind: 'plan',
    category: 'Daily',
    titleTemplate: 'Daily Review — [date]',
    bodyTemplate: '## WINS TODAY\n1. \n2. \n3. \n\n## CHALLENGES\n\n\n## LESSONS LEARNED\n\n\n## ENERGY LEVEL\n[1-10]: \n\n## TOMORROW\'S FOCUS\n\n',
  },
  {
    id: 'habit-tracker',
    name: 'Habit Tracker',
    description: 'Daily habit check-in',
    icon: 'Target',
    suggestedKind: 'task',
    category: 'Daily',
    titleTemplate: 'Habits — [date]',
    bodyTemplate: '',
  },
  {
    id: 'meal-plan',
    name: 'Meal Plan',
    description: 'Plan meals for the day or week',
    icon: 'UtensilsCrossed',
    suggestedKind: 'note',
    category: 'Daily',
    titleTemplate: 'Meal Plan — [date]',
    bodyTemplate: '## BREAKFAST\n\n\n## LUNCH\n\n\n## DINNER\n\n\n## SNACKS\n\n\n## WATER INTAKE\nGoal: 8 glasses\nActual: \n\n## GROCERY NOTES\n',
  },
  {
    id: 'mood-checkin',
    name: 'Mood Check-in',
    description: 'Daily emotional wellness check',
    icon: 'Heart',
    suggestedKind: 'sticky',
    category: 'Daily',
    titleTemplate: 'Mood — [date]',
    bodyTemplate: 'Overall mood [1-10]: \n\nFeel: \n\nGrateful for: \n\nStressed about: \n\nSelf-care today: \n',
  },

  // ---- WEEKLY ----
  {
    id: 'weekly-review',
    name: 'Weekly Review',
    description: 'Weekly reflection, goals, and planning',
    icon: 'Calendar',
    suggestedKind: 'plan',
    category: 'Weekly',
    titleTemplate: 'Weekly Review — Week of [date]',
    bodyTemplate: '## ACCOMPLISHMENTS\n- \n- \n\n## INCOMPLETE\n- \n- \n\n## BLOCKERS\n\n\n## KEY METRICS\n\n\n## NEXT WEEK PRIORITIES\n1. \n2. \n3. \n\n## NOTES\n',
  },
  {
    id: 'shopping-list',
    name: 'Shopping List',
    description: 'Organized shopping checklist',
    icon: 'ShoppingCart',
    suggestedKind: 'task',
    category: 'Weekly',
    titleTemplate: 'Shopping List',
    bodyTemplate: '',
  },
  {
    id: 'workout-log',
    name: 'Workout Log',
    description: 'Track exercises, sets, and reps',
    icon: 'Dumbbell',
    suggestedKind: 'note',
    category: 'Weekly',
    titleTemplate: 'Workout — [date]',
    bodyTemplate: '## WARM UP\n\n\n## WORKOUT\nExercise 1: \n  Sets/Reps: \n  Weight: \n\nExercise 2: \n  Sets/Reps: \n  Weight: \n\nExercise 3: \n  Sets/Reps: \n  Weight: \n\n## CARDIO\nType: \nDuration: \n\n## NOTES\nEnergy: [1-10]\nSoreness: \n',
  },

  // ---- PROJECT ----
  {
    id: 'project-brief',
    name: 'Project Brief',
    description: 'Define project scope, goals, and deliverables',
    icon: 'Briefcase',
    suggestedKind: 'plan',
    category: 'Project',
    titleTemplate: 'Project Brief — [Project Name]',
    bodyTemplate: '## OBJECTIVE\n\n\n## SCOPE\n\n\n## KEY DELIVERABLES\n1. \n2. \n3. \n\n## TIMELINE\nStart: \nEnd: \nMilestones: \n\n## STAKEHOLDERS\n\n\n## RISKS\n\n\n## SUCCESS CRITERIA\n',
  },
  {
    id: 'kanban-mini',
    name: 'Kanban Board',
    description: 'Simple 3-column task board',
    icon: 'Columns3',
    suggestedKind: 'note',
    category: 'Project',
    titleTemplate: 'Kanban — [Project]',
    bodyTemplate: '## TO DO\n- \n- \n- \n\n## IN PROGRESS\n- \n- \n\n## DONE\n- \n- \n',
  },
  {
    id: 'meeting-minutes',
    name: 'Meeting Minutes',
    description: 'Record meeting notes with attendees, agenda, and action items',
    icon: 'Users',
    suggestedKind: 'note',
    category: 'Project',
    titleTemplate: 'Meeting — [Topic]',
    bodyTemplate: 'Date: [date]\nAttendees: \n\n## AGENDA\n1. \n2. \n3. \n\n## DISCUSSION\n\n\n## ACTION ITEMS\n- [ ] \n- [ ] \n\n## NEXT MEETING\nDate: \nTopics: \n',
  },
  {
    id: 'decision-log',
    name: 'Decision Log',
    description: 'Document and track important decisions',
    icon: 'Scale',
    suggestedKind: 'note',
    category: 'Project',
    titleTemplate: 'Decision — [Topic]',
    bodyTemplate: 'Date: [date]\nDecision maker: \n\n## CONTEXT\n\n\n## OPTIONS CONSIDERED\n1. \n2. \n3. \n\n## DECISION\n\n\n## RATIONALE\n\n\n## FOLLOW-UP ACTIONS\n- \n- \n',
  },

  // ---- PERSONAL ----
  {
    id: 'brain-dump',
    name: 'Brain Dump',
    description: 'Get everything out of your head',
    icon: 'Brain',
    suggestedKind: 'sticky',
    category: 'Personal',
    titleTemplate: 'Brain Dump',
    bodyTemplate: '',
  },
  {
    id: 'idea-pitch',
    name: 'Idea Pitch',
    description: 'Structure a new idea or pitch',
    icon: 'Lightbulb',
    suggestedKind: 'plan',
    category: 'Personal',
    titleTemplate: 'Idea — [Name]',
    bodyTemplate: '## THE PROBLEM\n\n\n## THE SOLUTION\n\n\n## WHY NOW\n\n\n## TARGET AUDIENCE\n\n\n## COMPETITIVE ADVANTAGE\n\n\n## NEXT STEPS\n1. \n2. \n3. \n',
  },
  {
    id: 'reading-notes',
    name: 'Reading Notes',
    description: 'Notes from books, articles, or papers',
    icon: 'BookOpen',
    suggestedKind: 'note',
    category: 'Personal',
    titleTemplate: 'Reading — [Title]',
    bodyTemplate: 'Author: \nSource: \n\n## KEY IDEAS\n1. \n2. \n3. \n\n## QUOTES\n> \n\n## MY THOUGHTS\n\n\n## ACTION ITEMS\n- \n',
  },
  {
    id: 'travel-plan',
    name: 'Travel Plan',
    description: 'Itinerary and travel checklist',
    icon: 'Plane',
    suggestedKind: 'plan',
    category: 'Personal',
    titleTemplate: 'Trip — [Destination]',
    bodyTemplate: '## DATES\nDepart: \nReturn: \n\n## FLIGHTS / TRANSPORT\n\n\n## ACCOMMODATION\n\n\n## ITINERARY\nDay 1: \nDay 2: \nDay 3: \n\n## PACKING LIST\n- [ ] Passport\n- [ ] Charger\n- [ ] \n\n## BUDGET\nEstimated: \nActual: \n',
  },

  // ---- PRO ----
  {
    id: 'cornell-notes',
    name: 'Cornell Notes',
    description: 'Structured study notes with cue, notes, and summary sections',
    icon: 'GraduationCap',
    suggestedKind: 'note',
    category: 'Pro',
    titleTemplate: 'Cornell Notes — [Subject]',
    bodyTemplate: '## CUE COLUMN\n(Write questions or key terms here)\n\n\n## NOTES\n(Write detailed notes here)\n\n\n## SUMMARY\n(Summarize the key points in 2-3 sentences)\n',
  },
  {
    id: 'study-sheet',
    name: 'Study Sheet',
    description: 'Exam prep and study material',
    icon: 'PenLine',
    suggestedKind: 'note',
    category: 'Pro',
    titleTemplate: 'Study — [Subject]',
    bodyTemplate: '## KEY CONCEPTS\n1. \n2. \n3. \n\n## DEFINITIONS\nTerm: \nDefinition: \n\nTerm: \nDefinition: \n\n## FORMULAS / RULES\n\n\n## PRACTICE QUESTIONS\n1. \n2. \n\n## WEAK AREAS\n',
  },
  {
    id: 'budget-snapshot',
    name: 'Budget Snapshot',
    description: 'Quick financial overview',
    icon: 'DollarSign',
    suggestedKind: 'note',
    category: 'Pro',
    titleTemplate: 'Budget — [Month]',
    bodyTemplate: '## INCOME\nSalary: \nOther: \nTotal: \n\n## FIXED EXPENSES\nRent: \nUtilities: \nSubscriptions: \n\n## VARIABLE EXPENSES\nFood: \nTransport: \nEntertainment: \n\n## SAVINGS\nGoal: \nActual: \n\n## NOTES\n',
  },
  {
    id: 'client-intake',
    name: 'Client Intake',
    description: 'New client information and notes',
    icon: 'UserPlus',
    suggestedKind: 'note',
    category: 'Pro',
    titleTemplate: 'Client — [Name]',
    bodyTemplate: '## CONTACT INFO\nName: \nEmail: \nPhone: \nCompany: \n\n## PROJECT DETAILS\nDescription: \nBudget: \nTimeline: \n\n## REQUIREMENTS\n1. \n2. \n3. \n\n## NOTES\n\n## NEXT STEPS\n- \n',
  },

  // ---- JOURNAL ----
  {
    id: 'journal-daily-checkin',
    name: 'Daily Check-in',
    description: 'Mood, energy, wins, challenges, and next step',
    icon: 'Sun',
    suggestedKind: 'journal' as ItemKind,
    category: 'Journal',
    titleTemplate: 'Daily Check-in — [date]',
    bodyTemplate: '## MOOD / ENERGY / STRESS\nMood [0–10]: \nEnergy [0–10]: \nStress [0–10]: \n\n## 3 WINS TODAY\n1. \n2. \n3. \n\n## 1 HARD THING\n(what was difficult today)\n\n## 1 NEXT STEP\n(one concrete action for tomorrow)\n',
  },
  {
    id: 'journal-gratitude',
    name: 'Gratitude',
    description: '3 specific things + why they mattered',
    icon: 'Heart',
    suggestedKind: 'journal' as ItemKind,
    category: 'Journal',
    titleTemplate: 'Gratitude — [date]',
    bodyTemplate: '## 3 THINGS I\'M GRATEFUL FOR\n\n1. \n   Why it mattered: \n\n2. \n   Why it mattered: \n\n3. \n   Why it mattered: \n\n## REFLECTION\n(What does this tell me about what I value?)\n',
  },
  {
    id: 'journal-thought-record',
    name: 'Thought Record',
    description: 'Situation → thought → feeling → evidence → balanced view',
    icon: 'Brain',
    suggestedKind: 'journal' as ItemKind,
    category: 'Journal',
    titleTemplate: 'Thought Record — [date]',
    bodyTemplate: '## SITUATION\n(What happened? Who, what, when, where)\n\n## AUTOMATIC THOUGHT\n(What went through your mind?)\n\n## FEELING\nEmotion: \nIntensity [0–10]: \n\n## EVIDENCE FOR THIS THOUGHT\n\n\n## EVIDENCE AGAINST THIS THOUGHT\n\n\n## BALANCED THOUGHT\n(A more realistic perspective)\n\n## OUTCOME\nFeeling intensity after [0–10]: \n',
  },
  {
    id: 'journal-values-intentions',
    name: 'Values & Intentions',
    description: 'Top value today + one aligned action',
    icon: 'Compass',
    suggestedKind: 'journal' as ItemKind,
    category: 'Journal',
    titleTemplate: 'Values & Intentions — [date]',
    bodyTemplate: '## TOP VALUE TODAY\n(e.g. connection, growth, integrity, health, creativity)\n\n## WHAT LIVING THIS VALUE LOOKS LIKE TODAY\n\n\n## ONE INTENTIONAL ACTION\n(specific, doable today)\n\n## END OF DAY: DID I SHOW UP FOR THIS VALUE?\nYes / Partially / Not quite — because:\n',
  },
  {
    id: 'journal-sleep-recovery',
    name: 'Sleep & Recovery',
    description: 'Sleep, wake, quality, caffeine, exercise',
    icon: 'Moon',
    suggestedKind: 'journal' as ItemKind,
    category: 'Journal',
    titleTemplate: 'Sleep & Recovery — [date]',
    bodyTemplate: '## SLEEP\nBedtime last night: \nWake time: \nHours slept: \nQuality [0–10]: \n\n## RECOVERY FACTORS\nCaffeine today: \nExercise: \nScreen time before bed: \n\n## HOW I FEEL THIS MORNING\nEnergy [0–10]: \nMental clarity [0–10]: \n\n## NOTES / PATTERNS\n',
  },
  {
    id: 'journal-weekly-review',
    name: 'Weekly Review',
    description: 'What worked, what didn\'t, and what to adjust',
    icon: 'BarChart2',
    suggestedKind: 'journal' as ItemKind,
    category: 'Journal',
    titleTemplate: 'Weekly Review — Week of [date]',
    bodyTemplate: '## WHAT WORKED THIS WEEK\n1. \n2. \n3. \n\n## WHAT DIDN\'T WORK\n1. \n2. \n\n## BIGGEST LESSON\n\n\n## ENERGY & MOOD TREND\nHigh points: \nLow points: \n\n## ADJUSTMENT FOR NEXT WEEK\n(one concrete change)\n\n## NEXT WEEK INTENTIONS\n1. \n2. \n3. \n',
  },

  // ---- PLUS ----
  {
    id: 'content-calendar',
    name: 'Content Calendar',
    description: 'Plan content for social, blog, or marketing',
    icon: 'Megaphone',
    suggestedKind: 'plan',
    category: 'Plus',
    titleTemplate: 'Content Plan — [Platform/Topic]',
    bodyTemplate: '## THEME\n\n\n## AUDIENCE\n\n\n## CONTENT PIECES\n1. Title: \n   Format: \n   Date: \n\n2. Title: \n   Format: \n   Date: \n\n3. Title: \n   Format: \n   Date: \n\n## KEY MESSAGES\n- \n- \n\n## CALL TO ACTION\n\n## METRICS TO TRACK\n',
  },
  {
    id: 'finance-log',
    name: 'Finance Quick Log',
    description: 'Quick expense and income tracking',
    icon: 'DollarSign',
    suggestedKind: 'note',
    category: 'Plus',
    titleTemplate: 'Finance — [date]',
    bodyTemplate: '## INCOME\nSource: \nAmount: \n\n## EXPENSES\nCategory: \nAmount: \n\n## BALANCE\nStarting: \nEnding: \n\n## NOTES\n',
  },
  {
    id: 'client-call-notes',
    name: 'Client Call Notes',
    description: 'Record client conversation details',
    icon: 'Users',
    suggestedKind: 'note',
    category: 'Plus',
    titleTemplate: 'Call — [Client Name]',
    bodyTemplate: 'Date: [date]\nClient: \nDuration: \n\n## TOPICS DISCUSSED\n1. \n2. \n3. \n\n## COMMITMENTS\n- \n- \n\n## FOLLOW-UP\n- \n',
  },
  {
    id: 'service-quote',
    name: 'Service Quote Lite',
    description: 'Quick service/product quote template',
    icon: 'FileText',
    suggestedKind: 'note',
    category: 'Plus',
    titleTemplate: 'Quote — [Client]',
    bodyTemplate: 'Date: [date]\nClient: \nValid until: \n\n## SERVICES\n1. Service: \n   Rate: \n   Quantity: \n\n## SUBTOTAL\n\n## TAX\n\n## TOTAL\n\n## NOTES\n',
  },
  {
    id: 'bug-triage',
    name: 'Bug Triage',
    description: 'Document and prioritize bug reports',
    icon: 'AlertCircle',
    suggestedKind: 'note',
    category: 'Plus',
    titleTemplate: 'Bug — [Issue]',
    bodyTemplate: 'Date reported: [date]\nSeverity: [Low/Medium/High/Critical]\n\n## DESCRIPTION\n\n\n## STEPS TO REPRODUCE\n1. \n2. \n3. \n\n## EXPECTED VS ACTUAL\nExpected: \nActual: \n\n## ENVIRONMENT\n\n\n## PROPOSED FIX\n\n',
  },
  {
    id: 'sprint-plan',
    name: 'Sprint Plan',
    description: 'Organize sprint goals and tasks',
    icon: 'Zap',
    suggestedKind: 'plan',
    category: 'Plus',
    titleTemplate: 'Sprint [#] — [date]',
    bodyTemplate: '## SPRINT GOALS\n1. \n2. \n3. \n\n## USER STORIES\n- \n- \n\n## TASKS\n- \n- \n\n## CAPACITY\nTeam: \nDays: \n\n## RETROSPECTIVE\nWhat went well: \nWhat to improve: \n',
  },
  {
    id: 'launch-checklist',
    name: 'Launch Checklist',
    description: 'Pre-launch verification tasks',
    icon: 'CheckCircle',
    suggestedKind: 'task',
    category: 'Plus',
    titleTemplate: 'Launch Checklist — [Product]',
    bodyTemplate: '',
  },
  {
    id: 'daily-wins',
    name: 'Daily Wins',
    description: 'Celebrate daily accomplishments',
    icon: 'Trophy',
    suggestedKind: 'sticky',
    category: 'Plus',
    titleTemplate: 'Today\'s Wins — [date]',
    bodyTemplate: '## WINS\n1. \n2. \n3. \n\n## GRATITUDE\n1. \n2. \n\n## ENERGY\nMorning: [1-10]\nEvening: [1-10]\n',
  },
  {
    id: 'relationship-checkin',
    name: 'Relationship Check-in',
    description: 'Personal relationship reflection',
    icon: 'Heart',
    suggestedKind: 'note',
    category: 'Plus',
    titleTemplate: 'Check-in — [Person]',
    bodyTemplate: 'Date: [date]\nPerson: \n\n## HOW ARE THEY?\n\n\n## WHAT I APPRECIATE\n\n\n## WHAT TO DISCUSS\n\n\n## ACTION ITEMS\n- \n',
  },
  {
    id: 'medical-log',
    name: 'Medical Log',
    description: 'Track health appointments and notes',
    icon: 'Activity',
    suggestedKind: 'note',
    category: 'Plus',
    titleTemplate: 'Medical — [date]',
    bodyTemplate: 'Doctor: \nAppointment: [date/time]\n\n## REASON FOR VISIT\n\n\n## SYMPTOMS\n\n\n## DIAGNOSIS\n\n\n## TREATMENT PLAN\n\n\n## MEDICATIONS\n\n\n## FOLLOW-UP\n',
  },
];

// Helper: group templates by category
export function getTemplatesByCategory(category: string): EditorTemplate[] {
  return TEMPLATES.filter((t) => t.category === category);
}

// Helper: get all unique categories
export function getTemplateCategories(): string[] {
  const cats = new Set(TEMPLATES.map((t) => t.category));
  return Array.from(cats);
}

// Templates that create task items get special handling
export const TASK_TEMPLATES = TEMPLATES.filter((t) => t.suggestedKind === 'task');

// Default task items for task templates
export function getTaskTemplateRows(templateId: string): Array<{ text: string; done: boolean }> {
  switch (templateId) {
    case 'habit-tracker':
      return [
        { text: 'Morning routine', done: false },
        { text: 'Exercise', done: false },
        { text: 'Read 30 min', done: false },
        { text: 'Meditate', done: false },
        { text: 'Journal', done: false },
        { text: 'No social media before noon', done: false },
        { text: 'Drink 8 glasses of water', done: false },
        { text: 'Sleep by 10pm', done: false },
      ];
    case 'shopping-list':
      return [{ text: '', done: false }];
    case 'launch-checklist':
      return [
        { text: 'Design review complete', done: false },
        { text: 'Code review complete', done: false },
        { text: 'Testing passed', done: false },
        { text: 'Documentation ready', done: false },
        { text: 'Deploy to staging', done: false },
        { text: 'Final approval', done: false },
      ];
    default:
      return [{ text: '', done: false }];
  }
}

