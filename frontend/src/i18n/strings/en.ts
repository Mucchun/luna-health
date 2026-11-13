// English base strings. Every other language file must provide the same keys
// (enforced by the `Record<StringKey, string>` typing in ../index.tsx).

export const en = {
  // Navigation
  'nav.dashboard': 'Dashboard',
  'nav.cycle': 'Cycle',
  'nav.fertility': 'Fertility',
  'nav.menopause': 'Menopause',
  'nav.patterns': 'Patterns',
  'nav.triggers': 'Triggers',
  'nav.labs': 'Labs',
  'nav.medications': 'Medications',
  'nav.wellness': 'Wellness',
  'nav.ai': 'AI Insights',
  'nav.community': 'Community',
  'nav.report': 'Report',
  'nav.settings': 'Settings',
  'nav.hub': 'Health Hub',
  'nav.log': 'Log',
  'nav.more': 'More',
  'nav.logSymptom': 'Log Symptom',

  // Common
  'common.back': 'Back',
  'common.continue': 'Continue',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.close': 'Close',
  'common.done': 'Done',
  'common.loading': 'Loading…',
  'common.days': 'days',
  'common.optional': 'optional',
  'common.noDataYet': 'No data yet',

  // Onboarding
  'onboarding.welcome': 'Welcome to Luna',
  'onboarding.welcomeSub': "A private health hub built for chronic conditions. Let's set up your profile — it takes 30 seconds.",
  'onboarding.nameLabel': 'What should we call you?',
  'onboarding.namePlaceholder': 'Your first name…',
  'onboarding.conditionsTitle': 'What are you managing?',
  'onboarding.conditionsSub': 'Select all that apply. This personalises your tips, supplement suggestions, and community channels.',
  'onboarding.cycleTitle': 'Your cycle',
  'onboarding.cycleSub': 'Used for phase detection and flare predictions. You can always update this in Settings.',
  'onboarding.cycleLength': 'Cycle length',
  'onboarding.periodLength': 'Period length',
  'onboarding.getStarted': 'Get started',

  // Disclaimer / consent
  'disclaimer.title': 'Before you start',
  'disclaimer.subtitle': 'Please read and accept the important note below',
  'disclaimer.privacyNote': 'Your health data stays private on your device.',
  'disclaimer.privacyPolicy': 'Privacy Policy',
  'disclaimer.agree': 'I understand & agree',

  // Dashboard
  'dashboard.goodMorning': 'Good morning',
  'dashboard.goodAfternoon': 'Good afternoon',
  'dashboard.goodEvening': 'Good evening',
  'dashboard.logSymptomCta': '+ Log symptom',
  'dashboard.logFirstPeriod': 'Log your first period',
  'dashboard.unlockPhase': 'to unlock cycle phase tracking.',
  'dashboard.currentPhase': 'Current Phase',
  'dashboard.cycleDay': 'Cycle day',
  'dashboard.ofDays': 'of {n} days',
  'dashboard.nextPeriod': 'Next period',
  'dashboard.predicted': 'predicted',
  'dashboard.dayOf': 'Day {day} of {total}',
  'dashboard.daysRemaining': '{n}d remaining',
  'dashboard.severity30': 'Severity — 30 days',
  'dashboard.logsAvg': '{count} logs · avg {avg}',
  'dashboard.patternsLink': 'Patterns →',
  'dashboard.logToSeeTrend': 'Log symptoms to see your trend',
  'dashboard.today': 'Today',
  'dashboard.nothingToday': 'Nothing logged yet today',
  'dashboard.topSymptoms': 'Top symptoms this month',
  'dashboard.predictedFlares': 'Predicted flare days',
  'dashboard.fromCycleHistory': 'From cycle history',
  'dashboard.flaresLocked': 'Log symptoms across 2+ cycles to unlock predictions.',
  'dashboard.cycleTracker': '→ Cycle tracker',
  'dashboard.likely': '{n}% likely',

  // Log Symptom
  'log.subtitle': "Track what you're feeling for better pattern detection",
  'log.saved': 'Saved!',
  'log.date': 'Date',
  'log.condition': 'Condition',
  'log.general': 'General',
  'log.symptom': 'Symptom',
  'log.fromList': 'From list',
  'log.typeCustom': 'Type custom',
  'log.describePlaceholder': 'Describe your symptom…',
  'log.severity': 'Severity',
  'log.mild': 'Mild',
  'log.moderate': 'Moderate',
  'log.severe': 'Severe',
  'log.bodyLocation': 'Body location',
  'log.notes': 'Notes',
  'log.notesPlaceholder': 'Any context about this symptom…',
  'log.save': 'Save Symptom',

  // Community
  'community.subtitle': 'Anonymous posts by women like you · all topics welcome',
  'community.local': 'Local · this device only',
  'community.live': 'LIVE · shared with everyone',
  'community.post': 'Post',
  'community.postSomething': '+ Post something',
  'community.identityNote': 'Your anonymous identity — permanent and only visible here',
  'community.youAre': "You're",
  'community.noPosts': 'No posts yet — be the first',
  'community.noPostsIn': 'No posts in "{topic}" yet',
  'community.shareIntro': 'Share a question, vent, or an experience. Everything here is completely anonymous.',
  'community.createPost': 'Create a post',
  'community.report': 'Report',
  'community.block': 'Block',
  'community.replies': 'Replies',
  'community.replyPlaceholder': 'Share your experience or offer support…',
  'community.replyAnon': 'Reply anonymously',
  'community.newPost': 'New Post',
  'community.topic': 'Topic',
  'community.titleField': 'Title',
  'community.titlePlaceholder': "What's your post about?",
  'community.shareThoughts': 'Share your thoughts',
  'community.contentPlaceholder': 'A question, a vent, an experience, advice — anything goes. All posts are anonymous.',
  'community.postingAs': 'Posting as',
  'community.realIdentityNote': 'Your real identity is never shown',
  'community.guidelines': 'Community Guidelines',
  'community.posting': 'Posting…',
  'community.postAnon': 'Post Anonymously',
  'community.deletePostConfirm': 'Delete this post and all its replies?',
  'community.reportProblem': 'Report a problem: support@lunahealth.app',

  // Page titles
  'page.cycleTracker': 'Cycle Tracker',
  'page.menopauseGuide': 'Menopause Guide',
  'page.triggerJournal': 'Trigger Journal',
  'page.labValues': 'Lab Values',
  'page.medications': 'Medications & Supplements',
  'page.wellness': 'Wellness & Nutrition',
  'page.doctorReport': 'Doctor Visit Report',

  // Triggers
  'triggers.subtitle': 'See what correlates with worse symptom days',
  'triggers.correlations': 'Correlations',
  'triggers.correlationsSub': 'Avg severity on trigger days vs. non-trigger days',
  'triggers.recentLogs': 'Recent logs',
  'triggers.recentSub': 'Log food, stress, activity, and other potential triggers',
  'triggers.logATrigger': 'Log a Trigger',
  'triggers.category': 'Category',
  'triggers.trigger': 'Trigger',
  'triggers.describePlaceholder': 'Describe trigger…',
  'triggers.anyContext': 'Any context…',

  // Medications
  'meds.subtitle': "Track what you're taking and log daily adherence",
  'meds.checkin': "Today's Check-in",
  'meds.noActive': 'No active medications or supplements',
  'meds.add': 'Add Medication',
  'meds.name': 'Name',
  'meds.namePlaceholder': 'e.g. Metformin, Inositol, Visanne…',
  'meds.type': 'Type',
  'meds.dose': 'Dose',
  'meds.frequency': 'Frequency',
  'meds.select': 'Select…',
  'meds.startDate': 'Start date',
  'meds.notesPlaceholder': "Why prescribed, how it's helping…",

  // Cycle tracker
  'cycle.tapDayLog': 'Tap any day on the calendar to log a period',
  'cycle.tapToLog': 'Tap any day to log',
  'cycle.loggedPeriods': 'Logged Periods',
  'cycle.noPeriods': 'No periods logged yet',
  'cycle.tapAbove': 'Tap a day on the calendar above to get started',
  'cycle.logPeriod': 'Log Period',
  'cycle.periodStarted': 'Period started',
  'cycle.periodEnded': 'Period ended',
  'cycle.notesPlaceholder': 'Flow, colour, anything notable…',

  // Wellness
  'wellness.subtitle': 'Evidence-based dietary guidance for your conditions',
  'wellness.eatMore': 'Eat more of',
  'wellness.limitAvoid': 'Limit or avoid',
  'wellness.supplements': 'Evidence-based supplements',
  'wellness.lifestyle': 'Lifestyle tips',
  'wellness.mealPlan': 'Sample meal plan',

  // Patterns
  'patterns.subtitle': 'Insights from your symptom history',
  'patterns.startLogging': 'Start logging symptoms to see patterns',
  'patterns.topByFreq': 'Top symptoms by frequency',
  'patterns.byDayOfWeek': 'By day of week',
  'patterns.painLocations': 'Pain locations',

  // Fertility
  'fertility.subtitle': 'Ovulation predictions & AI conception insights',
  'fertility.aiSummary': 'AI Fertility Summary',
  'fertility.conditionsAffect': 'How your conditions affect fertility',
  'fertility.conceptionTips': 'Conception tips for you',
  'fertility.labInsights': 'Lab Insights',
  'fertility.trackToImprove': 'Track to improve accuracy',
  'fertility.askDoctor': 'Ask your doctor',
  'fertility.aiInsightsTitle': 'AI Fertility Insights',
  'fertility.aiInsightsDesc': 'Get personalised fertility analysis based on your cycle history, conditions, symptoms, and lab values.',
  'fertility.getInsights': 'Get Fertility Insights',

  // Menopause
  'menopause.whereJourney': 'Where are you in your journey?',
  'menopause.yourGuide': 'Your Menopause Guide',
  'menopause.whyHappens': 'Why it happens & what helps',
  'menopause.lifestylePillars': 'Lifestyle pillars',
  'menopause.medicalOptions': 'Medical options to discuss',
  'menopause.yourConditions': 'Your conditions',
  'menopause.labInsights': 'Lab insights',
  'menopause.askDoctor': 'Ask your doctor',
  'menopause.trackInLuna': 'Track in Luna',
  'menopause.readyWhenYou': 'Ready when you are',

  // Labs
  'labs.aiAnalysis': 'AI Lab Analysis',
  'labs.markerStatus': 'Marker Status',
  'labs.keyFindings': 'Key Findings',
  'labs.askDoctor': 'Ask your doctor',
  'labs.considerTesting': 'Consider testing',
  'labs.latestResults': 'Latest Results',
  'labs.allRecords': 'All Records',
  'labs.addResult': 'Add Lab Result',
  'labs.marker': 'Marker',
  'labs.selectMarker': 'Select a marker…',
  'labs.otherCustom': 'Other / custom',
  'labs.markerName': 'Marker name',
  'labs.markerNamePlaceholder': 'e.g. Cortisol',
  'labs.value': 'Value',
  'labs.unit': 'Unit',
  'labs.labClinic': 'Lab / clinic',
  'labs.labClinicPlaceholder': 'e.g. Quest Diagnostics',
  'labs.saveResult': 'Save Result',

  // Doctor report
  'report.summaryReport': 'Health Summary Report',
  'report.conditions': 'Conditions',
  'report.mostFrequent': 'Most Frequent Symptoms',
  'report.recentCycles': 'Recent Cycles',
  'report.currentMeds': 'Current Medications & Supplements',
  'report.labResults': 'Lab Results',

  // AI Insights
  'ai.analystTitle': 'Your personal health analyst',
  'ai.needsLogs': 'Needs at least a few symptom logs to work',
  'ai.analysing': 'Analysing your health data…',
  'ai.summary': 'AI Summary',
  'ai.topSymptom': 'Top symptom',
  'ai.conditionFocus': 'Condition focus',
  'ai.analyseCta': 'Analyse my health',
  'ai.reanalyse': 'Re-analyse',

  // Chat
  'chat.title': 'Luna AI',
  'chat.placeholder': 'Ask Luna anything…',

  // Remaining page subtitles
  'labs.subtitle': 'Track hormones and biomarkers relevant to your conditions',
  'menopause.subtitle': 'Understand your stage, track symptoms, and get AI-powered personalised guidance for the menopause transition.',
  'report.subtitle': 'Auto-generated summary — bring this to your appointment',

  // Legal consent bodies
  'legal.disclaimer': `Luna Health is a wellness and self-tracking tool. It is NOT a medical device and does NOT provide medical advice, diagnosis, or treatment.

• Information and AI-generated insights in this app are for general educational purposes only and may be incomplete or inaccurate.
• Always consult a qualified healthcare provider before making any decision about your health, medications, or treatment. Never disregard or delay professional medical advice because of something you read here.
• Do not start, stop, or change any medication based on this app.
• Predictions (such as cycle or flare predictions) are estimates based on the data you log and should not be relied upon for contraception, conception, or any medical purpose.

IF THIS IS AN EMERGENCY
If you think you may have a medical emergency, call your local emergency number or go to the nearest emergency department immediately. Do not use this app in an emergency.`,
  'legal.guidelines': `The Community is an anonymous, supportive space for people managing their health. To keep it safe:

• Be kind and respectful. No harassment, bullying, hate speech, or threats.
• No medical misinformation presented as fact, and no promotion of self-harm.
• No spam, advertising, solicitation, or sharing others' private information.
• No sexually explicit or otherwise objectionable content.

There is zero tolerance for objectionable content or abusive users. You can Report any post or reply, or Block a user, and reported content is removed. Content that violates these rules is acted on within 24 hours.`,

  // Settings
  'settings.title': 'Settings',
  'settings.language': 'Language',
  'settings.languageSub': 'Choose your preferred language',
  'settings.profile': 'Profile',
  'settings.privacy': 'Privacy',
  'settings.data': 'Your data',
  'settings.about': 'About',
} as const;
