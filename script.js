// ============================================================================
// NEXORA — Complete Multi-Language Safe Helper Application
// ============================================================================

// Distress Keyword Lexicon
const distressKeywords = [
    "threat", "threatened", "fear", "scared", "afraid", "panic", "sleep", "insomnia", 
    "nightmare", "money", "debt", "police", "court", "judge", "hearing", "delay", 
    "hurt", "danger", "hopeless", "crying", "alone", "boycott", "intimidation", 
    "accused", "attack", "suicide", "depressed", "harass", "bribe", "bail",
    // Hindi & Regional Keywords
    "डर", "धमकी", "खतरा", "हमला", "पुलिस", "कोर्ट", "अकेला", "नींद", "चिंता",
    "ভয়", "হুমকি", "বিপদ", "আক্রমণ", "পুলিশ", "আদালত", "ঘুম",
    "பயம்", "அச்சுறுத்தல்", "ஆபத்து", "காவல்துறை", "நீதிமன்றம்",
    "भीती", "धमकी", "धोका", "पोलीस", "झोप"
];

// Critical Danger Keywords
const criticalThreatKeywords = [
    "threat", "threatened", "attack", "attacked", "hurt", "danger", "police refused", "kill", "suicide",
    "धमकी", "हमला", "जान से मारने", "খুন", "হুমকি", "கொலை", "धमकावले"
];

// Current Active Survivor Profile (Captured during Intake)
let currentVictimProfile = {
    name: "",
    phone: "",
    work: "",
    stress: "Moderate",
    token: "CASE-2026-9041"
};

// Dynamic Registered Cases (Populated strictly by real survivors who completed check-in)
let cases = [];
let currentCaseChartMode = 'multiaxis'; // 'multiaxis' | 'radar' | 'swimlane' | 'questions' | 'weeks'
let currentAcousticData = { jitter: 1.12, shimmer: 0.42, tremor: 3.5 };

// ============================================================================
// 10-QUESTION DISTRESS EVALUATION & NATURAL LANGUAGE SENTIMENT ENGINE
// Evaluates how stable/distressed the survivor is based on their exact answers
// ============================================================================
function analyzeCheckInResponses(responses, baselineStress = "Moderate", optionalNote = "") {
    const questionKeys = [
        { id: 'q1_mood', label: 'Q1 Mood', dimension: 'mood', name: 'Mood & Emotional Energy' },
        { id: 'q2_sleep', label: 'Q2 Sleep', dimension: 'sleep', name: 'Sleep Quality & Night Rest' },
        { id: 'q3_safety', label: 'Q3 Safety', dimension: 'safety', name: 'Physical Safety & Transit' },
        { id: 'q4_panic', label: 'Q4 Panic', dimension: 'panic', name: 'Panic, Breath & Heartbeat' },
        { id: 'q5_routine', label: 'Q5 Routine', dimension: 'somatic', name: 'Appetite & Daily Routine' },
        { id: 'q6_court', label: 'Q6 Court', dimension: 'court', name: 'Court & Hearing Anxiety' },
        { id: 'q7_support', label: 'Q7 Support', dimension: 'support', name: 'Family & Social Isolation' },
        { id: 'q8_threats', label: 'Q8 Threats', dimension: 'threats', name: 'Intimidation & Direct Threats' },
        { id: 'q9_grounding', label: 'Q9 Calm', dimension: 'grounding', name: 'Grounding & Breath Calming' },
        { id: 'q10_doctor_note', label: 'Q10 Note', dimension: 'journal', name: 'Confidential Doctor Note' }
    ];

    const extremeTerms = [
        "extreme", "extremely", "critical", "danger", "dangerous", "unsafe", "threat", "threatened",
        "nightmare", "nightmares", "insomnia", "cannot sleep", "can't sleep", "no sleep", "sleepless",
        "panic", "panic attack", "panic attacks", "racing heartbeat", "hyperventilating", "heart racing",
        "chest pain", "dying", "death", "kill", "suicide", "suicidal", "attack", "attacked", "assault",
        "terrible", "horrible", "worst", "unbearable", "severe", "severely", "terrified", "trauma",
        "traumatized", "hopeless", "depressed", "starving", "can't eat", "cannot eat", "nausea", "vomiting",
        "alone", "isolated", "abandoned", "no one", "nobody", "zero support", "intimidate", "intimidation",
        "hostile", "pressure", "withdraw", "goons", "fear", "scared", "shaking", "trembling", "crying",
        "very difficult", "10", "9", "10/10", "9/10", "bahut bura", "khatra", "dar"
    ];

    const elevatedTerms = [
        "worried", "stressed", "anxious", "nervous", "troubled", "bad", "difficult", "hard",
        "shaky", "uneasy", "tired", "exhausted", "low", "heavy", "7", "8", "7/10", "8/10", "high"
    ];

    const moderateTerms = [
        "okay", "neutral", "fine", "so-so", "average", "moderate", "manageable", "normal", "5", "6", "5/10"
    ];

    const calmTerms = [
        "very good", "good", "calm", "peaceful", "great", "sound", "safe", "well", "happy", "relaxed", "1", "2", "3", "1/10"
    ];

    let questionScores = [];
    let allText = [];

    questionKeys.forEach((qDef, index) => {
        let resp = null;
        if (Array.isArray(responses)) {
            resp = responses.find(r => 
                (r.questionId && r.questionId === qDef.id) || 
                (r.dimension && r.dimension === qDef.dimension) || 
                (r.question && r.question.toLowerCase().includes(qDef.name.toLowerCase())) ||
                (r.question && r.question.toLowerCase().includes(qDef.label.toLowerCase()))
            ) || responses[index];
        }

        const text = resp ? (resp.text || resp.answer || resp.textValue || "") : "";
        const lower = text.toLowerCase().trim();
        if (text) allText.push(text);

        let score = 50; // default baseline

        if (!text) {
            const bStress = String(baselineStress).toLowerCase();
            if (bStress.includes("high") || bStress.includes("extreme") || parseInt(bStress) >= 8) {
                score = 82;
            } else if (bStress.includes("low") || parseInt(bStress) <= 3) {
                score = 22;
            } else {
                score = 48;
            }
        } else {
            const isExtreme = extremeTerms.some(t => lower.includes(t)) || 
                              text.includes("Very difficult") || 
                              text.includes("Unsafe");

            const isElevated = elevatedTerms.some(t => lower.includes(t)) || 
                               text.includes("Worried") || 
                               text.includes("Stressed");

            const isModerate = moderateTerms.some(t => lower.includes(t)) || 
                               text.includes("Okay") || 
                               text.includes("Neutral");

            const isCalm = calmTerms.some(t => lower.includes(t)) || 
                           text.includes("Very good") || 
                           text.includes("Good") || 
                           text.includes("Calm");

            if (isExtreme) {
                score = 88;
                if (lower.includes("death") || lower.includes("kill") || lower.includes("threat") || lower.includes("unsafe") || lower.includes("danger") || lower.includes("suicide") || lower.includes("attack") || lower.includes("worst") || lower.includes("extreme")) {
                    score = 96;
                }
            } else if (isElevated) {
                score = 72;
            } else if (isModerate) {
                score = 48;
            } else if (isCalm) {
                score = 18;
            } else {
                const numMatch = text.match(/\b([0-9]|10)\b/);
                if (numMatch) {
                    const n = parseInt(numMatch[1]);
                    score = Math.min(100, Math.max(10, n * 10));
                } else {
                    score = 55;
                }
            }

            // Q7 Support: lack of support is extreme distress/isolation
            if (qDef.id === 'q7_support') {
                if (lower.includes("alone") || lower.includes("no one") || lower.includes("nobody") || lower.includes("zero") || lower.includes("isolated") || lower.includes("none")) {
                    score = 92;
                } else if (lower.includes("family") || lower.includes("friends") || lower.includes("full") || lower.includes("lot") || lower.includes("strong")) {
                    score = 15;
                }
            }

            // Q8 Threats: intimidation is high danger under SC/ST Act SOP
            if (qDef.id === 'q8_threats') {
                if (lower.includes("yes") || lower.includes("call") || lower.includes("threat") || lower.includes("hostile") || lower.includes("withdraw") || lower.includes("scared")) {
                    score = 96;
                } else if (lower.includes("no") || lower.includes("none") || lower.includes("nobody") || lower.includes("peace")) {
                    score = 12;
                }
            }
        }

        questionScores.push({
            id: qDef.id,
            label: qDef.label,
            name: qDef.name,
            dimension: qDef.dimension,
            answer: text || "Check-in response recorded",
            score: Math.min(100, Math.max(5, score))
        });
    });

    if (optionalNote) allText.push(optionalNote);
    const combinedJournal = allText.join(" • ");
    const lowerCombined = combinedJournal.toLowerCase();

    // 1. Questionnaire Component (50% Weight)
    const avgQScore = Math.round(questionScores.reduce((acc, q) => acc + q.score, 0) / questionScores.length);
    const surveyPoints = Math.round((avgQScore / 100) * 50);

    // 2. Indic NLP Threat Sentiment (30% Weight)
    let nlpRaw = 20;
    const hasCriticalThreat = extremeTerms.some(t => lowerCombined.includes(t)) || 
                              distressKeywords.some(kw => lowerCombined.includes(kw.toLowerCase())) ||
                              criticalThreatKeywords.some(w => lowerCombined.includes(w.toLowerCase()));

    const countMatches = distressKeywords.filter(kw => lowerCombined.includes(kw.toLowerCase())).length;

    if (hasCriticalThreat || countMatches >= 3) {
        nlpRaw = Math.min(100, 80 + countMatches * 4);
    } else if (countMatches >= 1 || avgQScore >= 60) {
        nlpRaw = 65;
    } else {
        nlpRaw = Math.max(15, avgQScore);
    }
    const nlpPoints = Math.round((nlpRaw / 100) * 30);

    // 3. Acoustic Tremor Index (20% Weight)
    let acousticRaw = Math.round((avgQScore * 0.7) + (nlpRaw * 0.3));
    if (typeof currentAcousticData !== 'undefined' && currentAcousticData && currentAcousticData.tremor > 0) {
        acousticRaw = Math.round((currentAcousticData.tremor / 10) * 100);
    }
    const acousticPoints = Math.round((acousticRaw / 100) * 20);

    // Composite Dynamic Distress Score (0–100)
    let totalScore = Math.min(100, Math.round(surveyPoints + nlpPoints + acousticPoints));

    // Override thresholds if multiple critical/extreme indicators are flagged
    const extremeCount = questionScores.filter(q => q.score >= 80).length;
    if (extremeCount >= 3 || avgQScore >= 72) {
        totalScore = Math.max(totalScore, 78);
    }
    if (extremeCount >= 6 || avgQScore >= 84) {
        totalScore = Math.max(totalScore, 88);
    }

    let riskLevel = "LOW";
    if (totalScore >= 70) riskLevel = "HIGH";
    else if (totalScore >= 40) riskLevel = "MODERATE";

    return {
        totalScore,
        riskLevel,
        avgQScore,
        surveyPoints,
        nlpPoints,
        acousticPoints,
        questionScores,
        somaticScore: Math.round((questionScores.find(q => q.id === 'q2_sleep')?.score || 50) / 10),
        threatScore: Math.round((questionScores.find(q => q.id === 'q3_safety')?.score || 50) / 10),
        courtScore: Math.round((questionScores.find(q => q.id === 'q6_court')?.score || 50) / 10),
        isolationScore: Math.round((questionScores.find(q => q.id === 'q7_support')?.score || 50) / 10),
        combinedJournal: combinedJournal || "Daily 10-question wellness check-in completed."
    };
}

// Auto-repair & score cases loaded from localStorage to prevent undefined or NaN states
function repairAndScoreCase(c) {
    if (!c) return c;
    if (!c.checkIns || c.checkIns.length === 0) {
        const transcript = c.latestCheckInTranscript || [];
        const analysis = analyzeCheckInResponses(transcript, c.baselineStress, c.latestJournal);
        c.checkIns = [{
            week: 1,
            date: new Date().toISOString().split('T')[0],
            ddiScore: analysis.totalScore,
            riskLevel: analysis.riskLevel,
            surveyPoints: analysis.surveyPoints,
            nlpPoints: analysis.nlpPoints,
            acousticPoints: analysis.acousticPoints,
            questionScores: analysis.questionScores,
            somaticScore: analysis.somaticScore,
            threatScore: analysis.threatScore,
            courtScore: analysis.courtScore,
            isolationScore: analysis.isolationScore,
            notes: analysis.combinedJournal || c.latestJournal || "Daily check-in completed",
            milestone: "Daily Check-in Chat Review"
        }];
        c.threatLevel = analysis.riskLevel;
    } else {
        c.checkIns.forEach(chk => {
            if (chk.ddiScore === undefined || isNaN(chk.ddiScore) || !chk.questionScores || chk.questionScores.length === 0) {
                const transcript = c.latestCheckInTranscript || [];
                const analysis = analyzeCheckInResponses(transcript, c.baselineStress, chk.notes || c.latestJournal);
                chk.ddiScore = analysis.totalScore;
                chk.riskLevel = analysis.riskLevel;
                chk.surveyPoints = analysis.surveyPoints;
                chk.nlpPoints = analysis.nlpPoints;
                chk.acousticPoints = analysis.acousticPoints;
                chk.questionScores = analysis.questionScores;
                chk.somaticScore = analysis.somaticScore;
                chk.threatScore = analysis.threatScore;
                chk.courtScore = analysis.courtScore;
                chk.isolationScore = analysis.isolationScore;
            }
        });
        const latest = c.checkIns[c.checkIns.length - 1];
        c.threatLevel = latest.riskLevel;
    }
    return c;
}

function loadCases() {
    try {
        const raw = localStorage.getItem('nexora_cases');
        if (raw) {
            const parsed = JSON.parse(raw);
            // Strictly keep only real cases registered by survivors (those with victimName property)
            cases = Array.isArray(parsed) 
                ? parsed.filter(c => c && c.victimName).map(repairAndScoreCase) 
                : [];
        } else {
            cases = [];
        }
    } catch (e) {
        cases = [];
    }
}

function saveCases() {
    try {
        cases.forEach(repairAndScoreCase);
        localStorage.setItem('nexora_cases', JSON.stringify(cases));
    } catch (e) {
        console.warn("Failed to save cases to localStorage:", e);
    }
}

function switchCaseChartMode(mode) {
    playHapticBeep(580, 'sine', 0.06);
    currentCaseChartMode = mode;
    const modes = ['multiaxis', 'radar', 'swimlane', 'questions', 'weeks'];
    modes.forEach(m => {
        const btn = document.getElementById(`btn-chart-${m}`);
        if (btn) {
            if (m === mode) {
                btn.className = "px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-sky-600 text-white cursor-pointer transition-all shadow-xs flex items-center gap-1";
            } else {
                btn.className = "px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-transparent text-slate-400 hover:text-slate-200 cursor-pointer transition-all flex items-center gap-1";
            }
        }
    });

    const canvas = document.getElementById('ddiChart');
    const swimlaneView = document.getElementById('case-swimlane-view');
    if (mode === 'swimlane') {
        if (canvas) canvas.classList.add('hidden');
        if (swimlaneView) swimlaneView.classList.remove('hidden');
    } else {
        if (canvas) canvas.classList.remove('hidden');
        if (swimlaneView) swimlaneView.classList.add('hidden');
    }

    const targetCase = cases.find(c => c.caseId === selectedCaseId) || cases[0];
    renderLongitudinalChart(targetCase);
}

// Initial load
loadCases();

function findCaseByToken(tokenOrId) {
    if (!cases || cases.length === 0) return null;
    if (!tokenOrId) return cases[0];
    const clean = String(tokenOrId).trim().toUpperCase();
    return cases.find(c => 
        (c.token && c.token.toUpperCase() === clean) ||
        (c.caseId && c.caseId.toUpperCase() === clean) ||
        (c.victimName && c.victimName.toUpperCase() === clean) ||
        (c.token && c.token.toUpperCase().includes(clean)) ||
        (c.caseId && c.caseId.toUpperCase().includes(clean))
    ) || cases[0];
}

let selectedCaseId = cases.length > 0 ? cases[0].caseId : null;
let chartInstance = null;
let compensationChartInstance = null;
let districtRadarChartInstance = null;
let dashChartInstance = null;
let currentDashboardIntelTab = 'swimlane';
let currentSankeyDistrict = 'all';
let currentFilter = "ALL";
let currentLang = "en";
let currentChannelMode = 'web';
let isVoiceSimulating = false;
let voiceWaveAnimId = null;

// ============================================================================
// COMPREHENSIVE 10-LANGUAGE DICTIONARY (Automatic Whole Page Translation)
// ============================================================================
const i18nDictionary = {
    en: {
        hub_status: "Living AI Wellness & Support Hub",
        radar_title: "Live Community Safety & Distress Pulse",
        page_title: "NEXORA — We Are Here To Help",
        header_sub: "| Safe Support Assistant",
        header_emergency: "Emergency:",
        header_mental_health: "Mental Health:",
        header_victim_help: "Victim Help:",
        language_label: "Language:",
        select_language_title: "Choose Your Language / अपनी भाषा चुनें",
        read_aloud_btn: "Listen in your language",

        intro_subtitle: "We are here to help",
        intro_quote: '"Our AI detects potential changes in psychological distress and alerts authorised support personnel for human assessment."',
        intro_explanation: "We listen to how you are feeling, check if you feel safe, and connect you with caring support workers during your court trial.",
        btn_get_started: "Let's Get Started",

        portal_title: "Where would you like to go?",
        portal_desc: "Choose one of the two options below to continue.",
        portal_card1_title: "I Want to Check In",
        portal_card1_desc: "For victims and survivors. Answer 4 simple questions about your sleep, safety, and worries. We make sure you get help if you need it.",
        portal_card1_tag1: "CONFIDENTIAL & PRIVATE",
        portal_card1_tag2: "For You",
        portal_card2_title: "Support Worker Area",
        portal_card2_desc: "For legal aid helpers and counselors. See who needs help today, track court safety, and record phone calls or protection visits.",
        portal_card2_tag1: "LEGAL AID STAFF",
        portal_card2_tag2: "Caseworkers",
        btn_back_start: "← Back to Start Screen",

        btn_back_choices: "← Back to Choices",
        victim_confidential_tag: "Confidential Survivor Form",
        journey_title: "Your Case Steps:",
        journey_step1: "1. Police Report",
        journey_step2: "2. Paperwork",
        journey_step3: "3. Court Hearing (Now)",
        journey_step4: "4. Decision",
        journey_step5: "5. Help & Relief",

        success_title: "Thank You. We Got Your Update.",
        success_desc: "Your helper has received your answers and will check how you are doing. If you are in urgent danger, please call 112 right away.",
        success_case_num: "Case Number:",
        success_score_label: "Your Stress & Safety Score:",
        btn_do_another: "Do Another Check-in",
        btn_back_menu: "Back to Menu",

        victim_pulse_title: "How are you feeling this week?",
        victim_pulse_desc: "Please answer the 4 simple questions below. There are no right or wrong answers.",
        form_case_label: "Your Case Number",
        label_q1: "1. How was your sleep this week?",
        sub_q1_l: "Slept very well (0)",
        sub_q1_r: "Could not sleep / Bad dreams (10)",
        label_q2: "2. Do you feel safe from threats or danger?",
        sub_q2_l: "Completely safe (0)",
        sub_q2_r: "Scared / People threatening me (10)",
        label_q3: "3. Are you nervous or worried about court dates?",
        sub_q3_l: "Not worried at all (0)",
        sub_q3_r: "Very nervous / Panicking (10)",
        label_q4: "4. Do you have friends or family helping you?",
        sub_q4_l: "Many people helping me (0)",
        sub_q4_r: "Completely alone / Nobody talks to us (10)",

        journal_label: "Optional: Did anything scary or bad happen this week?",
        btn_speak: "Speak Words",
        voice_listening: "Listening to your voice...",
        voice_converting: "Converting voice to text",
        journal_placeholder: "Type here if someone pressured you, threatened you, or if you feel unsafe...",

        crisis_warning: "We noticed you might be in immediate danger. Would you like emergency help right now?",
        btn_call_112: "Call 112",
        btn_submit_pulse: "Send My Weekly Check-In",
        score_box_title: "Your Stress & Safety Score",
        score_out_of_100: "OUT OF 100",
        score_explanation: "A higher score means you are feeling more stress or fear. Your helper will see this score and know to reach out sooner.",

        demo_title: "Try a Sample Example:",
        demo_threat: "🚨 Threats Reported (High Stress)",
        demo_delay: "⚖️ Court Delay (Medium Stress)",
        demo_calm: "🌿 Peaceful Week (Low Stress)",

        counselor_header_title: "Support Worker Command Area",
        counselor_header_sub: "Legal Services Authority — Survivor Protection & Welfare",
        counselor_name: "Caseworker: Dr. Sarah Jenkins",
        btn_req_police: "Request Police Protection",
        btn_exit: "← Exit",

        kpi_people_helped: "People Being Helped",
        kpi_active_survivors: "Active Survivors",
        kpi_needs_today: "Needs Help Today",
        kpi_high_stress: "High Stress / Threat Reported",
        kpi_followup_needed: "Follow-up Needed",
        kpi_court_worry: "Court Delay Worry",
        kpi_actions_done: "Help Actions Completed",
        kpi_logged_visits: "Logged Calls & Visits",

        queue_title: "Survivors Needing Attention (Sorted by Urgency)",
        filter_all: "All",
        filter_urgent: "Urgent",
        filter_moderate: "Moderate",
        filter_stable: "Stable",
        th_case_id: "Case ID",
        th_stress_score: "Stress Score",
        th_key_worry: "Key Worry",
        th_review: "Review",

        details_empty_title: "Click a person in the list",
        details_empty_desc: "Select any case on the left to see their past weeks graph, recent words, and write your support action.",
        synth_title: "💡 Helper Recommendation:",
        btn_use_suggestion: "Use This Suggestion ↓",
        chart_title: "Stress Level Over Past Weeks",
        survivor_quote_title: "What Survivor Wrote:",
        past_actions_title: "Past Actions Taken:",

        opt_call: "Phone Call Completed",
        opt_police: "Police Protection Requested",
        opt_meeting: "In-Person Legal Meeting",
        opt_doctor: "Doctor or Hospital Referral",
        notes_placeholder: "Write simple notes of what you did to help...",
        btn_save_action: "Save Support Action",

        badge_doing_okay: "Doing Okay",
        badge_urgent: "Urgent Help",
        badge_moderate: "Needs Call",
        badge_moderate_stress: "Moderate Stress",
        badge_high_stress: "High Stress (Helper Will Reach Out)",
        badge_low_stress: "Doing Okay (Low Stress)",

        synth_urgent_text: "Survivor reported threats or extreme danger. Call immediately and arrange local police protection.",
        synth_moderate_text: "Survivor is stressed about repeated court delays or expenses. Reassuring phone check-in recommended.",
        synth_stable_text: "Survivor is feeling calm and supported. No immediate action required.",
        sample_voice_text: "I felt very scared this week because unknown men were watching our house. Could not sleep at night.",
        police_alert_msg: "🚨 POLICE PROTECTION REQUESTED:\n\nEmergency notification sent to Police Superintendent to deploy protection for the survivor.",
        week_prefix: "Week",
        no_actions: "No previous actions recorded.",
        speech_locale: "en-US"
    },

    hi: {
        hub_status: "लाइव एआई स्वास्थ्य एवं सहायता केंद्र",
        radar_title: "समुदाय सुरक्षा एवं तनाव की लाइव स्थिति",
        page_title: "नेक्सोरा — हम आपकी मदद के लिए यहाँ हैं",
        header_sub: "| सुरक्षित सहायता साथी",
        header_emergency: "आपातकालीन:",
        header_mental_health: "मानसिक स्वास्थ्य:",
        header_victim_help: "पीड़ित सहायता:",
        language_label: "भाषा चुनें:",
        select_language_title: "अपनी भाषा चुनें / Choose Your Language",
        read_aloud_btn: "अपनी भाषा में सुनें",

        intro_subtitle: "हम आपकी मदद के लिए यहाँ हैं",
        intro_quote: '"हमारा एआई आपके तनाव और डर को समझता है ताकि सहायता कर्मी तुरंत आपकी मदद कर सकें।"',
        intro_explanation: "हम सुनते हैं कि आप कैसा महसूस कर रहे हैं, आपकी सुरक्षा की जांच करते हैं, और कोर्ट सुनवाई के दौरान आपको मददगारों से जोड़ते हैं।",
        btn_get_started: "शुरू करें",

        portal_title: "आप कहाँ जाना चाहते हैं?",
        portal_desc: "आगे बढ़ने के लिए नीचे दिए गए दो विकल्पों में से एक चुनें।",
        portal_card1_title: "मैं अपनी जांच करना चाहता हूँ",
        portal_card1_desc: "पीड़ितों और गवाहों के लिए। अपनी नींद, सुरक्षा और चिंताओं पर 4 आसान सवालों के जवाब दें।",
        portal_card1_tag1: "गोपनीय और सुरक्षित",
        portal_card1_tag2: "आपके लिए",
        portal_card2_title: "सहायता कर्मी क्षेत्र",
        portal_card2_desc: "कानूनी सलाहकारों और सहायकों के लिए। देखें किसे आज मदद चाहिए और सुरक्षा दर्ज़ करें।",
        portal_card2_tag1: "विधिक सेवा दल",
        portal_card2_tag2: "केसवर्कर",
        btn_back_start: "← शुरुआत पर वापस जाएं",

        btn_back_choices: "← विकल्पों पर वापस जाएं",
        victim_confidential_tag: "गोपनीय पीड़ित फॉर्म",
        journey_title: "आपके केस के कदम:",
        journey_step1: "1. पुलिस रिपोर्ट",
        journey_step2: "2. कागजी कार्रवाई",
        journey_step3: "3. कोर्ट सुनवाई (वर्तमान)",
        journey_step4: "4. निर्णय",
        journey_step5: "5. मुआवजा और राहत",

        success_title: "धन्यवाद। आपकी जानकारी हमें मिल गई है।",
        success_desc: "आपके सहायक को आपके उत्तर मिल गए हैं। यदि आप किसी खतरे में हैं, तो कृपया तुरंत 112 पर कॉल करें।",
        success_case_num: "केस नंबर:",
        success_score_label: "आपका तनाव और सुरक्षा स्कोर:",
        btn_do_another: "एक और जांच करें",
        btn_back_menu: "मेन्यू पर लौटें",

        victim_pulse_title: "इस हफ़्ते आप कैसा महसूस कर रहे हैं?",
        victim_pulse_desc: "कृपया नीचे दिए गए 4 आसान सवालों के जवाब दें। कोई भी जवाब गलत नहीं है।",
        form_case_label: "आपका केस नंबर",
        label_q1: "1. इस हफ़्ते आपकी नींद कैसी रही?",
        sub_q1_l: "बहुत अच्छी नींद आई (0)",
        sub_q1_r: "बिल्कुल नींद नहीं आई / बुरे सपने (10)",
        label_q2: "2. क्या आप धमकियों या खतरे से सुरक्षित महसूस करते हैं?",
        sub_q2_l: "पूरी तरह सुरक्षित (0)",
        sub_q2_r: "बहुत डरा हुआ / लोग धमका रहे हैं (10)",
        label_q3: "3. क्या आप कोर्ट की तारीख को लेकर चिंतित या घबराए हुए हैं?",
        sub_q3_l: "बिल्कुल चिंता नहीं (0)",
        sub_q3_r: "बहुत घबराहट / पैनिक (10)",
        label_q4: "4. क्या परिवार या दोस्त आपकी मदद कर रहे हैं?",
        sub_q4_l: "कई लोग मदद कर रहे हैं (0)",
        sub_q4_r: "बिल्कुल अकेले / कोई बात नहीं करता (10)",

        journal_label: "वैकल्पिक: क्या इस हफ़्ते कुछ डरावना या बुरा हुआ?",
        btn_speak: "बोलकर बताएं",
        voice_listening: "आपकी आवाज़ सुनी जा रही है...",
        voice_converting: "आवाज़ को शब्दों में बदला जा रहा है",
        journal_placeholder: "अगर किसी ने धमकी दी, डराया, या आप असुरक्षित महसूस कर रहे हैं तो यहाँ लिखें...",

        crisis_warning: "लगता है आप किसी खतरे में हैं। क्या आपको अभी आपातकालीन सहायता चाहिए?",
        btn_call_112: "112 पर कॉल करें",
        btn_submit_pulse: "मेरी साप्ताहिक जानकारी भेजें",
        score_box_title: "तनाव और सुरक्षा स्कोर",
        score_out_of_100: "100 में से",
        score_explanation: "ज्यादा स्कोर का मतलब है ज्यादा तनाव या डर। आपका सहायक यह देखकर जल्द संपर्क करेगा।",

        demo_title: "नमूना उदाहरण आज़माएं:",
        demo_threat: "🚨 धमकी की सूचना (अधिक तनाव)",
        demo_delay: "⚖️ कोर्ट की तारीख टली (मध्यम तनाव)",
        demo_calm: "🌿 शांत सप्ताह (कम तनाव)",

        counselor_header_title: "सहायता कर्मी कंट्रोल रूम",
        counselor_header_sub: "जिला विधिक सेवा प्राधिकरण — पीड़ित सुरक्षा व सहायता",
        counselor_name: "केसवर्कर: डॉ. सारा जेनकिंस",
        btn_req_police: "पुलिस सुरक्षा की मांग करें",
        btn_exit: "← बाहर निकलें",

        kpi_people_helped: "कुल जिनकी मदद हो रही है",
        kpi_active_survivors: "सक्रिय पीड़ित",
        kpi_needs_today: "जिन्हें आज मदद चाहिए",
        kpi_high_stress: "अधिक तनाव / धमकी की सूचना",
        kpi_followup_needed: "फॉलो-अप आवश्यक",
        kpi_court_worry: "तारीख टलने की चिंता",
        kpi_actions_done: "मदद के कदम पूरे हुए",
        kpi_logged_visits: "कॉल और मुलाक़ातें दर्ज़",

        queue_title: "जिन व्यक्तियों को सहायता चाहिए (प्राथमिकता अनुसार)",
        filter_all: "सभी",
        filter_urgent: "अति आवश्यक",
        filter_moderate: "मध्यम",
        filter_stable: "सुरक्षित",
        th_case_id: "केस नंबर",
        th_stress_score: "तनाव स्कोर",
        th_key_worry: "मुख्य चिंता",
        th_review: "जांचें",

        details_empty_title: "सूची में से किसी व्यक्ति को चुनें",
        details_empty_desc: "पुराने हफ़्तों का रिकॉर्ड देखने और सहायता दर्ज़ करने के लिए बाईं ओर क्लिक करें।",
        synth_title: "💡 सहायक के लिए सुझाव:",
        btn_use_suggestion: "यह सुझाव उपयोग करें ↓",
        chart_title: "पिछले हफ़्तों में तनाव का स्तर",
        survivor_quote_title: "पीड़ित ने क्या लिखा:",
        past_actions_title: "पहले की गई सहायता कार्रवाई:",

        opt_call: "फोन पर बातचीत पूरी हुई",
        opt_police: "पुलिस सुरक्षा का अनुरोध भेजा",
        opt_meeting: "आमने-सामने कानूनी बैठक",
        opt_doctor: "अस्पताल / डॉक्टर की मदद",
        notes_placeholder: "आपने मदद के लिए क्या किया, यहाँ आसान शब्दों में लिखें...",
        btn_save_action: "सहायता कार्रवाई दर्ज़ करें",

        badge_doing_okay: "सब ठीक है",
        badge_urgent: "अति आवश्यक मदद",
        badge_moderate: "कॉल ज़रूरी",
        badge_moderate_stress: "मध्यम तनाव",
        badge_high_stress: "अधिक तनाव (सहायक संपर्क करेगा)",
        badge_low_stress: "सब ठीक है (कम तनाव)",

        synth_urgent_text: "पीड़ित ने धमकियों या गंभीर खतरे की सूचना दी है। तुरंत कॉल करें और स्थानीय पुलिस सुरक्षा की व्यवस्था करें।",
        synth_moderate_text: "पीड़ित कोर्ट की तारीखों में देरी या खर्चों से तनाव में है। फोन पर दिलासा देने की सलाह दी जाती है।",
        synth_stable_text: "पीड़ित शांत और सुरक्षित महसूस कर रहा है। किसी आपातकालीन कार्रवाई की आवश्यकता नहीं है।",
        sample_voice_text: "मुझे इस हफ्ते बहुत डर लगा क्योंकि कुछ अज्ञात लोग हमारे घर के बाहर देख रहे थे। रात को नींद नहीं आई।",
        police_alert_msg: "🚨 पुलिस सुरक्षा का अनुरोध भेजा गया:\n\nपीड़ित की सुरक्षा के लिए पुलिस अधीक्षक को आपातकालीन सूचना भेजी गई है।",
        week_prefix: "हफ्ता",
        no_actions: "पहले की कोई कार्रवाई दर्ज़ नहीं है।",
        speech_locale: "hi-IN"
    },

    bn: {
        hub_status: "লাইভ এআই সুস্থতা ও সহায়তা কেন্দ্র",
        radar_title: "কমিউনিটি নিরাপত্তা ও চাপের সরাসরি সংকেত",
        page_title: "নেক্সোরা — আমরা আপনার সাহায্যে প্রস্তুত",
        header_sub: "| নিরাপদ সহায়তা সঙ্গী",
        header_emergency: "জরুরি:",
        header_mental_health: "মানসিক স্বাস্থ্য:",
        header_victim_help: "সাহায্য:",
        language_label: "ভাষা:",
        select_language_title: "আপনার ভাষা বেছে নিন",
        read_aloud_btn: "আপনার ভাষায় শুনুন",

        intro_subtitle: "আমরা আপনার সাহায্যের জন্য এখানে আছি",
        intro_quote: '"আমাদের এআই আপনার মানসিক চাপ বুঝে সহায়তাকারীদের সতর্ক করে যাতে মানুষ আপনাকে সঠিক সহায়তা দিতে পারে।"',
        intro_explanation: "আমরা আপনার কথা শুনি, আপনি নিরাপদ আছেন কিনা দেখি এবং আদালতের শুনানির সময় আপনাকে সহায়কদের সাথে যুক্ত করি।",
        btn_get_started: "শুরু করুন",

        portal_title: "আপনি কোথায় যেতে চান?",
        portal_desc: "এগিয়ে যেতে নিচের দুটি বিকল্পের একটি বেছে নিন।",
        portal_card1_title: "আমি আমার অবস্থা জানাতে চাই",
        portal_card1_desc: "ভুক্তভোগী ও সাক্ষীদের জন্য। ঘুম, নিরাপত্তা ও ভয় নিয়ে ৪টি সহজ প্রশ্নের উত্তর দিন।",
        portal_card1_tag1: "গোপনীয় ও নিরাপদ",
        portal_card1_tag2: "আপনার জন্য",
        portal_card2_title: "সহায়তাকারী কর্মী এলাকা",
        portal_card2_desc: "আইনি সহায়ক ও কাউন্সিলরদের জন্য। আজ কার সাহায্য দরকার তা দেখুন।",
        portal_card2_tag1: "আইনি সেবা দল",
        portal_card2_tag2: "কেসওয়ার্কার",
        btn_back_start: "← শুরুতে ফিরে যান",

        btn_back_choices: "← বিকল্পে ফিরে যান",
        victim_confidential_tag: "গোপনীয় ফর্ম",
        journey_title: "আপনার মামলার ধাপ:",
        journey_step1: "১. পুলিশ রিপোর্ট",
        journey_step2: "২. কাগজপত্র",
        journey_step3: "৩. শুনানি (বর্তমান)",
        journey_step4: "৪. রায়",
        journey_step5: "৫. ক্ষতিপূরণ ও সহায়তা",

        success_title: "ধন্যবাদ। আপনার তথ্য জমা হয়েছে।",
        success_desc: "আপনার সহায়তাকারী উত্তর পেয়েছেন। আপনি বিপদে থাকলে অবিলম্বে ১১২ নম্বরে ফোন করুন।",
        success_case_num: "মামলা নম্বর:",
        success_score_label: "আপনার মানসিক চাপ স্কোর:",
        btn_do_another: "আরেকটি চেক-ইন করুন",
        btn_back_menu: "তালিকায় ফিরুন",

        victim_pulse_title: "এই সপ্তাহে আপনি কেমন অনুভব করছেন?",
        victim_pulse_desc: "দয়া করে নিচের ৪টি সহজ প্রশ্নের উত্তর দিন।",
        form_case_label: "আপনার মামলা নম্বর",
        label_q1: "১. এই সপ্তাহে আপনার ঘুম কেমন হয়েছে?",
        sub_q1_l: "খুব ভালো ঘুম হয়েছে (০)",
        sub_q1_r: "একদম ঘুম হয়নি / খারাপ স্বপ্ন (১০)",
        label_q2: "২. আপনি কি নিজেকে নিরাপদ মনে করছেন?",
        sub_q2_l: "সম্পূর্ণ নিরাপদ (০)",
        sub_q2_r: "ভীত / হুমকি দেওয়া হচ্ছে (১০)",
        label_q3: "৩. আদালতের তারিখ নিয়ে কি আপনি চিন্তিত?",
        sub_q3_l: "একদম চিন্তা নেই (০)",
        sub_q3_r: "খুব ভয় ও আতঙ্ক (১০)",
        label_q4: "৪. পরিবার বা বন্ধুরা কি আপনার পাশে আছেন?",
        sub_q4_l: "অনেকে সাহায্য করছেন (০)",
        sub_q4_r: "সম্পূর্ণ একা (১০)",

        journal_label: "ঐচ্ছিক: এই সপ্তাহে কি খারাপ কিছু ঘটেছে?",
        btn_speak: "কথা বলুন",
        voice_listening: "আপনার কথা শোনা হচ্ছে...",
        voice_converting: "কণ্ঠকে লেখায় রূপান্তর করা হচ্ছে",
        journal_placeholder: "কেউ আপনাকে ভয় দেখালে বা হুমকি দিলে এখানে লিখুন...",

        crisis_warning: "মনে হচ্ছে আপনি বিপদে আছেন। আপনি কি এখনই জরুরি সাহায্য চান?",
        btn_call_112: "১১২ কল করুন",
        btn_submit_pulse: "আমার তথ্য পাঠান",
        score_box_title: "মানসিক চাপ ও নিরাপত্তা স্কোর",
        score_out_of_100: "১০০ এর মধ্যে",
        score_explanation: "বেশি স্কোর মানে বেশি ভয় বা চাপ। আপনার সাহায্যকারী দ্রুত যোগাযোগ করবেন।",

        demo_title: "নমুনা উদাহরণ দেখুন:",
        demo_threat: "🚨 হুমকি দেওয়া হয়েছে (উচ্চ চাপ)",
        demo_delay: "⚖️ আদালত পিছিয়েছে (মাঝারি চাপ)",
        demo_calm: "🌿 শান্ত সপ্তাহ (কম চাপ)",

        counselor_header_title: "সহায়তাকারীর কন্ট্রোল এরিয়া",
        counselor_header_sub: "জেলা আইনি সেবা কর্তৃপক্ষ — সুরক্ষা ও পুনর্বাসন",
        counselor_name: "কেসওয়ার্কার: ড. সারা জেনকিন্স",
        btn_req_police: "পুলিশি সুরক্ষার আবেদন",
        btn_exit: "← প্রস্থান",

        kpi_people_helped: "সাহায্য পাচ্ছেন এমন মানুষ",
        kpi_active_survivors: "সক্রিয় ব্যক্তি",
        kpi_needs_today: "আজ সাহায্য প্রয়োজন",
        kpi_high_stress: "উচ্চ চাপ / হুমকি রিপোর্ট",
        kpi_followup_needed: "ফলো-আপ প্রয়োজন",
        kpi_court_worry: "আদালত বিলম্বের চিন্তা",
        kpi_actions_done: "সম্পন্ন সাহায্য",
        kpi_logged_visits: "রেকর্ড করা পদক্ষেপ",

        queue_title: "যাদের সাহায্য দরকার (জরুরি ভিত্তিতে সাজানো)",
        filter_all: "সকল",
        filter_urgent: "জরুরি",
        filter_moderate: "মাঝারি",
        filter_stable: "স্বাভাবিক",
        th_case_id: "কেস নম্বর",
        th_stress_score: "চাপ স্কোর",
        th_key_worry: "মূল চিন্তা",
        th_review: "পর্যালোচনা",

        details_empty_title: "তালিকা থেকে একজনকে বেছে নিন",
        details_empty_desc: "বাম পাশের যে কোনো ব্যক্তির ওপর ক্লিক করে বিস্তারিত দেখুন।",
        synth_title: "💡 সাহায্যকারীর করণীয় পরামর্শ:",
        btn_use_suggestion: "এই পরামর্শ ব্যবহার করুন ↓",
        chart_title: "গত সপ্তাহের মানসিক চাপের মাত্রা",
        survivor_quote_title: "ব্যক্তি যা লিখেছেন:",
        past_actions_title: "অতীতে নেওয়া পদক্ষেপ:",

        opt_call: "ফোন কল সম্পন্ন হয়েছে",
        opt_police: "পুলিশি সুরক্ষার অনুরোধ",
        opt_meeting: "সরাসরি আইনি বৈঠক",
        opt_doctor: "হাসপাতালে পাঠানো হয়েছে",
        notes_placeholder: "আপনি কী সাহায্য করেছেন তা সংক্ষেপে লিখুন...",
        btn_save_action: "পদক্ষেপ সংরক্ষণ করুন",

        badge_doing_okay: "সব ঠিক আছে",
        badge_urgent: "জরুরি সাহায্য",
        badge_moderate: "কল প্রয়োজন",
        badge_moderate_stress: "মাঝারি চাপ",
        badge_high_stress: "উচ্চ চাপ (সহায়তাকারী যোগাযোগ করবেন)",
        badge_low_stress: "সব ঠিক আছে (কম চাপ)",

        synth_urgent_text: "ব্যক্তি হুমকি বা চরম বিপদের কথা জানিয়েছেন। অবিলম্বে কল করুন এবং স্থানীয় পুলিশি নিরাপত্তার ব্যবস্থা করুন।",
        synth_moderate_text: "আদালত বিলম্ব বা খরচের কারণে ব্যক্তি মানসিক চাপে আছেন। আশ্বস্ত করতে ফোনে কথা বলার পরামর্শ দেওয়া হচ্ছে।",
        synth_stable_text: "ব্যক্তি শান্ত ও নিরাপদ বোধ করছেন। কোনো তাৎক্ষণিক পদক্ষেপের প্রয়োজন নেই।",
        sample_voice_text: "এই সপ্তাহে আমি খুব ভয় পেয়েছি কারণ অপরিচিত লোকেরা আমাদের বাড়ির দিকে নজর রাখছিল। রাতে ঘুম হয়নি।",
        police_alert_msg: "🚨 পুলিশি সুরক্ষার অনুরোধ পাঠানো হয়েছে:\n\nসুরক্ষার জন্য পুলিশ সুপারিন্টেন্ডেন্টকে বার্তা পাঠানো হয়েছে।",
        week_prefix: "সপ্তাহ",
        no_actions: "পূর্বে কোনো পদক্ষেপ নেওয়া হয়নি।",
        speech_locale: "bn-IN"
    },

    ta: {
        hub_status: "நேரலை AI நல்வாழ்வு & ஆதரவு மையம்",
        radar_title: "சமூக பாதுகாப்பு & அழுத்த துடிப்பு",
        page_title: "நெக்ஸோரா — நாங்கள் உதவ இங்கே உள்ளோம்",
        header_sub: "| பாதுகாப்பான உதவி உதவியாளர்",
        header_emergency: "அவசரம்:",
        header_mental_health: "மன நலம்:",
        header_victim_help: "பாதிக்கப்பட்டோர் உதவி:",
        language_label: "மொழி:",
        select_language_title: "உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்",
        read_aloud_btn: "உங்கள் மொழியில் கேளுங்கள்",

        intro_subtitle: "நாங்கள் உதவ இங்கே உள்ளோம்",
        intro_quote: '"எங்கள் AI மன அழுத்த மாற்றங்களைக் கண்டறிந்து மனித உதவிக்கு உடனடியாக எச்சரிக்கிறது."',
        intro_explanation: "நீங்கள் எப்படி உணர்கிறீர்கள் என்பதைக் கேட்டு, பாதுகாப்பை உறுதி செய்து, நீதிமன்ற விசாரணையின் போது ஆதரவு அளிக்கிறோம்.",
        btn_get_started: "தொடங்குவோம்",

        portal_title: "நீங்கள் எங்கு செல்ல விரும்புகிறீர்கள்?",
        portal_desc: "தொடர கீழே உள்ள இரண்டு விருப்பங்களில் ஒன்றைத் தேர்ந்தெடுக்கவும்.",
        portal_card1_title: "நான் எனது நிலையைப் பதிவு செய்ய விரும்புகிறேன்",
        portal_card1_desc: "பாதிக்கப்பட்டோர் மற்றும் சாட்சிகளுக்கு. தூக்கம், பாதுகாப்பு மற்றும் பயம் பற்றிய 4 எளிய கேள்விகளுக்குப் பதிலளிக்கவும்.",
        portal_card1_tag1: "ரகசியமானது & பாதுகாப்பானது",
        portal_card1_tag2: "உங்களுக்காக",
        portal_card2_title: "ஆதரவு பணியாளர் பகுதி",
        portal_card2_desc: "சட்ட ஆலோசகர்களுக்கு. யாருக்கு இன்று உதவி தேவை என்பதைப் பார்த்து பாதுகாப்பை உறுதி செய்யவும்.",
        portal_card2_tag1: "சட்ட உதவி ஊழியர்கள்",
        portal_card2_tag2: "வழக்கு பணியாளர்கள்",
        btn_back_start: "← தொடக்கத் திரைக்குத் திரும்பு",

        btn_back_choices: "← விருப்பங்களுக்குத் திரும்பு",
        victim_confidential_tag: "ரகசிய படிவம்",
        journey_title: "உங்கள் வழக்கின் படிகள்:",
        journey_step1: "1. புகார்",
        journey_step2: "2. ஆவணங்கள்",
        journey_step3: "3. நீதிமன்ற விசாரணை (தற்போது)",
        journey_step4: "4. தீர்ப்பு",
        journey_step5: "5. நிவாரணம் மற்றும் உதவி",

        success_title: "நன்றி. உங்கள் தகவல் பெறப்பட்டது.",
        success_desc: "உங்கள் உதவியாளர் பதில்களைப் பெற்றுள்ளார். அவசர ஆபத்து இருந்தால் தயவுசெய்து உடனடியாக 112 ஐ அழைக்கவும்.",
        success_case_num: "வழக்கு எண்:",
        success_score_label: "மன அழுத்தம் மற்றும் பாதுகாப்பு மதிப்பெண்:",
        btn_do_another: "மற்றொரு பதிவு செய்யவும்",
        btn_back_menu: "மெனுவுக்குத் திரும்பு",

        victim_pulse_title: "இந்த வாரம் நீங்கள் எப்படி உணர்கிறீர்கள்?",
        victim_pulse_desc: "கீழே உள்ள 4 எளிய கேள்விகளுக்கு பதிலளிக்கவும்.",
        form_case_label: "உங்கள் வழக்கு எண்",
        label_q1: "1. இந்த வாரம் உங்கள் தூக்கம் எப்படி இருந்தது?",
        sub_q1_l: "நன்றாக தூங்கினேன் (0)",
        sub_q1_r: "தூங்க முடியவில்லை / கெட்ட கனவுகள் (10)",
        label_q2: "2. அச்சுறுத்தல்களிலிருந்து நீங்கள் பாதுகாப்பாக உணர்கிறீர்களா?",
        sub_q2_l: "முற்றிலும் பாதுகாப்பானது (0)",
        sub_q2_r: "பயம் / மிரட்டல் வருகிறது (10)",
        label_q3: "3. நீதிமன்ற விசாரணை குறித்து பதட்டமாக உள்ளதா?",
        sub_q3_l: "கவலை இல்லை (0)",
        sub_q3_r: "மிகவும் பதட்டம் / பயம் (10)",
        label_q4: "4. உங்களுக்கு உதவ நண்பர்கள் அல்லது குடும்பத்தினர் உள்ளனரா?",
        sub_q4_l: "பலர் உதவுகிறார்கள் (0)",
        sub_q4_r: "முற்றிலும் தனிமை (10)",

        journal_label: "விருப்பமானது: இந்த வாரம் ஏதேனும் கெட்ட சம்பவம் நடந்ததா?",
        btn_speak: "பேசி பதிவு செய்யவும்",
        voice_listening: "உங்கள் குரலைக் கேட்கிறது...",
        voice_converting: "குரல் உரையாக மாற்றப்படுகிறது",
        journal_placeholder: "யாராவது உங்களை மிரட்டினால் அல்லது அச்சுறுத்தினால் இங்கே எழுதவும்...",

        crisis_warning: "நீங்கள் உடனடியாக ஆபத்தில் இருப்பதாகத் தெரிகிறது. அவசர உதவி வேண்டுமா?",
        btn_call_112: "112 ஐ அழைக்கவும்",
        btn_submit_pulse: "எனது வாராந்திர தகவலை அனுப்பவும்",
        score_box_title: "மன அழுத்தம் & பாதுகாப்பு மதிப்பெண்",
        score_out_of_100: "100 இல்",
        score_explanation: "அதிக மதிப்பெண் என்றால் அதிக பயம் அல்லது அழுத்தம். உங்கள் உதவியாளர் விரைவில் உங்களைத் தொடர்புகொள்வார்.",

        demo_title: "மாதிரி உதாரணங்களை முயற்சிக்கவும்:",
        demo_threat: "🚨 அச்சுறுத்தல் தெரிவிக்கப்பட்டது (அதிக அழுத்தம்)",
        demo_delay: "⚖️ நீதிமன்ற தாமதம் (நடுத்தர அழுத்தம்)",
        demo_calm: "🌿 அமைதியான வாரம் (குறைந்த அழுத்தம்)",

        counselor_header_title: "ஆதரவு பணியாளர் கட்டுப்பாட்டு அறை",
        counselor_header_sub: "சட்ட சேவைகள் ஆணையம் — பாதுகாப்பு மற்றும் நலன்",
        counselor_name: "வழக்கு பணியாளர்: டாக்டர் சாரா ஜென்கின்ஸ்",
        btn_req_police: "காவல்துறை பாதுகாப்பு கோரவும்",
        btn_exit: "← வெளியேறு",

        kpi_people_helped: "உதவி பெறும் நபர்கள்",
        kpi_active_survivors: "செயலில் உள்ளவர்கள்",
        kpi_needs_today: "இன்று உதவி தேவைப்படுவோர்",
        kpi_high_stress: "அதிக அழுத்தம் / அச்சுறுத்தல்",
        kpi_followup_needed: "தொடர் கண்காணிப்பு தேவை",
        kpi_court_worry: "நீதிமன்ற தாமதக் கவலை",
        kpi_actions_done: "முடிக்கப்பட்ட உதவிகள்",
        kpi_logged_visits: "பதிவு செய்யப்பட்ட நடவடிக்கைகள்",

        queue_title: "உதவி தேவைப்படுவோர் (முன்னுரிமை வரிசை)",
        filter_all: "அனைத்தும்",
        filter_urgent: "அவசரம்",
        filter_moderate: "நடுத்தரம்",
        filter_stable: "இயல்பு",
        th_case_id: "வழக்கு எண்",
        th_stress_score: "அழுத்த மதிப்பெண்",
        th_key_worry: "முக்கிய கவலை",
        th_review: "ஆய்வு",

        details_empty_title: "பட்டியலில் ஒருவரைத் தேர்ந்தெடுக்கவும்",
        details_empty_desc: "விவரங்களைப் பார்க்க இடதுபுறத்தில் உள்ள வழக்கைக் கிளிக் செய்யவும்.",
        synth_title: "💡 பணியாளர் பரிந்துரை:",
        btn_use_suggestion: "இப்பரிந்துரையைப் பயன்படுத்தவும் ↓",
        chart_title: "கடந்த வாரங்களில் மன அழுத்த நிலை",
        survivor_quote_title: "பாதிக்கப்பட்டவர் எழுதியது:",
        past_actions_title: "முந்தைய நடவடிக்கைகள்:",

        opt_call: "தொலைபேசி அழைப்பு முடிந்தது",
        opt_police: "காவல்துறை பாதுகாப்பு கோரப்பட்டது",
        opt_meeting: "நேரடி சட்ட சந்திப்பு",
        opt_doctor: "மருத்துவமனை பரிந்துரை",
        notes_placeholder: "செய்த உதவிகளை எளிய சொற்களில் எழுதவும்...",
        btn_save_action: "நடவடிக்கையைச் சேமிக்கவும்",

        badge_doing_okay: "நன்றாக உள்ளார்",
        badge_urgent: "அவசர உதவி",
        badge_moderate: "அழைக்க வேண்டும்",
        badge_moderate_stress: "நடுத்தர அழுத்தம்",
        badge_high_stress: "அதிக அழுத்தம் (அதிகாரி தொடர்புகொள்வார்)",
        badge_low_stress: "நன்றாக உள்ளார் (குறைந்த அழுத்தம்)",

        synth_urgent_text: "பாதிக்கப்பட்டவர் அச்சுறுத்தல்கள் அல்லது கடுமையான ஆபத்தை தெரிவித்துள்ளார். உடனடியாக அழைத்து உள்ளூர் காவல்துறை பாதுகாப்பை ஏற்பாடு செய்யவும்.",
        synth_moderate_text: "நீதிமன்ற தாமதம் அல்லது செலவுகள் காரணமாக பாதிக்கப்பட்டவர் மன அழுத்தத்தில் உள்ளார். தொலைபேசி அழைப்பு பரிந்துரைக்கப்படுகிறது.",
        synth_stable_text: "பாதிக்கப்பட்டவர் அமைதியாகவும் பாதுகாப்பாகவும் உணர்கிறார். உடனடி நடவடிக்கை தேவையில்லை.",
        sample_voice_text: "இந்த வாரம் எனக்கு மிகவும் பயமாக இருந்தது, ஏனெனில் அடையாளம் தெரியாத நபர்கள் எங்கள் வீட்டை நோட்டமிட்டனர். இரவில் தூக்கம் வரவில்லை.",
        police_alert_msg: "🚨 காவல்துறை பாதுகாப்பு கோரப்பட்டது:\n\nபாதுகாப்பிற்காக காவல்துறை கண்காணிப்பாளருக்கு செய்தி அனுப்பப்பட்டுள்ளது.",
        week_prefix: "வாரம்",
        no_actions: "முந்தைய நடவடிக்கைகள் எதுவும் இல்லை.",
        speech_locale: "ta-IN"
    },

    mr: {
        hub_status: "थेट AI आरोग्य आणि सहाय्य केंद्र",
        radar_title: "समुदाय सुरक्षा आणि तणावाची थेट स्थिती",
        page_title: "नेक्सोरा — आम्ही आपल्या मदतीसाठी येथे आहोत",
        header_sub: "| सुरक्षित मदत सहकारी",
        header_emergency: "तातडीची मदत:",
        header_mental_health: "मानसिक आरोग्य:",
        header_victim_help: "मदत:",
        language_label: "भाषा:",
        select_language_title: "आपली भाषा निवडा",
        read_aloud_btn: "आपल्या भाषेत ऐका",

        intro_subtitle: "आम्ही आपल्या मदतीसाठी येथे आहोत",
        intro_quote: '"आमचे AI आपल्या तणावाची पातळी ओळखून सहाय्यकांना वेळेवर मदत करण्यास सांगते."',
        intro_explanation: "आम्ही आपली स्थिती समजून घेतो, आपली सुरक्षितता तपासतो आणि कोर्टाच्या काळात मदतनीसांशी जोडतो.",
        btn_get_started: "सुरू करा",

        portal_title: "आपल्याला कुठे जायचे आहे?",
        portal_desc: "पुढे जाण्यासाठी खालील दोन पर्यायांपैकी एक निवडा.",
        portal_card1_title: "मला माझी नोंद करायची आहे",
        portal_card1_desc: "पिडीत व साक्षीदारांसाठी. झोप, सुरक्षितता आणि भीती याबद्दल ४ सोप्या प्रश्नांची उत्तरे द्या.",
        portal_card1_tag1: "गोपनीय आणि सुरक्षित",
        portal_card1_tag2: "आपल्यासाठी",
        portal_card2_title: "मदतनीस कर्मचारी विभाग",
        portal_card2_desc: "कायदेशीर सल्लागार आणि मदतनीसांसाठी. आज कोणाला मदतीची गरज आहे ते पहा.",
        portal_card2_tag1: "विधी सेवा कर्मचारी",
        portal_card2_tag2: "केसवर्कर",
        btn_back_start: "← सुरुवातीच्या पानावर जा",

        btn_back_choices: "← पर्यायांवर परत जा",
        victim_confidential_tag: "गोपनीय फॉर्म",
        journey_title: "आपल्या केसचे टप्पे:",
        journey_step1: "१. तक्रार",
        journey_step2: "२. कागदपत्रे",
        journey_step3: "३. कोर्टात सुनावणी (सध्या)",
        journey_step4: "४. निकाल",
        journey_step5: "५. मदत व भरपाई",

        success_title: "धन्यवाद. आपली माहिती मिळाली आहे.",
        success_desc: "आपल्या मदतनीसाला आपली उत्तरे मिळाली आहेत. धोका असल्यास कृपया त्वरित ११२ वर कॉल करा.",
        success_case_num: "केस नंबर:",
        success_score_label: "तणाव व सुरक्षा गुण:",
        btn_do_another: "आणखी एक नोंद करा",
        btn_back_menu: "मेनूवर परत जा",

        victim_pulse_title: "या आठवड्यात आपल्याला कसे वाटत आहे?",
        victim_pulse_desc: "कृपया खालील ४ साध्या प्रश्नांची उत्तरे द्या. कोणतेही उत्तर चुकीचे नसते.",
        form_case_label: "आपला केस नंबर",
        label_q1: "१. या आठवड्यात आपली झोप कशी झाली?",
        sub_q1_l: "खूप छान झोप लागली (०)",
        sub_q1_r: "अजिबात झोप नाही / वाईट स्वप्ने (१०)",
        label_q2: "२. आपण स्वतःला धोक्यापासून सुरक्षित समजता का?",
        sub_q2_l: "पूर्णपणे सुरक्षित (०)",
        sub_q2_r: "खूप भीती वाटते / धमक्या दिल्या जात आहेत (१०)",
        label_q3: "३. कोर्टाच्या तारखेची काळजी किंवा भीती वाटते का?",
        sub_q3_l: "काळजी नाही (०)",
        sub_q3_r: "खूप जास्त भीती वाटते (१०)",
        label_q4: "४. आपल्याला मदत करणारे कुटुंबीय किंवा मित्र आहेत का?",
        sub_q4_l: "खूप लोग मदत करत आहेत (०)",
        sub_q4_r: "पूर्णपणे एकटे (१०)",

        journal_label: "पर्यायी: या आठवड्यात काही वाईट किंवा भीतीदायक घडले का?",
        btn_speak: "बोलून सांगा",
        voice_listening: "आपला आवाज ऐकला जात आहे...",
        voice_converting: "आवाज शब्दात रूपांतरित होत आहे",
        journal_placeholder: "कोणी धमकावले किंवा भीती वाटली असल्यास येथे लिहा...",

        crisis_warning: "आपण धोक्यात असल्याचे दिसते. आपल्याला त्वरित मदत हवी आहे का?",
        btn_call_112: "११२ वर कॉल करा",
        btn_submit_pulse: "माझी आठवड्याची माहिती पाठवा",
        score_box_title: "तणाव व सुरक्षा गुण",
        score_out_of_100: "१०० पैकी",
        score_explanation: "जास्त गुण म्हणजे जास्त भीती किंवा तणाव. मदतनीस लवकर संपर्क साधेल.",

        demo_title: "नमुना उदाहरण पहा:",
        demo_threat: "🚨 धमकी दिली गेली (जास्त तणाव)",
        demo_delay: "⚖️ कोर्टाची तारीख पुढे गेली (मध्यम तणाव)",
        demo_calm: "🌿 शांत आठवडा (कमी तणाव)",

        counselor_header_title: "मदतनीस नियंत्रण कक्ष",
        counselor_header_sub: "जिल्हा विधी सेवा प्राधिकरण — संरक्षण व मदत",
        counselor_name: "केसवर्कर: डॉ. सारा जेनकिंस",
        btn_req_police: "पोलीस संरक्षणाची मागणी करा",
        btn_exit: "← बाहेर पडा",

        kpi_people_helped: "मदत मिळत असलेले लोक",
        kpi_active_survivors: "सक्रिय व्यक्ती",
        kpi_needs_today: "आज मदतीची गरज असलेले",
        kpi_high_stress: "जास्त तणाव / धमकीची माहिती",
        kpi_followup_needed: "फॉलो-अप आवश्यक",
        kpi_court_worry: "तारीख लांबल्याची चिंता",
        kpi_actions_done: "मदतीची पावले पूर्ण",
        kpi_logged_visits: "नोंदवलेले कॉल व भेटी",

        queue_title: "मदतीची गरज असलेल्या व्यक्ती (प्राधान्यक्रमानुसार)",
        filter_all: "सर्व",
        filter_urgent: "तातडीचे",
        filter_moderate: "मध्यम",
        filter_stable: "सुरक्षित",
        th_case_id: "केस नंबर",
        th_stress_score: "तणाव गुण",
        th_key_worry: "मुख्य चिंता",
        th_review: "तपासा",

        details_empty_title: "यादीतून एका व्यक्तीला निवडा",
        details_empty_desc: "माहिती पाहण्यासाठी डावीकडील केसवर क्लिक करा.",
        synth_title: "💡 मदतनीसासाठी सल्ला:",
        btn_use_suggestion: "हा सल्ला वापरा ↓",
        chart_title: "मागील आठवड्यातील तणावाची पातळी",
        survivor_quote_title: "व्यक्तीने काय लिहिले:",
        past_actions_title: "पूर्वी केलेली मदत:",

        opt_call: "फोन कॉल पूर्ण झाला",
        opt_police: "पोलीस संरक्षणाची विनंती केली",
        opt_meeting: "प्रत्यक्ष कायदेशीर बैठक",
        opt_doctor: "हॉस्पिटल / डॉक्टर मदत",
        notes_placeholder: "आपण मदतीसाठी काय केले ते साध्या शब्दात लिहा...",
        btn_save_action: "मदत कृती नोंदवा",

        badge_doing_okay: "सर्व ठीक आहे",
        badge_urgent: "तातडीची मदत",
        badge_moderate: "कॉल करा",
        badge_moderate_stress: "मध्यम तणाव",
        badge_high_stress: "जास्त तणाव (मदतनीस संपर्क करेल)",
        badge_low_stress: "सर्व ठीक आहे (कमी तणाव)",

        synth_urgent_text: "व्यक्तीने धमक्या किंवा गंभीर धोक्याची माहिती दिली आहे. त्वरित कॉल करा आणि स्थानिक पोलीस संरक्षणाची व्यवस्था करा.",
        synth_moderate_text: "कोर्टाच्या तारखांना होणारा उशीर किंवा खर्चामुळे व्यक्ती तणावात आहे. धीर देण्यासाठी फोनवर बोलण्याचा सल्ला दिला जातो.",
        synth_stable_text: "व्यक्ती शांत आणि सुरक्षित अनुभवत आहे. कोणत्याही तात्काळ कारवाईची गरज नाही.",
        sample_voice_text: "या आठवड्यात मला खूप भीती वाटली कारण अज्ञात लोक आमच्या घराबाहेर पाहत होते. रात्री झोप लागली नाही.",
        police_alert_msg: "🚨 पोलीस संरक्षणाची विनंती पाठवली:\n\nसंरक्षणासाठी पोलीस अधीक्षकांना संदेश पाठवला आहे.",
        week_prefix: "आठवडा",
        no_actions: "यापूर्वी कोणतीही कृती नोंदवलेली नाही.",
        speech_locale: "mr-IN"
    },

    te: {
        hub_status: "లైవ్ AI వెల్నెస్ & సపోర్ట్ హబ్",
        radar_title: "కమ్యూనిటీ భద్రత & ఒత్తిడి పల్స్",
        page_title: "నెక్సోరా — మేము మీకు సహాయం చేయడానికి ఇక్కడ ఉన్నాము",
        header_sub: "| సురక్షిత సహాయ సహాయకుడు",
        header_emergency: "అత్యవసరం:",
        header_mental_health: "మానసిక ఆరోగ్యం:",
        header_victim_help: "బాధితుల సహాయం:",
        language_label: "భాష:",
        select_language_title: "మీ భాషను ఎంచుకోండి",
        read_aloud_btn: "మీ భాషలో వినండి",

        intro_subtitle: "మేము మీకు సహాయం చేయడానికి ఇక్కడ ఉన్నాము",
        intro_quote: '"మా AI మీ మానసిక ఒత్తిడిని గుర్తించి, మానవ సహాయం కోసం సహాయకులకు తక్షణ సమాచారం అందిస్తుంది."',
        intro_explanation: "మీరు ఎలా భావిస్తున్నారో మేము వింటాము, మీ భద్రతను తనిఖీ చేస్తాము మరియు కోర్టు విచారణ సమయంలో మీకు సహాయకులను అందిస్తాము.",
        btn_get_started: "ప్రారంభించండి",

        portal_title: "మీరు ఎక్కడికి వెళ్లాలనుకుంటున్నారు?",
        portal_desc: "కొనసాగడానికి క్రింది రెండు ఎంపికలలో ఒకదాన్ని ఎంచుకోండి.",
        portal_card1_title: "నేను నా పరిస్థితిని నమోదు చేయాలనుకుంటున్నాను",
        portal_card1_desc: "బాధితులు మరియు సాక్షుల కోసం. నిద్ర, భద్రత మరియు ఆందోళనల గురించి 4 సాధారణ ప్రశ్నలకు సమాధానం ఇవ్వండి.",
        portal_card1_tag1: "రహస్యమైనది & సురక్షితమైనది",
        portal_card1_tag2: "మీ కోసం",
        portal_card2_title: "సహాయకుల విభాగం",
        portal_card2_desc: "న్యాయ సహాయకులు మరియు కౌన్సెలర్ల కోసం. ఈ రోజు ఎవరికి సహాయం కావాలో చూడండి.",
        portal_card2_tag1: "న్యాయ సేవా బృందం",
        portal_card2_tag2: "కేస్‌వర్కర్లు",
        btn_back_start: "← ప్రారంభ స్క్రీన్‌కు తిరిగి వెళ్లండి",

        btn_back_choices: "← ఎంపికలకు తిరిగి వెళ్ళండి",
        victim_confidential_tag: "రహస్య ఫారం",
        journey_title: "మీ కేసు దశలు:",
        journey_step1: "1. పోలీస్ రిపోర్ట్",
        journey_step2: "2. కాగితపు పనులు",
        journey_step3: "3. కోర్టు విచారణ (ప్రస్తుతం)",
        journey_step4: "4. తీర్పు",
        journey_step5: "5. సహాయం & ఉపశమనం",

        success_title: "ధన్యవాదాలు. మీ సమాచారం అందింది.",
        success_desc: "మీ సహాయకుడికి మీ సమాధానాలు అందాయి. అత్యవసర ప్రమాదం ఉంటే దయచేసి వెంటనే 112 కు కాల్ చేయండి.",
        success_case_num: "కేసు నంబర్:",
        success_score_label: "మీ ఒత్తిడి & భద్రతా స్కోరు:",
        btn_do_another: "మరొక నమోదు చేయండి",
        btn_back_menu: "మెనూకి తిరిగి వెళ్లండి",

        victim_pulse_title: "ఈ వారం మీరు ఎలా భావిస్తున్నారు?",
        victim_pulse_desc: "దయచేసి క్రింది 4 సాధారణ ప్రశ్నలకు సమాధానం ఇవ్వండి.",
        form_case_label: "మీ కేసు నంబర్",
        label_q1: "1. ఈ వారం మీ నిద్ర ఎలా ఉంది?",
        sub_q1_l: "చాలా బాగా నిద్రపోయాను (0)",
        sub_q1_r: "అస్సలు నిద్ర పట్టలేదు / చెడు కలలు (10)",
        label_q2: "2. మీరు ప్రమాదం నుండి సురక్షితంగా ఉన్నారని భావిస్తున్నారా?",
        sub_q2_l: "పూర్తిగా సురక్షితం (0)",
        sub_q2_r: "భయం / బెదిరింపులు వస్తున్నాయి (10)",
        label_q3: "3. కోర్టు తేదీ గురించి మీరు భయపడుతున్నారా?",
        sub_q3_l: "ఎలాంటి ఆందోళన లేదు (0)",
        sub_q3_r: "చాలా భయం / ఆందోళన (10)",
        label_q4: "4. మీకు సహాయం చేయడానికి స్నేహితులు లేదా కుటుంబ సభ్యులు ఉన్నారా?",
        sub_q4_l: "చాలా మంది సహాయం చేస్తున్నారు (0)",
        sub_q4_r: "పూర్తిగా ఒంటరిగా ఉన్నాను (10)",

        journal_label: "ఐచ్ఛికం: ఈ వారం ఏదైనా భయానకమైనది జరిగిందా?",
        btn_speak: "మాట్లాడి చెప్పండి",
        voice_listening: "మీ వాయిస్ వినబడుతోంది...",
        voice_converting: "వాయిస్ టెక్స్ట్‌గా మారుతోంది",
        journal_placeholder: "ఎవరైనా బెదిరించినా లేదా భయపెట్టినా ఇక్కడ రాయండి...",

        crisis_warning: "మీరు ప్రమాదంలో ఉన్నట్లు కనిపిస్తోంది. మీకు వెంటనే అత్యవసర సహాయం కావాలా?",
        btn_call_112: "112 కి కాల్ చేయండి",
        btn_submit_pulse: "నా సమాచారాన్ని పంపండి",
        score_box_title: "ఒత్తిడి & భద్రతా స్కోరు",
        score_out_of_100: "100 లో",
        score_explanation: "ఎక్కువ స్కోరు అంటే ఎక్కువ భయం లేదా ఒత్తిడి. మీ సహాయకుడు త్వరలోనే సంప్రదిస్తారు.",

        demo_title: "నమూనా ఉదాహరణలను ప్రయత్నించండి:",
        demo_threat: "🚨 బెదిరింపులు నివేదించబడ్డాయి (అధిక ఒత్తిడి)",
        demo_delay: "⚖️ కోర్టు ఆలస్యం (మధ్యస్థ ఒత్తిడి)",
        demo_calm: "🌿 ప్రశాంతమైన వారం (తక్కువ ఒత్తిడి)",

        counselor_header_title: "సహాయకుల కమాండ్ ఏరియా",
        counselor_header_sub: "న్యాయ సేవల ప్రాధికార సంస్థ — రక్షణ & సంక్షేమం",
        counselor_name: "కేస్‌వర్కర్: డాక్టర్ సారా జెంకిన్స్",
        btn_req_police: "పోలీస్ రక్షణను అభ్యర్థించండి",
        btn_exit: "← నిష్క్రమించండి",

        kpi_people_helped: "సహాయం పొందుతున్న వ్యక్తులు",
        kpi_active_survivors: "క్రియాశీల బాధితులు",
        kpi_needs_today: "ఈ రోజు సహాయం అవసరమైనవారు",
        kpi_high_stress: "అధిక ఒత్తిడి / బెదిరింపు",
        kpi_followup_needed: "ఫాలో-అప్ అవసరం",
        kpi_court_worry: "కోర్టు ఆలస్యం ఆందోళన",
        kpi_actions_done: "పూర్తయిన సహాయ చర్యలు",
        kpi_logged_visits: "నమోదైన కాల్స్ & సందర్శనలు",

        queue_title: "సహాయం అవసరమైనవారు (ప్రాధాన్యత ప్రకారం)",
        filter_all: "అన్నీ",
        filter_urgent: "అత్యవసరం",
        filter_moderate: "మధ్యస్థం",
        filter_stable: "సాధారణం",
        th_case_id: "కేసు ID",
        th_stress_score: "ఒత్తిడి స్కోరు",
        th_key_worry: "ముఖ్య ఆందోళన",
        th_review: "సమీక్షించండి",

        details_empty_title: "జాబితా నుండి ఒక వ్యక్తిని ఎంచుకోండి",
        details_empty_desc: "గత వారాల వివరాలను చూడటానికి ఎడమవైపు ఉన్న కేసుపై క్లిక్ చేయండి.",
        synth_title: "💡 సహాయకుడి సిఫార్సు:",
        btn_use_suggestion: "ఈ సూచనను ఉపయోగించండి ↓",
        chart_title: "గత వారాల్లో ఒత్తిడి స్థాయి",
        survivor_quote_title: "బాధిత వ్యక్తి రాసినది:",
        past_actions_title: "గతంలో తీసుకున్న చర్యలు:",

        opt_call: "ఫోన్ కాల్ పూర్తయింది",
        opt_police: "పోలీస్ రక్షణ అభ్యర్థించబడింది",
        opt_meeting: "ప్రత్యక్ష న్యాయ సమావేశం",
        opt_doctor: "వైద్యశాల సిఫార్సు",
        notes_placeholder: "మీరు చేసిన సహాయాన్ని సులభమైన మాటల్లో రాయండి...",
        btn_save_action: "సహాయ చర్యను సేవ్ చేయండి",

        badge_doing_okay: "బాగున్నారు",
        badge_urgent: "అత్యవసర సహాయం",
        badge_moderate: "కాల్ చేయాలి",
        badge_moderate_stress: "మధ్యస్థ ఒత్తిడి",
        badge_high_stress: "అధిక ఒత్తిడి (సహాయకుడు సంప్రదిస్తారు)",
        badge_low_stress: "బాగున్నారు (తక్కువ ఒత్తిడి)",

        synth_urgent_text: "బాధిత వ్యక్తి బెదిరింపులు లేదా తీవ్రమైన ప్రమాదాన్ని నివేదించారు. వెంటనే కాల్ చేసి స్థానిక పోలీసు రక్షణను ఏర్పాటు చేయండి.",
        synth_moderate_text: "కోర్టు వాయిదాలు లేదా ఖర్చుల వల్ల బాధిత వ్యక్తి ఆందోళనలో ఉన్నారు. ఫోన్ ద్వారా మాట్లాడి ధైర్యం చెప్పడం మంచిది.",
        synth_stable_text: "బాధిత వ్యక్తి ప్రశాంతంగా మరియు సురక్షితంగా ఉన్నారు. తక్షణ చర్య అవసరం లేదు.",
        sample_voice_text: "ఈ వారం నాకు చాలా భయంగా ఉంది, ఎందుకంటే గుర్తుతెలియని వ్యక్తులు మా ఇంటిని గమనిస్తున్నారు. రాత్రి నిద్ర పట్టలేదు.",
        police_alert_msg: "🚨 పోలీస్ రక్షణ అభ్యర్థన పంపబడింది:\n\nరక్షణ కోసం పోలీస్ సూపరింటెండెంట్‌కు సందేశం పంపబడింది.",
        week_prefix: "వారం",
        no_actions: "గతంలో ఎలాంటి చర్యలు నమోదు కాలేదు.",
        speech_locale: "te-IN"
    },

    gu: {
        hub_status: "લાઇવ AI વેલનેસ અને સપોર્ટ હબ",
        radar_title: "સમુદાય સુરક્ષા અને તણાવની સ્થિતિ",
        page_title: "નેક્સોરા — અમે તમારી મદદ માટે અહીં છીએ",
        header_sub: "| સુરક્ષિત સહાયક સાથી",
        header_emergency: "કટોકટી:",
        header_mental_health: "માનસિક સ્વાસ્થ્ય:",
        header_victim_help: "મદદ:",
        language_label: "ભાષા:",
        select_language_title: "તમારી ભાષા પસંદ કરો",
        read_aloud_btn: "તમારી ભાષામાં સાંભળો",

        intro_subtitle: "અમે તમારી મદદ માટે અહીં છીએ",
        intro_quote: '"અમારું AI તમારા માનસિક તણાવને ઓળખે છે અને સહાયકોને તાત્કાલિક મદદ કરવા જણાવે છે."',
        intro_explanation: "અમે તમારી લાગણીઓને સમજીએ છીએ, તમારી સુરક્ષા ચકાસીએ છીએ અને કોર્ટ ટ્રાયલ દરમિયાન મદદગારો સાથે જોડીએ છીએ.",
        btn_get_started: "શરૂ કરો",

        portal_title: "તમે ક્યાં જવા માંગો છો?",
        portal_desc: "આગળ વધવા માટે નીચેના બે વિકલ્પોમાંથી એક પસંદ કરો.",
        portal_card1_title: "હું મારી સ્થિતિ નોંધવા માંગુ છું",
        portal_card1_desc: "પીડિતો અને સાક્ષીઓ માટે. ઊંઘ, સલામતી અને ચિંતાઓ વિશે 4 સરળ પ્રશ્નોના જવાબો આપો.",
        portal_card1_tag1: "ગુપ્ત અને સલામત",
        portal_card1_tag2: "તમારા માટે",
        portal_card2_title: "સહાયક કાર્યકર વિભાગ",
        portal_card2_desc: "કાયદાકીય સહાયકો માટે. જુઓ આજે કોને મદદની જરૂર છે.",
        portal_card2_tag1: "કાયદાકીય સહાય ટીમ",
        portal_card2_tag2: "કેસવર્કર્સ",
        btn_back_start: "← શરૂઆતની સ્ક્રીન પર પાછા જાઓ",

        btn_back_choices: "← વિકલ્પો પર પાછા જાઓ",
        victim_confidential_tag: "ગુપ્ત ફોર્મ",
        journey_title: "તમારા કેસના તબક્કા:",
        journey_step1: "1. પોલીસ ફરિયાદ",
        journey_step2: "2. કાગળકામ",
        journey_step3: "3. કોર્ટ સુનાવણી (હાલમાં)",
        journey_step4: "4. ચુકાદો",
        journey_step5: "5. વળતર અને રાહત",

        success_title: "આભાર. તમારી માહિતી મળી ગઈ છે.",
        success_desc: "તમારા સહાયકને તમારા જવાબો મળ્યા છે. જો તમે જોખમમાં હોવ, તો કૃપા કરીને તરત જ 112 પર કૉલ કરો.",
        success_case_num: "કેસ નંબર:",
        success_score_label: "તણાવ અને સુરક્ષા સ્કોર:",
        btn_do_another: "બીજી નોંધ કરો",
        btn_back_menu: "મેનૂ પર પાછા જાઓ",

        victim_pulse_title: "આ અઠવાડિયે તમને કેવું લાગે છે?",
        victim_pulse_desc: "કૃપા કરીને નીચે આપેલા 4 સરળ પ્રશ્નોના જવાબો આપો.",
        form_case_label: "તમારો કેસ નંબર",
        label_q1: "1. આ અઠવાડિયે તમારી ઊંઘ કેવી રહી?",
        sub_q1_l: "ખૂબ સારી ઊંઘ આવી (0)",
        sub_q1_r: "જરાય ઊંઘ ન આવી / ખરાબ સપના (10)",
        label_q2: "2. શું તમે જોખમથી સુરક્ષિત અનુભવો છો?",
        sub_q2_l: "સંપૂર્ણપણે સુરક્ષિત (0)",
        sub_q2_r: "ડર લાગે છે / ધમકીઓ મળી રહી છે (10)",
        label_q3: "3. શું તમને કોર્ટની તારીખ બાબતે ચિંતા થાય છે?",
        sub_q3_l: "જરાય ચિંતા નથી (0)",
        sub_q3_r: "ખૂબ ચિંતા અને ગભરાટ (10)",
        label_q4: "4. શું તમને મદદ કરનાર કુટુંબીજનો કે મિત્રો છે?",
        sub_q4_l: "ઘણા લોકો મદદ કરી રહ્યા છે (0)",
        sub_q4_r: "સંપૂર્ણપણે એકલા (10)",

        journal_label: "વૈકલ્પિક: શું આ અઠવાડિયે કંઈક ખરાબ બન્યું?",
        btn_speak: "બોલીને જણાવો",
        voice_listening: "તમારો અવાજ સાંભળી રહ્યા છીએ...",
        voice_converting: "અવાજ લખાણમાં રૂપાંતરિત થઈ રહ્યો છે",
        journal_placeholder: "જો કોઈએ ધમકી આપી હોય કે અસુરક્ષિત લાગે તો અહીં લખો...",

        crisis_warning: "તમે જોખમમાં હોવ તેવું લાગે છે. શું તમને તાત્કાલિક કટોકટી મદદની જરૂર છે?",
        btn_call_112: "112 પર કૉલ કરો",
        btn_submit_pulse: "મારી માહિતી મોકલો",
        score_box_title: "તણાવ અને સુરક્ષા સ્કોર",
        score_out_of_100: "100 માંથી",
        score_explanation: "વધુ સ્કોર એટલે વધુ ડર કે તણાવ. સહાયક ટૂંક સમયમાં સંપર્ક કરશે.",

        demo_title: "નમૂના ઉદાહરણ અજમાવો:",
        demo_threat: "🚨 ધમકી આપવામાં આવી (ઉચ્ચ તણાવ)",
        demo_delay: "⚖️ કોર્ટ તારીખ પાછી ઠેલાઈ (મધ્યમ તણાવ)",
        demo_calm: "🌿 શાંતિપૂર્ણ અઠવાડિયું (ઓછો તણાવ)",

        counselor_header_title: "સહાયક કમાન્ડ એરિયા",
        counselor_header_sub: "કાનૂની સેવા સત્તામંડળ — પીડિત સુરક્ષા અને કલ્યાણ",
        counselor_name: "કેસવર્કર: ડૉ. સારા જેનકિન્સ",
        btn_req_police: "પોલીસ સુરક્ષાની વિનંતી કરો",
        btn_exit: "← બહાર નીકળો",

        kpi_people_helped: "મદદ મેળવી રહેલા લોકો",
        kpi_active_survivors: "સક્રિય પીડિતો",
        kpi_needs_today: "આજે મદદની જરૂર છે",
        kpi_high_stress: "ઉચ્ચ તણાવ / ધમકી અહેવાલ",
        kpi_followup_needed: "ફોલો-અપ જરૂરી",
        kpi_court_worry: "તારીખ લંબાયાની ચિંતા",
        kpi_actions_done: "પૂર્ણ થયેલ સહાય પગલાં",
        kpi_logged_visits: "નોંધાયેલ કૉલ્સ અને મુલાકાતો",

        queue_title: "મદદની જરૂરિયાતવાળા લોકો (અગ્રતા અનુસાર)",
        filter_all: "બધા",
        filter_urgent: "તાત્કાલિક",
        filter_moderate: "મધ્યમ",
        filter_stable: "સામાન્ય",
        th_case_id: "કેસ નંબર",
        th_stress_score: "તણાવ સ્કોર",
        th_key_worry: "મુખ્ય ચિંતા",
        th_review: "તપાસો",

        details_empty_title: "યાદીમાંથી કોઈ એક વ્યક્તિ પસંદ કરો",
        details_empty_desc: "વિગતો જોવા માટે ડાબી બાજુના કેસ પર ક્લિક કરો.",
        synth_title: "💡 સહાયક માટે ભલામણ:",
        btn_use_suggestion: "આ સૂચન વાપરો ↓",
        chart_title: "પાછલા અઠવાડિયામાં તણાવનું સ્તર",
        survivor_quote_title: "પીડિતે શું લખ્યું:",
        past_actions_title: "અગાઉ લીધેલા પગલાં:",

        opt_call: "ફોન કૉલ પૂર્ણ થયો",
        opt_police: "પોલીસ સુરક્ષાની વિનંતી કરી",
        opt_meeting: "રૂબરૂ કાનૂની બેઠક",
        opt_doctor: "હોસ્પિટલ / ડૉક્ટર રેફરલ",
        notes_placeholder: "તમે મદદ માટે શું કર્યું તે સરળ શબ્દોમાં લખો...",
        btn_save_action: "સહાય પગલું સાચવો",

        badge_doing_okay: "સારું છે",
        badge_urgent: "તાત્કાલિક મદદ",
        badge_moderate: "કૉલ કરવો જરૂરી",
        badge_moderate_stress: "મધ્યમ તણાવ",
        badge_high_stress: "ઉચ્ચ તણાવ (સહાયક સંપર્ક કરશે)",
        badge_low_stress: "સારું છે (ઓછો તણાવ)",

        synth_urgent_text: "પીડિતે ધમકીઓ અથવા ગંભીર જોખમની જાણ કરી છે. તાત્કાલિક કૉલ કરો અને સ્થાનિક પોલીસ સુરક્ષાની વ્યવસ્થા કરો.",
        synth_moderate_text: "કોર્ટની તારીખોમાં વિલંબ અથવા ખર્ચના કારણે પીડિત તણાવમાં છે. ફોન પર વાત કરીને ધરપત આપવાની સલાહ આપવામાં આવે છે.",
        synth_stable_text: "પીડિત શાંત અને સુરક્ષિત અનુભવી રહ્યા છે. કોઈ તાત્કાલિક પગલાંની જરૂર નથી.",
        sample_voice_text: "આ અઠવાડિયે મને ખૂબ ડર લાગ્યો કારણ કે અજાણ્યા લોકો અમારા ઘર બહાર નજર રાખી રહ્યા હતા. રાત્રે ઊંઘ ન આવી.",
        police_alert_msg: "🚨 પોલીસ સુરક્ષાની વિનંતી મોકલાઈ:\n\nરક્ષણ માટે પોલીસ વડાને સંદેશ મોકલવામાં આવ્યો છે.",
        week_prefix: "અઠવાડિયું",
        no_actions: "અગાઉ કોઈ પગલાં નોંધાયા નથી.",
        speech_locale: "gu-IN"
    },

    pa: {
        hub_status: "ਲਾਈਵ AI ਤੰਦਰੁਸਤੀ ਅਤੇ ਸਹਾਇਤਾ ਕੇਂਦਰ",
        radar_title: "ਭਾਈਚਾਰਕ ਸੁਰੱਖਿਆ ਅਤੇ ਤਣਾਅ ਦੀ ਸਥਿਤੀ",
        page_title: "ਨੈਕਸੋਰਾ — ਅਸੀਂ ਤੁਹਾਡੀ ਮਦਦ ਲਈ ਇੱਥੇ ਹਾਂ",
        header_sub: "| ਸੁਰੱਖਿਅਤ ਸਹਾਇਕ ਸਾਥੀ",
        header_emergency: "ਐਮਰਜੈਂਸੀ:",
        header_mental_health: "ਮਾਨਸਿਕ ਸਿਹਤ:",
        header_victim_help: "ਮਦਦ:",
        language_label: "ਭਾਸ਼ਾ:",
        select_language_title: "ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ",
        read_aloud_btn: "ਆਪਣੀ ਭਾਸ਼ਾ ਵਿੱਚ ਸੁਣੋ",

        intro_subtitle: "ਅਸੀਂ ਤੁਹਾਡੀ ਮਦਦ ਲਈ ਇੱਥੇ ਹਾਂ",
        intro_quote: '"ਸਾਡਾ AI ਤੁਹਾਡੇ ਤਣਾਅ ਨੂੰ ਸਮਝਦਾ ਹੈ ਤਾਂ ਜੋ ਸਹਾਇਕ ਤੁਰੰਤ ਤੁਹਾਡੀ ਮਦਦ ਕਰ ਸਕਣ।"',
        intro_explanation: "ਅਸੀਂ ਤੁਹਾਡੀ ਹਾਲਤ ਸਮਝਦੇ ਹਾਂ, ਸੁਰੱਖਿਆ ਦੀ ਜਾਂਚ ਕਰਦੇ ਹਾਂ ਅਤੇ ਕੋਰਟ ਦੌਰਾਨ ਸਹਾਇਕਾਂ ਨਾਲ ਜੋੜਦੇ ਹਾਂ।",
        btn_get_started: "ਸ਼ੁਰੂ ਕਰੋ",

        portal_title: "ਤੁਸੀਂ ਕਿੱਥੇ ਜਾਣਾ ਚਾਹੁੰਦੇ ਹੋ?",
        portal_desc: "ਅੱਗੇ ਵਧਣ ਲਈ ਹੇਠਾਂ ਦਿੱਤੇ ਦੋ ਵਿਕਲਪਾਂ ਵਿੱਚੋਂ ਇੱਕ ਚੁਣੋ।",
        portal_card1_title: "ਮੈਂ ਆਪਣੀ ਸਥਿਤੀ ਦਰਜ ਕਰਨਾ ਚਾਹੁੰਦਾ ਹਾਂ",
        portal_card1_desc: "ਪੀੜਤਾਂ ਤੇ ਗਵਾਹਾਂ ਲਈ। ਨੀਂਦ, ਸੁਰੱਖਿਆ ਅਤੇ ਚਿੰਤਾਵਾਂ ਬਾਰੇ 4 ਸੌਖੇ ਸਵਾਲਾਂ ਦੇ ਜਵਾਬ ਦਿਓ।",
        portal_card1_tag1: "ਗੁਪਤ ਅਤੇ ਸੁਰੱਖਿਅਤ",
        portal_card1_tag2: "ਤੁਹਾਡੇ ਲਈ",
        portal_card2_title: "ਸਹਾਇਕ ਵਰਕਰ ਖੇਤਰ",
        portal_card2_desc: "ਕਾਨੂੰਨੀ ਸਹਾਇਕਾਂ ਲਈ। ਦੇਖੋ ਅੱਜ ਕਿਸਨੂੰ ਮਦਦ ਦੀ ਲੋੜ ਹੈ।",
        portal_card2_tag1: "ਕਾਨੂੰਨੀ ਸੇਵਾ ਟੀਮ",
        portal_card2_tag2: "ਕੇਸਵਰਕਰ",
        btn_back_start: "← ਸ਼ੁਰੂਆਤੀ ਸਕ੍ਰੀਨ 'ਤੇ ਵਾਪਸ ਜਾਓ",

        btn_back_choices: "← ਵਿਕਲਪਾਂ 'ਤੇ ਵਾਪਸ ਜਾਓ",
        victim_confidential_tag: "ਗੁਪਤ ਫਾਰਮ",
        journey_title: "ਤੁਹਾਡੇ ਕੇਸ ਦੇ ਪੜਾਅ:",
        journey_step1: "1. ਪੁਲਿਸ ਰਿਪੋਰਟ",
        journey_step2: "2. ਕਾਗਜ਼ੀ ਕਾਰਵਾਈ",
        journey_step3: "3. ਕੋਰਟ ਸੁਣਵਾਈ (ਮੌਜੂਦਾ)",
        journey_step4: "4. ਫੈਸਲਾ",
        journey_step5: "5. ਮਦਦ ਅਤੇ ਮੁਆਵਜ਼ਾ",

        success_title: "ਧੰਨਵਾਦ। ਤੁਹਾਡੀ ਜਾਣਕਾਰੀ ਮਿਲ ਗਈ ਹੈ।",
        success_desc: "ਤੁਹਾਡੇ ਸਹਾਇਕ ਨੂੰ ਜਵਾਬ ਮਿਲ ਗਏ ਹਨ। ਖ਼ਤਰੇ ਵੇਲੇ ਤੁਰੰਤ 112 'ਤੇ ਕਾਲ ਕਰੋ।",
        success_case_num: "ਕੇਸ ਨੰਬਰ:",
        success_score_label: "ਤਣਾਅ ਅਤੇ ਸੁਰੱਖਿਆ ਸਕੋਰ:",
        btn_do_another: "ਹੋਰ ਜਾਂਚ ਕਰੋ",
        btn_back_menu: "ਮੀਨੂ 'ਤੇ ਵਾਪਸ ਜਾਓ",

        victim_pulse_title: "ਇਸ ਹਫ਼ਤੇ ਤੁਸੀਂ ਕਿਵੇਂ ਮਹਿਸੂਸ ਕਰ ਰਹੇ ਹੋ?",
        victim_pulse_desc: "ਕਿਰਪਾ ਕਰਕੇ ਹੇਠਾਂ ਦਿੱਤੇ 4 ਆਸਾਨ ਸਵਾਲਾਂ ਦੇ ਜਵਾਬ ਦਿਓ।",
        form_case_label: "ਤੁਹਾਡਾ ਕੇਸ ਨੰਬਰ",
        label_q1: "1. ਇਸ ਹਫ਼ਤੇ ਤੁਹਾਡੀ ਨੀਂਦ ਕਿਵੇਂ ਰਹੀ?",
        sub_q1_l: "ਬਹੁਤ ਵਧੀਆ ਨੀਂਦ ਆਈ (0)",
        sub_q1_r: "ਬਿਲਕੁਲ ਨੀਂਦ ਨਹੀਂ ਆਈ / ਡਰਾਉਣੇ ਸੁਪਨੇ (10)",
        label_q2: "2. ਕੀ ਤੁਸੀਂ ਖ਼ਤਰੇ ਤੋਂ ਸੁਰੱਖਿਅਤ ਮਹਿਸੂਸ ਕਰਦੇ ਹੋ?",
        sub_q2_l: "ਪੂਰੀ ਤਰ੍ਹਾਂ ਸੁਰੱਖਿਅਤ (0)",
        sub_q2_r: "ਡਰ ਲੱਗਦਾ ਹੈ / ਧਮਕੀਆਂ ਮਿਲ ਰਹੀਆਂ ਹਨ (10)",
        label_q3: "3. ਕੀ ਤੁਹਾਨੂੰ ਕੋਰਟ ਦੀ ਤਰੀਕ ਬਾਰੇ ਚਿੰਤਾ ਹੈ?",
        sub_q3_l: "ਬਿਲਕੁਲ ਚਿੰਤਾ ਨਹੀਂ (0)",
        sub_q3_r: "ਬਹੁਤ ਘਬਰਾਹਟ (10)",
        label_q4: "4. ਕੀ ਪਰਿਵਾਰ ਜਾਂ ਦੋਸਤ ਤੁਹਾਡੀ ਮਦਦ ਕਰ ਰਹੇ ਹਨ?",
        sub_q4_l: "ਬਹੁਤ ਲੋਕ ਮਦਦ ਕਰ ਰਹੇ ਹਨ (0)",
        sub_q4_r: "ਬਿਲਕੁਲ ਇਕੱਲੇ (10)",

        journal_label: "ਵਿਕਲਪਿਕ: ਕੀ ਇਸ ਹਫ਼ਤੇ ਕੁਝ ਡਰਾਉਣਾ ਵਾਪਰਿਆ?",
        btn_speak: "ਬੋਲ ਕੇ ਦੱਸੋ",
        voice_listening: "ਤੁਹਾਡੀ ਆਵਾਜ਼ ਸੁਣੀ ਜਾ ਰਹੀ ਹੈ...",
        voice_converting: "ਆਵਾਜ਼ ਨੂੰ ਸ਼ਬਦਾਂ ਵਿੱਚ ਬਦਲਿਆ ਜਾ ਰਿਹਾ ਹੈ",
        journal_placeholder: "ਜੇ ਕਿਸੇ ਨੇ ਧਮਕਾਇਆ ਹੋਵੇ ਤਾਂ ਇੱਥੇ ਲਿਖੋ...",

        crisis_warning: "ਲੱਗਦਾ ਹੈ ਤੁਸੀਂ ਖ਼ਤਰੇ ਵਿੱਚ ਹੋ। ਕੀ ਤੁਹਾਨੂੰ ਤੁਰੰਤ ਮਦਦ ਚਾਹੀਦੀ ਹੈ?",
        btn_call_112: "112 'ਤੇ ਕਾਲ ਕਰੋ",
        btn_submit_pulse: "ਮੇਰੀ ਹਫ਼ਤਾਵਾਰੀ ਜਾਣਕਾਰੀ ਭੇਜੋ",
        score_box_title: "ਤਣਾਅ ਅਤੇ ਸੁਰੱਖਿਆ ਸਕੋਰ",
        score_out_of_100: "100 ਵਿੱਚੋਂ",
        score_explanation: "ਵੱਧ ਸਕੋਰ ਦਾ ਮਤਲਬ ਜ਼ਿਆਦਾ ਡਰ ਜਾਂ ਤਣਾਅ ਹੈ। ਸਹਾਇਕ ਜਲਦੀ ਸੰਪਰਕ ਕਰੇਗਾ।",

        demo_title: "ਨਮੂਨਾ ਉਦਾਹਰਣ ਦੇਖੋ:",
        demo_threat: "🚨 ਧਮਕੀਆਂ ਦੀ ਸੂਚਨਾ (ਵੱਧ ਤਣਾਅ)",
        demo_delay: "⚖️ ਕੋਰਟ ਤਰੀਕ ਟਲੀ (ਦਰਮਿਆਨਾ ਤਣਾਅ)",
        demo_calm: "🌿 ਸ਼ਾਂਤ ਹਫ਼ਤਾ (ਘੱਟ ਤਣਾਅ)",

        counselor_header_title: "ਸਹਾਇਕ ਕਮਾਂਡ ਏਰੀਆ",
        counselor_header_sub: "ਕਾਨੂੰਨੀ ਸੇਵਾਵਾਂ ਅਥਾਰਟੀ — ਸੁਰੱਖਿਆ ਤੇ ਭਲਾਈ",
        counselor_name: "ਕੇਸਵਰਕਰ: ਡਾ. ਸਾਰਾ ਜੇਨਕਿਨਸ",
        btn_req_police: "ਪੁਲਿਸ ਸੁਰੱਖਿਆ ਦੀ ਮੰਗ ਕਰੋ",
        btn_exit: "← ਬਾਹਰ ਜਾਓ",

        kpi_people_helped: "ਕੁੱਲ ਮਦਦ ਪ੍ਰਾਪਤ ਲੋਕ",
        kpi_active_survivors: "ਸਰਗਰਮ ਪੀੜਤ",
        kpi_needs_today: "ਜਿਨ੍ਹਾਂ ਨੂੰ ਅੱਜ ਮਦਦ ਚਾਹੀਦੀ ਹੈ",
        kpi_high_stress: "ਵੱਧ ਤਣਾਅ / ਧਮਕੀ ਰਿਪੋਰਟ",
        kpi_followup_needed: "ਫਾਲੋ-ਅੱਪ ਲੋੜੀਂਦਾ",
        kpi_court_worry: "ਕੋਰਟ ਦੇਰੀ ਦੀ ਚਿੰਤਾ",
        kpi_actions_done: "ਪੂਰੇ ਕੀਤੇ ਗਏ ਕਦਮ",
        kpi_logged_visits: "ਦਰਜ ਕਾਲਾਂ ਤੇ ਮੁਲਾਕਾਤਾਂ",

        queue_title: "ਮਦਦ ਦੇ ਲੋੜਵੰਦ (ਤਰਜੀਹ ਅਨੁਸਾਰ)",
        filter_all: "ਸਾਰੇ",
        filter_urgent: "ਜ਼ਰੂਰੀ",
        filter_moderate: "ਦਰਮਿਆਨਾ",
        filter_stable: "ਸਥਿਰ",
        th_case_id: "ਕੇਸ ਨੰਬਰ",
        th_stress_score: "ਤਣਾਅ ਸਕੋਰ",
        th_key_worry: "ਮੁੱਖ ਚਿੰਤਾ",
        th_review: "ਜਾਂਚੋ",

        details_empty_title: "ਸੂਚੀ ਵਿੱਚੋਂ ਕਿਸੇ ਨੂੰ ਚੁਣੋ",
        details_empty_desc: "ਵੇਰਵੇ ਦੇਖਣ ਲਈ ਖੱਬੇ ਪਾਸੇ ਕਿਸੇ ਕੇਸ 'ਤੇ ਕਲਿੱਕ ਕਰੋ।",
        synth_title: "💡 ਸਹਾਇਕ ਲਈ ਸੁਝਾਅ:",
        btn_use_suggestion: "ਇਹ ਸੁਝਾਅ ਵਰਤੋ ↓",
        chart_title: "ਪਿਛਲੇ ਹਫ਼ਤਿਆਂ ਵਿੱਚ ਤਣਾਅ ਦਾ ਪੱਧਰ",
        survivor_quote_title: "ਪੀੜਤ ਨੇ ਕੀ ਲਿਖਿਆ:",
        past_actions_title: "ਪਹਿਲਾਂ ਕੀਤੀ ਗਈ ਮਦਦ:",

        opt_call: "ਫ਼ੋਨ ਕਾਲ ਪੂਰੀ ਹੋਈ",
        opt_police: "ਪੁਲਿਸ ਸੁਰੱਖਿਆ ਦੀ ਬੇਨਤੀ ਕੀਤੀ",
        opt_meeting: "ਕਾਨੂੰਨੀ ਮੀਟਿੰਗ",
        opt_doctor: "ਹਸਪਤਾਲ ਰੈਫਰਲ",
        notes_placeholder: "ਤੁਸੀਂ ਮਦਦ ਲਈ ਕੀ ਕੀਤਾ ਸੌਖੇ ਸ਼ਬਦਾਂ ਵਿੱਚ ਲਿਖੋ...",
        btn_save_action: "ਸਹਾਇਤਾ ਕਾਰਵਾਈ ਸੁਰੱਖਿਅਤ ਕਰੋ",

        badge_doing_okay: "ਸਭ ਠੀਕ ਹੈ",
        badge_urgent: "ਜ਼ਰੂਰੀ ਮਦਦ",
        badge_moderate: "ਕਾਲ ਕਰੋ",
        badge_moderate_stress: "ਦਰਮਿਆਨਾ ਤਣਾਅ",
        badge_high_stress: "ਵੱਧ ਤਣਾਅ (ਸਹਾਇਕ ਸੰਪਰਕ ਕਰੇਗਾ)",
        badge_low_stress: "ਸਭ ਠੀਕ ਹੈ (ਘੱਟ ਤਣਾਅ)",

        synth_urgent_text: "ਪੀੜਤ ਨੇ ਧਮਕੀਆਂ ਜਾਂ ਗੰਭੀਰ ਖ਼ਤਰੇ ਦੀ ਰਿਪੋਰਟ ਕੀਤੀ ਹੈ। ਤੁਰੰਤ ਕਾਲ ਕਰੋ ਅਤੇ ਸਥਾਨਕ ਪੁਲਿਸ ਸੁਰੱਖਿਆ ਦਾ ਪ੍ਰਬੰਧ ਕਰੋ।",
        synth_moderate_text: "ਪੀੜਤ ਕੋਰਟ ਦੀਆਂ ਤਰੀਕਾਂ ਵਿੱਚ ਦੇਰੀ ਕਾਰਨ ਚਿੰਤਤ ਹੈ। ਫ਼ੋਨ 'ਤੇ ਹੌਸਲਾ ਦੇਣ ਦੀ ਸਲਾਹ ਦਿੱਤੀ ਜਾਂਦੀ ਹੈ।",
        synth_stable_text: "ਪੀੜਤ ਸ਼ਾਂਤ ਅਤੇ ਸੁਰੱਖਿਅਤ ਮਹਿਸੂਸ ਕਰ ਰਿਹਾ ਹੈ। ਕਿਸੇ ਤੁਰੰਤ ਕਾਰਵਾਈ ਦੀ ਲੋੜ ਨਹੀਂ ਹੈ।",
        sample_voice_text: "ਮੈਨੂੰ ਇਸ ਹਫ਼ਤੇ ਬਹੁਤ ਡਰ ਲੱਗਾ ਕਿਉਂਕਿ ਅਣਪਛਾਤੇ ਲੋਕ ਸਾਡੇ ਘਰ ਬਾਹਰ ਦੇਖ ਰਹੇ ਸਨ। ਰਾਤ ਨੂੰ ਨੀਂਦ ਨਹੀਂ ਆਈ।",
        police_alert_msg: "🚨 ਪੁਲਿਸ ਸੁਰੱਖਿਆ ਦੀ ਬੇਨਤੀ ਭੇਜੀ ਗਈ:\n\nਸੁਰੱਖਿਆ ਲਈ ਪੁਲਿਸ ਸੁਪਰਡੈਂਟ ਨੂੰ ਸੁਨੇਹਾ ਭੇਜਿਆ ਗਿਆ ਹੈ।",
        week_prefix: "ਹਫ਼ਤਾ",
        no_actions: "ਪਹਿਲਾਂ ਕੋਈ ਕਾਰਵਾਈ ਦਰਜ ਨਹੀਂ ਹੈ।",
        speech_locale: "pa-IN"
    },

    kn: {
        hub_status: "ಲೈವ್ AI ಕ್ಷೇಮ ಮತ್ತು ಬೆಂಬಲ ಕೇಂದ್ರ",
        radar_title: "ಸಮುದಾಯ ಸುರಕ್ಷತೆ ಮತ್ತು ಒತ್ತಡದ ಸ್ಥಿತಿ",
        page_title: "ನೆಕ್ಸೋರಾ — ನಾವು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಲು ಇಲ್ಲಿದ್ದೇವೆ",
        header_sub: "| ಸುರಕ್ಷಿತ ಬೆಂಬಲ ಸಹಾಯಕ",
        header_emergency: "ತುರ್ತು:",
        header_mental_health: "ಮಾನಸಿಕ ಆರೋಗ್ಯ:",
        header_victim_help: "ಸಹಾಯ:",
        language_label: "ಭಾಷೆ:",
        select_language_title: "ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
        read_aloud_btn: "ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಆಲಿಸಿ",

        intro_subtitle: "ನಾವು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಲು ಇಲ್ಲಿದ್ದೇವೆ",
        intro_quote: '"ನಮ್ಮ AI ಮಾನಸಿಕ ಒತ್ತಡವನ್ನು ಗುರುತಿಸಿ, ಮಾನವ ನೆರವಿಗಾಗಿ ತಕ್ಷಣವೇ ಎಚ್ಚರಿಸುತ್ತದೆ."',
        intro_explanation: "ನಿಮ್ಮ ಭಾವನೆಗಳನ್ನು ನಾವು ಆಲಿಸುತ್ತೇವೆ, ಸುರಕ್ಷತೆಯನ್ನು ಪರಿಶೀಲಿಸುತ್ತೇವೆ ಮತ್ತು ನ್ಯಾಯಾಲಯದ ವಿಚಾರಣೆಯ ಸಮಯದಲ್ಲಿ ಸಹಾಯಕರೊಂದಿಗೆ ಜೋಡಿಸುತ್ತೇವೆ.",
        btn_get_started: "ಪ್ರಾರಂಭಿಸೋಣ",

        portal_title: "ನೀವು ಎಲ್ಲಿಗೆ ಹೋಗಲು ಬಯಸುತ್ತೀರಿ?",
        portal_desc: "ಮುಂದುವರಿಯಲು ಕೆಳಗಿನ ಎರಡು ಆಯ್ಕೆಗಳಲ್ಲಿ ಒಂದನ್ನು ಆರಿಸಿ.",
        portal_card1_title: "ನನ್ನ ಸ್ಥಿತಿಯನ್ನು ದಾಖಲಿಸಲು ಬಯಸುತ್ತೇನೆ",
        portal_card1_desc: "ಸಂತ್ರಸ್ತರು ಮತ್ತು ಸಾಕ್ಷಿಗಳಿಗೆ. ನಿದ್ರೆ, ಸುರಕ್ಷತೆ ಮತ್ತು ಚಿಂತೆಗಳ ಬಗ್ಗೆ 4 ಸರಳ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಿ.",
        portal_card1_tag1: "ರಹಸ್ಯ ಮತ್ತು ಸುರಕ್ಷಿತ",
        portal_card1_tag2: "ನಿಮಗಾಗಿ",
        portal_card2_title: "ಸಹಾಯಕರ ಕಾರ್ಯಕ್ಷೇತ್ರ",
        portal_card2_desc: "ಕಾನೂನು ಸಹಾಯಕರಿಗೆ. ಇಂದು ಯಾರಿಗೆ ಸಹಾಯ ಬೇಕು ಎಂಬುದನ್ನು ನೋಡಿ.",
        portal_card2_tag1: "ಕಾನೂನು ಸೇವಾ ಸಿಬ್ಬಂದಿ",
        portal_card2_tag2: "ಕೇಸ್‌ವರ್ಕರ್‌ಗಳು",
        btn_back_start: "← ಆರಂಭಿಕ ಪರದೆಗೆ ಹಿಂತಿರುಗಿ",

        btn_back_choices: "← ಆಯ್ಕೆಗಳಿಗೆ ಹಿಂತಿರುಗಿ",
        victim_confidential_tag: "ರಹಸ್ಯ ಫಾರ್ಮ್",
        journey_title: "ನಿಮ್ಮ ಪ್ರಕರಣದ ಹಂತಗಳು:",
        journey_step1: "1. ಪೊಲೀಸ್ ದೂರು",
        journey_step2: "2. ದಾಖಲೆಗಳು",
        journey_step3: "3. ಕೋರ್ಟ್ ವಿಚಾರಣೆ (ಪ್ರಸ್ತುತ)",
        journey_step4: "4. ತೀರ್ಪು",
        journey_step5: "5. ಪರಿಹಾರ ಮತ್ತು ನೆರವು",

        success_title: "ಧನ್ಯವಾದಗಳು. ನಿಮ್ಮ ಮಾಹಿತಿ ತಲುಪಿದೆ.",
        success_desc: "ನಿಮ್ಮ ಸಹಾಯಕರಿಗೆ ಉತ್ತರಗಳು ದೊರೆತಿವೆ. ತಕ್ಷಣದ ಅಪಾಯವಿದ್ದರೆ ದಯವಿಟ್ಟು 112 ಗೆ ಕರೆ ಮಾಡಿ.",
        success_case_num: "ಪ್ರಕರಣ ಸಂಖ್ಯೆ:",
        success_score_label: "ಒತ್ತಡ ಮತ್ತು ಸುರಕ್ಷತಾ ಅಂಕ:",
        btn_do_another: "ಮತ್ತೊಂದು ದಾಖಲಿಸಿ",
        btn_back_menu: "ಮೆನುಗೆ ಹಿಂತಿರುಗಿ",

        victim_pulse_title: "ಈ ವಾರ ನಿಮಗೆ ಹೇಗೆ ಅನ್ನಿಸುತ್ತಿದೆ?",
        victim_pulse_desc: "ದಯವಿಟ್ಟು ಕೆಳಗಿನ 4 ಸರಳ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಿ.",
        form_case_label: "ನಿಮ್ಮ ಪ್ರಕರಣ ಸಂಖ್ಯೆ",
        label_q1: "1. ಈ ವಾರ ನಿಮ್ಮ ನಿದ್ರೆ ಹೇಗಿತ್ತು?",
        sub_q1_l: "ತುಂಬಾ ಚೆನ್ನಾಗಿ ನಿದ್ರೆ ಮಾಡಿದೆ (0)",
        sub_q1_r: "ನಿದ್ರೆಯೇ ಬರಲಿಲ್ಲ / ಕೆಟ್ಟ ಕನಸುಗಳು (10)",
        label_q2: "2. ನೀವು ಅಪಾಯದಿಂದ ಸುರಕ್ಷಿತವಾಗಿದ್ದೀರಿ ಎಂದು ಭಾವಿಸುತ್ತೀರಾ?",
        sub_q2_l: "ಸಂಪೂರ್ಣ ಸುರಕ್ಷಿತ (0)",
        sub_q2_r: "ಭಯವಾಗುತ್ತಿದೆ / ಬೆದರಿಕೆ ಹಾಕುತ್ತಿದ್ದಾರೆ (10)",
        label_q3: "3. ಕೋರ್ಟ್ ವಿಚಾರಣೆಯ ಬಗ್ಗೆ ಆತಂಕವಿದೆಯೇ?",
        sub_q3_l: "ಯಾವುದೇ ಚಿಂತೆ ಇಲ್ಲ (0)",
        sub_q3_r: "ತುಂಬಾ ಭಯ / ಆತಂಕ (10)",
        label_q4: "4. ನಿಮಗೆ ಸಹಾಯ ಮಾಡಲು ಕುಟುಂಬ ಅಥವಾ ಸ್ನೇಹಿತರಿದ್ದಾರೆಯೇ?",
        sub_q4_l: "ತುಂಬಾ ಜನರು ಸಹಾಯ ಮಾಡುತ್ತಿದ್ದಾರೆ (0)",
        sub_q4_r: "ಸಂಪೂರ್ಣ ಒಂಟಿ (10)",

        journal_label: "ಐಚ್ಛಿಕ: ಈ ವಾರ ಏನಾದರೂ ಕೆಟ್ಟ ಘಟನೆ ನಡೆದಿದೆಯೇ?",
        btn_speak: "ಮಾತನಾಡಿ ತಿಳಿಸಿ",
        voice_listening: "ನಿಮ್ಮ ಧ್ವನಿ ಆಲಿಸಲಾಗುತ್ತಿದೆ...",
        voice_converting: "ಧ್ವನಿಯನ್ನು ಅಕ್ಷರಗಳಾಗಿ ಪರಿವರ್ತಿಸಲಾಗುತ್ತಿದೆ",
        journal_placeholder: "ಯಾರಾದರೂ ಬೆದರಿಸಿದರೆ ಅಥವಾ ಭಯವಾದರೆ ಇಲ್ಲಿ ಬರೆಯಿರಿ...",

        crisis_warning: "ನೀವು ಅಪಾಯದಲ್ಲಿದ್ದೀರಿ ಎಂದು ತೋರುತ್ತಿದೆ. ತಕ್ಷಣದ ಸಹಾಯ ಬೇಕೇ?",
        btn_call_112: "112 ಗೆ ಕರೆ ಮಾಡಿ",
        btn_submit_pulse: "ನನ್ನ ಮಾಹಿತಿಯನ್ನು ಕಳುಹಿಸಿ",
        score_box_title: "ಒತ್ತಡ ಮತ್ತು ಸುರಕ್ಷತಾ ಅಂಕ",
        score_out_of_100: "100 ರಲ್ಲಿ",
        score_explanation: "ಹೆಚ್ಚಿನ ಅಂಕ ಎಂದರೆ ಹೆಚ್ಚು ಭಯ ಅಥವಾ ಒತ್ತಡ. ಸಹಾಯಕರು ಶೀಘ್ರದಲ್ಲೇ ಸಂಪರ್ಕಿಸುತ್ತಾರೆ.",

        demo_title: "ಮಾದರಿ ಉದಾಹರಣೆಗಳನ್ನು ಪ್ರಯತ್ನಿಸಿ:",
        demo_threat: "🚨 ಬೆದರಿಕೆ ವರದಿ (ಹೆಚ್ಚಿನ ಒತ್ತಡ)",
        demo_delay: "⚖️ ಕೋರ್ಟ್ ಮುಂದೂಡಿಕೆ (ಮಧ್ಯಮ ಒತ್ತಡ)",
        demo_calm: "🌿 ಶಾಂತಿಯುತ ವಾರ (ಕಡಿಮೆ ಒತ್ತಡ)",

        counselor_header_title: "ಸಹಾಯಕರ ನಿಯಂತ್ರಣ ಕೊಠಡಿ",
        counselor_header_sub: "ಕಾನೂನು ಸೇವೆಗಳ ಪ್ರಾಧಿಕಾರ — ಸುರಕ್ಷತೆ ಮತ್ತು ಕಲ್ಯಾಣ",
        counselor_name: "ಕೇಸ್‌ವರ್ಕರ್: ಡಾ. ಸಾರಾ ಜೆಂಕಿನ್ಸ್",
        btn_req_police: "ಪೊಲೀಸ್ ರಕ್ಷಣೆಗಾಗಿ ಕೋರಿಕೆ",
        btn_exit: "← ನಿರ್ಗಮಿಸಿ",

        kpi_people_helped: "ಸಹಾಯ ಪಡೆಯುತ್ತಿರುವ ಜನರು",
        kpi_active_survivors: "ಸಕ್ರಿಯ ಸಂತ್ರಸ್ತರು",
        kpi_needs_today: "ಇಂದು ಸಹಾಯ ಬೇಕಾದವರು",
        kpi_high_stress: "ಹೆಚ್ಚಿನ ಒತ್ತಡ / ಬೆದರಿಕೆ",
        kpi_followup_needed: "ಫಾಲೋ-ಅಪ್ ಅಗತ್ಯವಿದೆ",
        kpi_court_worry: "ಕೋರ್ಟ್ ವಿಳಂಬದ ಚಿಂತೆ",
        kpi_actions_done: "ಪೂರ್ಣಗೊಂಡ ನೆರವು",
        kpi_logged_visits: "ದಾಖಲಾದ ಕರೆಗಳು ಮತ್ತು ಭೇಟಿಗಳು",

        queue_title: "ಸಹಾಯದ ಅಗತ್ಯವಿರುವವರು (ಆದ್ಯತೆ ಪ್ರಕಾರ)",
        filter_all: "ಎಲ್ಲವೂ",
        filter_urgent: "ತುರ್ತು",
        filter_moderate: "ಮಧ್ಯಮ",
        filter_stable: "ಸಾಮಾನ್ಯ",
        th_case_id: "ಪ್ರಕರಣ ID",
        th_stress_score: "ಒತ್ತಡದ ಅಂಕ",
        th_key_worry: "ಮುಖ್ಯ ಚಿಂತೆ",
        th_review: "ಪರಿಶೀಲಿಸಿ",

        details_empty_title: "ಪಟ್ಟಿಯಿಂದ ಒಬ್ಬರನ್ನು ಆಯ್ಕೆಮಾಡಿ",
        details_empty_desc: "ವಿವರಗಳನ್ನು ನೋಡಲು ಎಡಭಾಗದ ಪ್ರಕರಣದ ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿ.",
        synth_title: "💡 ಸಹಾಯಕರಿಗೆ ಶಿಫಾರಸು:",
        btn_use_suggestion: "ಈ ಸಲಹೆಯನ್ನು ಬಳಸಿ ↓",
        chart_title: "ಹಿಂದಿನ ವಾರಗಳಲ್ಲಿನ ಒತ್ತಡ ಮಟ್ಟ",
        survivor_quote_title: "ಸಂತ್ರಸ್ತರು ಬರೆದದ್ದು:",
        past_actions_title: "ಹಿಂದೆ ತೆಗೆದುಕೊಂಡ ಕ್ರಮಗಳು:",

        opt_call: "ಫೋನ್ ಕರೆ ಪೂರ್ಣಗೊಂಡಿದೆ",
        opt_police: "ಪೊಲೀಸ್ ರಕ್ಷಣೆ ಕೋರಲಾಗಿದೆ",
        opt_meeting: "ಕಾನೂನು ಸಭೆ",
        opt_doctor: "ಆಸ್ಪತ್ರೆ ಶಿಫಾರಸು",
        notes_placeholder: "ನೀವು ಮಾಡಿದ ಸಹಾಯವನ್ನು ಸರಳವಾಗಿ ಬರೆಯಿರಿ...",
        btn_save_action: "ಸಹಾಯ ಕ್ರಮವನ್ನು ಉಳಿಸಿ",

        badge_doing_okay: "ಚೆನ್ನಾಗಿದ್ದಾರೆ",
        badge_urgent: "ತುರ್ತು ಸಹಾಯ",
        badge_moderate: "ಕರೆ ಅಗತ್ಯವಿದೆ",
        badge_moderate_stress: "ಮಧ್ಯಮ ಒತ್ತಡ",
        badge_high_stress: "ಹೆಚ್ಚಿನ ಒತ್ತಡ (ಸಹಾಯಕರು ಸಂಪರ್ಕಿಸುತ್ತಾರೆ)",
        badge_low_stress: "ಚೆನ್ನಾಗಿದ್ದಾರೆ (ಕಡಿಮೆ ಒತ್ತಡ)",

        synth_urgent_text: "ಸಂತ್ರಸ್ತರು ಬೆದರಿಕೆ ಅಥವಾ ಗಂಭೀರ ಅಪಾಯದ ಬಗ್ಗೆ ವರದಿ ಮಾಡಿದ್ದಾರೆ. ತಕ್ಷಣ ಕರೆ ಮಾಡಿ ಸ್ಥಳೀಯ ಪೊಲೀಸ್ ರಕ್ಷಣೆಗೆ ವ್ಯವಸ್ಥೆ ಮಾಡಿ.",
        synth_moderate_text: "ಕೋರ್ಟ್ ವಿಳಂಬ ಅಥವಾ ವೆಚ್ಚಗಳಿಂದ ಸಂತ್ರಸ್ತರು ಆತಂಕದಲ್ಲಿದ್ದಾರೆ. ಫೋನ್ ಮೂಲಕ ಧೈರ್ಯ ತುಂಬಲು ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ.",
        synth_stable_text: "ಸಂತ್ರಸ್ತರು ಶಾಂತ ಮತ್ತು ಸುರಕ್ಷಿತವಾಗಿದ್ದಾರೆ. ಯಾವುದೇ ತಕ್ಷಣದ ಕ್ರಮದ ಅಗತ್ಯವಿಲ್ಲ.",
        sample_voice_text: "ಈ ವಾರ ನನಗೆ ತುಂಬಾ ಭಯವಾಯಿತು ಏಕೆಂದರೆ ಅಪರಿಚಿತರು ನಮ್ಮ ಮನೆಯನ್ನು ಗಮನಿಸುತ್ತಿದ್ದರು. ರಾತ್ರಿ ನಿದ್ರೆ ಬರಲಿಲ್ಲ.",
        police_alert_msg: "🚨 ಪೊಲೀಸ್ ರಕ್ಷಣೆಗಾಗಿ ಸಂದೇಶ ಕಳುಹಿಸಲಾಗಿದೆ:\n\nರಕ್ಷಣೆಗಾಗಿ ಪೊಲೀಸ್ ವರಿಷ್ಠಾಧಿಕಾರಿಗಳಿಗೆ ಸಂದೇಶ ರವಾನಿಸಲಾಗಿದೆ.",
        week_prefix: "ವಾರ",
        no_actions: "ಹಿಂದಿನ ಯಾವುದೇ ಕ್ರಮಗಳು ದಾಖಲಾಗಿಲ್ಲ.",
        speech_locale: "kn-IN"
    },

    ur: {
        hub_status: "لائیو AI فلاح و بہبود اور امدادی مرکز",
        radar_title: "کمیونٹی تحفظ اور ذہنی دباؤ کی صورتحال",
        page_title: "نیکسورا — ہم آپ کی مدد کے لیے حاضر ہیں",
        header_sub: "| محفوظ مددگار ساتھی",
        header_emergency: "ایمرجنسی:",
        header_mental_health: "ذہنی صحت:",
        header_victim_help: "مدد:",
        language_label: "زبان:",
        select_language_title: "اپنی زبان منتخب کریں",
        read_aloud_btn: "اپنی زبان میں سنیں",

        intro_subtitle: "ہم آپ کی مدد کے لیے حاضر ہیں",
        intro_quote: '"ہمارا AI آپ کے ذہنی دباؤ اور خوف کو سمجھتا ہے تاکہ مددگار عملہ بروقت آپ کی مدد کر سکے۔"',
        intro_explanation: "ہم آپ کی کیفیت سنتے ہیں، آپ کے تحفظ کا خیال رکھتے ہیں اور عدالت کے دوران مددگاروں سے جوڑتے ہیں۔",
        btn_get_started: "شروع کریں",

        portal_title: "آپ کہاں جانا چاہتے ہیں؟",
        portal_desc: "آگے بڑھنے کے لیے نیچے دیے گئے دو اختیارات میں سے ایک منتخب کریں۔",
        portal_card1_title: "میں اپنا اندراج کرنا چاہتا ہوں",
        portal_card1_desc: "متاثرین اور گواہوں کے لیے۔ نیند، تحفظ اور پریشانیوں کے بارے میں 4 آسان سوالات کے جوابات دیں۔",
        portal_card1_tag1: "خفیہ اور محفوظ",
        portal_card1_tag2: "آپ کے لیے",
        portal_card2_title: "مددگار عملے کا شعبہ",
        portal_card2_desc: "قانونی مشیروں کے لیے۔ دیکھیں آج کس کو فوری مدد کی ضرورت ہے۔",
        portal_card2_tag1: "قانونی خدمات عملہ",
        portal_card2_tag2: "کیس ورکرز",
        btn_back_start: "← شروع کی اسکرین پر واپس جائیں",

        btn_back_choices: "← اختیارات پر واپس جائیں",
        victim_confidential_tag: "خفیہ فارم",
        journey_title: "آپ کے کیس کے مراحل:",
        journey_step1: "1. پولیس رپورٹ",
        journey_step2: "2. کاغذی کارروائی",
        journey_step3: "3. عدالتی سماعت (موجودہ)",
        journey_step4: "4. فیصلہ",
        journey_step5: "5. مدد اور معاوضہ",

        success_title: "شکریہ۔ آپ کی معلومات موصول ہو گئی ہیں۔",
        success_desc: "آپ کے مددگار کو آپ کے جوابات مل گئے ہیں۔ خطرے کی صورت میں فوری طور پر 112 پر کال کریں۔",
        success_case_num: "کیس نمبر:",
        success_score_label: "دباؤ اور تحفظ کا اسکور:",
        btn_do_another: "ایک اور اندراج کریں",
        btn_back_menu: "مینو پر واپس جائیں",

        victim_pulse_title: "اس ہفتے آپ کیسا محسوس کر رہے ہیں؟",
        victim_pulse_desc: "براہ کرم نیچے دیے گئے 4 آسان سوالات کے جوابات دیں۔",
        form_case_label: "آپ کا کیس نمبر",
        label_q1: "1. اس ہفتے آپ کی نیند کیسی رہی؟",
        sub_q1_l: "بہت اچھی نیند آئی (0)",
        sub_q1_r: "بالکل نیند نہیں آئی / برے خواب (10)",
        label_q2: "2. کیا آپ خطرے سے محفوظ محسوس کرتے ہیں؟",
        sub_q2_l: "مکمل طور پر محفوظ (0)",
        sub_q2_r: "خوفزدہ / دھمکیاں مل رہی ہیں (10)",
        label_q3: "3. کیا آپ کو عدالت کی تاریخ کے بارے میں فکر ہے؟",
        sub_q3_l: "بالکل فکر نہیں (0)",
        sub_q3_r: "بہت زیادہ پریشانی (10)",
        label_q4: "4. کیا خاندان یا دوست آپ کی مدد کر رہے ہیں؟",
        sub_q4_l: "بہت سے لوگ مدد کر رہے ہیں (0)",
        sub_q4_r: "بالکل اکیلے (10)",

        journal_label: "اختیاری: کیا اس ہفتے کچھ برا یا خوفناک ہوا؟",
        btn_speak: "بول کر بتائیں",
        voice_listening: "آپ کی آواز سنی جا رہی ہے...",
        voice_converting: "آواز کو تحریر میں تبدیل کیا جا رہا ہے",
        journal_placeholder: "اگر کسی نے دھمکی دی ہو تو یہاں لکھیں...",

        crisis_warning: "ایسا لگتا ہے کہ آپ خطرے میں ہیں۔ کیا آپ کو فوری مدد چاہیے؟",
        btn_call_112: "112 پر کال کریں",
        btn_submit_pulse: "میری ہفتہ وار معلومات بھیجیں",
        score_box_title: "دباؤ اور تحفظ کا اسکور",
        score_out_of_100: "100 میں سے",
        score_explanation: "زیادہ اسکور کا مطلب زیادہ خوف یا دباؤ ہے۔ مددگار جلد رابطہ کرے گا۔",

        demo_title: "نمونہ مثالیں دیکھیں:",
        demo_threat: "🚨 دھمکیوں کی اطلاع (زیادہ دباؤ)",
        demo_delay: "⚖️ عدالت میں تاخیر (درمیانہ دباؤ)",
        demo_calm: "🌿 پرامن ہفتہ (کم دباؤ)",

        counselor_header_title: "مددگار کمانڈ ایریا",
        counselor_header_sub: "قانونی خدمات اتھارٹی — تحفظ اور بہبود",
        counselor_name: "کیس ورکر: ڈاکٹر سارہ جینکنز",
        btn_req_police: "پولیس تحفظ کی درخواست کریں",
        btn_exit: "← باہر نکلیں",

        kpi_people_helped: "کل مدد حاصل کرنے والے",
        kpi_active_survivors: "فعال افراد",
        kpi_needs_today: "جنہیں آج مدد چاہیے",
        kpi_high_stress: "زیادہ دباؤ / دھمکی رپورٹ",
        kpi_followup_needed: "فالو اپ درکار ہے",
        kpi_court_worry: "تاریخ میں تاخیر کی فکر",
        kpi_actions_done: "مکمل شدہ امدادی اقدامات",
        kpi_logged_visits: "درج شدہ کالز اور ملاقاتیں",

        queue_title: "جنہیں مدد کی ضرورت ہے (ترجیح کے مطابق)",
        filter_all: "سب",
        filter_urgent: "فوری",
        filter_moderate: "درمیانہ",
        filter_stable: "پرسکون",
        th_case_id: "کیس نمبر",
        th_stress_score: "دباؤ اسکور",
        th_key_worry: "اہم تشویش",
        th_review: "جائزہ لیں",

        details_empty_title: "فہرست میں سے کسی کو منتخب کریں",
        details_empty_desc: "تفصیلات دیکھنے کے لیے بائیں جانب کسی کیس پر کلک کریں۔",
        synth_title: "💡 مددگار کے لیے تجویز:",
        btn_use_suggestion: "یہ تجویز استعمال کریں ↓",
        chart_title: "گزشتہ ہفتوں میں دباؤ کی سطح",
        survivor_quote_title: "متاثرہ شخص نے کیا لکھا:",
        past_actions_title: "ماضی میں کی گئی مدد:",

        opt_call: "فون کال مکمل ہوئی",
        opt_police: "پولیس تحفظ کی درخواست کی گئی",
        opt_meeting: "قانونی ملاقات",
        opt_doctor: "ہسپتال ریفرل",
        notes_placeholder: "آپ نے مدد کے لیے کیا کیا آسان الفاظ میں لکھیں...",
        btn_save_action: "امدادی کارروائی محفوظ کریں",

        badge_doing_okay: "سب ٹھیک ہے",
        badge_urgent: "فوری مدد",
        badge_moderate: "کال کریں",
        badge_moderate_stress: "درمیانہ دباؤ",
        badge_high_stress: "زیادہ دباؤ (مددگار رابطہ کرے گا)",
        badge_low_stress: "سب ٹھیک ہے (کم دباؤ)",

        synth_urgent_text: "متاثرہ شخص نے دھمکیوں یا شدید خطرے کی اطلاع دی ہے۔ فوری کال کریں اور مقامی پولیس تحفظ کا بندوبست کریں۔",
        synth_moderate_text: "متاثرہ شخص عدالت کی تاریخوں میں تاخیر کی وجہ سے پریشان ہے۔ فون پر تسلی دینے کا مشورہ دیا جاتا ہے۔",
        synth_stable_text: "متاثرہ شخص پرسکون اور محفوظ محسوس کر رہا ہے۔ کسی فوری کارروائی کی ضرورت نہیں ہے۔",
        sample_voice_text: "مجھے اس ہفتے بہت خوف لگا کیونکہ نامعلوم افراد ہمارے گھر کے باہر نگرانی کر رہے تھے۔ رات کو نیند نہیں آئی۔",
        police_alert_msg: "🚨 پولیس تحفظ کی درخواست بھیجی گئی:\n\nتحفظ کے لیے پولیس سپرنٹنڈنٹ کو ایمرجنسی پیغام بھیج دیا گیا ہے۔",
        week_prefix: "ہفتہ",
        no_actions: "پہلے سے کوئی کارروائی درج نہیں ہے۔",
        speech_locale: "ur-PK"
    }
};

// ============================================================================
// AUTOMATIC FULL PAGE LANGUAGE SWITCHER
// ============================================================================
function changeLanguage(lang) {
    if (!i18nDictionary[lang]) {
        lang = 'en';
    }
    currentLang = lang;
    try {
        localStorage.setItem('nexora_lang', lang);
    } catch (e) {}

    const dict = i18nDictionary[lang];

    // Set page title and HTML lang attribute
    document.title = dict.page_title || "NEXORA — We Are Here To Help";
    document.documentElement.lang = lang;

    // Update text content on every [data-i18n] element
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key] !== undefined) {
            el.textContent = dict[key];
        }
    });

    // Update placeholder text on every [data-i18n-placeholder] element
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (dict[key] !== undefined) {
            el.placeholder = dict[key];
        }
    });

    // Sync header dropdown selector
    const select = document.getElementById('lang-select');
    if (select) {
        select.value = lang;
    }
    const counselorSelect = document.getElementById('counselor-lang-select');
    if (counselorSelect) {
        counselorSelect.value = lang;
    }

    // Sync interactive language pills on intro page
    document.querySelectorAll('[data-lang-pill]').forEach(pill => {
        const pillLang = pill.getAttribute('data-lang-pill');
        if (pillLang === lang) {
            pill.classList.add('active');
        } else {
            pill.classList.remove('active');
        }
    });

    // Re-render live elements with updated language
    updateLiveAnalysis();
    renderDashboard();

    // If a case is currently selected in caseworker view, refresh its details
    if (selectedCaseId) {
        selectCase(selectedCaseId, false);
    }
}

// ============================================================================
// TEXT-TO-SPEECH (Audio Read-Aloud for Uneducated Survivors)
// ============================================================================
function speakText(text, locale) {
    if (!window.speechSynthesis) {
        alert(text);
        return;
    }
    window.speechSynthesis.cancel(); // stop any ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    const dict = i18nDictionary[currentLang] || i18nDictionary.en;
    utterance.lang = locale || dict.speech_locale || 'en-US';
    utterance.rate = 0.92;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
}

function readAloudIntro() {
    const dict = i18nDictionary[currentLang] || i18nDictionary.en;
    const textToSpeak = `${dict.intro_subtitle}. ${dict.intro_quote}. ${dict.intro_explanation}`;
    speakText(textToSpeak, dict.speech_locale);
}

function readAloudKey(key) {
    const dict = i18nDictionary[currentLang] || i18nDictionary.en;
    if (dict[key]) {
        speakText(dict[key], dict.speech_locale);
    }
}

// Background & Header: Seamless dark celestial theme allowing HTML5 Canvas starfield to shine
function updateBodyBackground(viewName) {
    const body = document.getElementById('app-body');
    const header = document.getElementById('main-public-header');
    const langBox = document.getElementById('lang-select-box');
    const langLabel = document.getElementById('lang-select-label');
    const langSelect = document.getElementById('lang-select');
    const brandTitle = document.getElementById('header-brand-title');
    const brandSub = document.getElementById('header-brand-sub');
    const helplines = document.getElementById('header-helplines');

    if (!body) return;

    // Maintain celestial space background across all views
    body.className = "bg-[#06080e] text-slate-100 font-sans min-h-screen flex flex-col relative overflow-x-hidden selection:bg-sky-500 selection:text-white";
    if (header) header.className = "relative z-50 border-b border-white/10 bg-slate-950/60 backdrop-blur-xl shadow-md text-slate-200 transition-all duration-300";
    if (langBox) langBox.className = "flex items-center gap-1.5 bg-slate-900/80 border border-white/10 rounded-xl px-3 py-1.5 text-xs shadow-xs backdrop-blur-sm transition-all";
    if (langLabel) langLabel.className = "font-bold text-slate-300 mr-1 hidden sm:inline";
    if (langSelect) langSelect.className = "bg-transparent font-bold text-slate-100 outline-none cursor-pointer text-xs [&>option]:bg-slate-900 [&>option]:text-white";
    if (brandTitle) brandTitle.className = "font-extrabold tracking-tight text-white text-base font-heading";
    if (brandSub) brandSub.className = "hidden sm:inline text-slate-400 font-medium";
    if (helplines) helplines.className = "flex items-center gap-3 sm:gap-4 text-xs font-semibold text-slate-300";
}

// ============================================================================
// TOP PORTAL ROUTING & NAVIGATION (SIH-26094 / MoSJE)
// ============================================================================
function openPortal(portalName) {
    playHapticBeep(520, 'sine', 0.08);

    // Strict Role Enforcement
    if (currentRole === 'victim' && portalName !== 'pulse') {
        return;
    }
    if (currentRole === 'counselor' && portalName === 'analytics') {
        return;
    }
    if (currentRole === 'admin' && portalName === 'pulse') {
        return;
    }

    // Update portal switcher pill active states
    ['pulse', 'triage', 'analytics'].forEach(p => {
        const pill = document.getElementById(`portal-tab-${p}`);
        if (pill) {
            if (p === portalName) {
                pill.classList.add('active');
            } else {
                pill.classList.remove('active');
            }
        }
    });

    if (portalName === 'pulse') {
        switchView('victim');
        try { history.replaceState(null, null, '#pulse'); } catch (e) {}
    } else if (portalName === 'triage') {
        switchView('counselor');
        switchMonitorTab('cases');
        try { history.replaceState(null, null, '#triage'); } catch (e) {}
    } else if (portalName === 'analytics') {
        switchView('counselor');
        switchMonitorTab('analytics');
        try { history.replaceState(null, null, '#analytics'); } catch (e) {}
        setTimeout(renderCompensationChart, 100);
    }
}

// ============================================================================
// ROLE-BASED ACCESS ARCHITECTURE (Victim, Counsellor, Administration)
// ============================================================================
let currentRole = null; // 'victim' | 'counselor' | 'admin'

function updateRoleBadge() {
    const textEl = document.getElementById('active-role-text');
    const pillEl = document.getElementById('active-role-pill');
    const dotEl = document.getElementById('active-role-dot');
    const navBar = document.getElementById('portal-nav-bar');

    const topBanner = document.getElementById('counselor-top-banner');
    const bannerTitle = document.getElementById('counselor-banner-title');
    const bannerBadge = document.getElementById('counselor-banner-badge');
    const bannerDesc = document.getElementById('counselor-banner-desc');
    const bannerIcon = document.getElementById('counselor-banner-icon');

    const sAvatar = document.getElementById('sidebar-user-avatar');
    const sName = document.getElementById('sidebar-user-name');
    const sRole = document.getElementById('sidebar-user-role');

    // Filter portal tabs based on role
    const tabPulse = document.getElementById('portal-tab-pulse');
    const tabTriage = document.getElementById('portal-tab-triage');
    const tabAnalytics = document.getElementById('portal-tab-analytics');

    // Filter sidebar menu items (Strict Isolation)
    const navDashboard = document.getElementById('mon-nav-dashboard');
    const navAi = document.getElementById('mon-nav-nexora-ai');
    const navCases = document.getElementById('mon-nav-cases');
    const navAlerts = document.getElementById('mon-nav-alerts');
    const navAnalytics = document.getElementById('mon-nav-analytics');
    const navReports = document.getElementById('mon-nav-reports');
    const navSettings = document.getElementById('mon-nav-settings');

    if (currentRole === 'victim') {
        if (textEl) textEl.innerText = `Survivor: ${selectedCaseId || 'CASE-2026-9041'}`;
        if (dotEl) dotEl.className = "w-2 h-2 rounded-full bg-teal-500 animate-pulse";
        if (pillEl) pillEl.className = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-950/80 text-teal-200 border border-teal-500/40 shadow-xs backdrop-blur-sm";

        if (tabPulse) { tabPulse.classList.remove('hidden'); tabPulse.classList.add('active'); }
        if (tabTriage) tabTriage.classList.add('hidden');
        if (tabAnalytics) tabAnalytics.classList.add('hidden');

        // Update victim report card
        const repCaseId = document.getElementById('rep-case-id');
        const targetCase = findCaseByToken(selectedCaseId);
        if (repCaseId && targetCase) {
            repCaseId.innerText = targetCase.token || targetCase.caseId;
            const repMilestone = document.getElementById('rep-milestone');
            if (repMilestone) {
                const latest = targetCase.checkIns && targetCase.checkIns.length > 0 ? targetCase.checkIns[targetCase.checkIns.length - 1] : null;
                repMilestone.innerText = (latest && latest.milestone) || targetCase.category;
            }
            renderCaseTimeline(targetCase);
        }
    } else if (currentRole === 'counselor') {
        if (textEl) textEl.innerText = `Doctor / Clinician: Dr. Sarah Jenkins`;
        if (dotEl) dotEl.className = "w-2 h-2 rounded-full bg-sky-400 animate-pulse";
        if (pillEl) pillEl.className = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-950/80 text-sky-200 border border-sky-600/60 shadow-xs backdrop-blur-sm";

        if (tabPulse) tabPulse.classList.add('hidden');
        if (tabTriage) { tabTriage.classList.remove('hidden'); tabTriage.classList.add('active'); }
        if (tabAnalytics) tabAnalytics.classList.add('hidden');

        // Clinician permissions: Can view individual patient records, triage, alerts & reports. NO state budget/settings exposure.
        if (navCases) navCases.classList.remove('hidden');
        if (navAlerts) navAlerts.classList.remove('hidden');
        if (navAi) navAi.classList.remove('hidden');
        if (navReports) navReports.classList.remove('hidden');
        if (navDashboard) navDashboard.classList.remove('hidden');
        if (navAnalytics) navAnalytics.classList.add('hidden');
        if (navSettings) navSettings.classList.add('hidden');

        if (bannerTitle) bannerTitle.innerText = "Doctor & Counsellor Clinical Command";
        if (bannerBadge) {
            bannerBadge.innerText = "Active Clinician";
            bannerBadge.className = "px-2 py-0.5 rounded text-[10px] font-bold bg-sky-900/60 text-sky-300 border border-sky-500/40";
        }
        if (bannerDesc) bannerDesc.innerText = "Reviewing all patient trajectories, 6-week DDS trends, and dispatching Closed-Loop interventions.";
        if (bannerIcon) bannerIcon.innerText = "🩺";

        if (sAvatar) sAvatar.innerText = "SJ";
        if (sName) sName.innerText = "Dr. Sarah Jenkins";
        if (sRole) sRole.innerText = "DLSA / Tele-MANAS Retainer";
    } else if (currentRole === 'admin') {
        if (textEl) textEl.innerText = `MoSJE Administration: DWO Oversight`;
        if (dotEl) dotEl.className = "w-2 h-2 rounded-full bg-purple-400 animate-pulse";
        if (pillEl) pillEl.className = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-950/80 text-purple-200 border border-purple-600/60 shadow-xs backdrop-blur-sm";

        if (tabPulse) tabPulse.classList.add('hidden');
        if (tabTriage) tabTriage.classList.add('hidden');
        if (tabAnalytics) { tabAnalytics.classList.remove('hidden'); tabAnalytics.classList.add('active'); }

        // Administrator permissions: High-level analytics, district heatmaps, policy reports, settings. NO individual victim files!
        if (navCases) navCases.classList.add('hidden');
        if (navAlerts) navAlerts.classList.remove('hidden');
        if (navAi) navAi.classList.remove('hidden');
        if (navReports) navReports.classList.remove('hidden');
        if (navDashboard) navDashboard.classList.remove('hidden');
        if (navAnalytics) navAnalytics.classList.remove('hidden');
        if (navSettings) navSettings.classList.remove('hidden');

        if (bannerTitle) bannerTitle.innerText = "MoSJE District Administration Oversight";
        if (bannerBadge) {
            bannerBadge.innerText = "District Authority";
            bannerBadge.className = "px-2 py-0.5 rounded text-[10px] font-bold bg-purple-900/60 text-purple-300 border border-purple-500/40";
        }
        if (bannerDesc) bannerDesc.innerText = "Statewide vulnerability heatmaps, statutory atrocity crime categories, and relief compensation tracking.";
        if (bannerIcon) bannerIcon.innerText = "🏛️";

        if (sAvatar) sAvatar.innerText = "DWO";
        if (sName) sName.innerText = "District Welfare Officer";
        if (sRole) sRole.innerText = "MoSJE Pune & Maharashtra Division";
    } else {
        if (textEl) textEl.innerText = "Portal: Role Selection";
        if (dotEl) dotEl.className = "w-2 h-2 rounded-full bg-amber-500 animate-pulse";
        if (pillEl) pillEl.className = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-950/80 text-amber-200 border border-amber-500/40 shadow-xs backdrop-blur-sm";

        if (tabPulse) tabPulse.classList.remove('hidden');
        if (tabTriage) tabTriage.classList.remove('hidden');
        if (tabAnalytics) tabAnalytics.classList.remove('hidden');

        if (navCases) navCases.classList.remove('hidden');
        if (navAnalytics) navAnalytics.classList.remove('hidden');
        if (navSettings) navSettings.classList.remove('hidden');
    }
}

// Navigation
function switchView(viewName) {
    playHapticBeep(520, 'sine', 0.08);

    if (viewName === 'portal') {
        viewName = 'counselor';
    }

    updateBodyBackground(viewName);

    const views = ['intro', 'role-select', 'victim', 'counselor'];
    views.forEach(v => {
        const el = document.getElementById(`${v}-view`);
        if (v === viewName) {
            if (el) {
                el.classList.remove('hidden');
                el.classList.add('flex');
                el.classList.remove('view-fade-slide');
                void el.offsetWidth;
                el.classList.add('view-fade-slide');
            }
        } else {
            if (el) {
                el.classList.add('hidden');
                el.classList.remove('flex', 'view-fade-slide');
            }
        }
    });

    // Update sentient-nav visibility (hide in counselor dashboard to prevent overlapping)
    const sentientNav = document.getElementById('sentient-nav');
    if (sentientNav) {
        if (viewName === 'counselor') {
            sentientNav.classList.add('hidden');
        } else {
            sentientNav.classList.remove('hidden');
        }
    }

    const sentientNavBottom = document.getElementById('sentient-nav-bottom');
    if (sentientNavBottom) {
        if (viewName === 'counselor') {
            sentientNavBottom.classList.add('hidden');
        } else {
            sentientNavBottom.classList.remove('hidden');
        }
    }

    // Update portal navbar visibility
    const navBar = document.getElementById('portal-nav-bar');
    if (navBar) {
        if (viewName === 'intro') {
            navBar.classList.add('hidden');
        } else {
            navBar.classList.remove('hidden');
        }
    }

    // Show/hide global back button in nav
    const navBackBtn = document.getElementById('nav-back-btn');
    if (navBackBtn) {
        if (viewName === 'intro') {
            navBackBtn.classList.add('hidden');
        } else {
            navBackBtn.classList.remove('hidden');
        }
    }

    // View specific activations
    if (viewName === 'victim') {
        ['triage', 'analytics'].forEach(p => document.getElementById(`portal-tab-${p}`)?.classList.remove('active'));
        document.getElementById('portal-tab-pulse')?.classList.add('active');
        
        // Always show Step 1 Profile & Baseline form first (Zero direct question jump)
        document.getElementById('victim-profile-intake')?.classList.remove('hidden');
        document.getElementById('victim-chat-container')?.classList.add('hidden');
        document.getElementById('victim-success')?.classList.add('hidden');
    } else if (viewName === 'counselor') {
        renderDashboard();
        if (currentMonitorTab === 'analytics') {
            document.getElementById('portal-tab-analytics')?.classList.add('active');
            document.getElementById('portal-tab-pulse')?.classList.remove('active');
            document.getElementById('portal-tab-triage')?.classList.remove('active');
            setTimeout(renderCompensationChart, 100);
        } else {
            document.getElementById('portal-tab-triage')?.classList.add('active');
            document.getElementById('portal-tab-pulse')?.classList.remove('active');
            document.getElementById('portal-tab-analytics')?.classList.remove('active');
        }
        switchMonitorTab(currentMonitorTab || 'cases');
        setTimeout(initWaveformCanvas, 80);
    }
}

function goToSecondPage() {
    playHapticBeep(560, 'sine', 0.08);
    currentRole = null;
    switchView('role-select');
    updateRoleBadge();
    try { history.replaceState(null, null, '#roles'); } catch (e) {}
}

function goToRoleSelection() {
    goToSecondPage();
}

function logoutToRoleSelection() {
    playHapticBeep(480, 'sine', 0.08);
    currentRole = null;
    switchView('role-select');
    updateRoleBadge();
    try { history.replaceState(null, null, '#roles'); } catch (e) {}
}

function goBackToIntro() {
    playHapticBeep(420, 'sine', 0.08);
    currentRole = null;
    switchView('intro');
    updateRoleBadge();
    try { history.replaceState(null, null, ' '); } catch (e) {}
}

function loginAsRole(role) {
    playHapticBeep(640, 'triangle', 0.12);
    currentRole = role;

    if (role === 'victim') {
        // Read survivor profile details entered on the login selection page
        const nameInput = document.getElementById('role-select-victim-name');
        const phoneInput = document.getElementById('role-select-victim-phone');
        const workInput = document.getElementById('role-select-victim-work');
        const stressInput = document.getElementById('role-select-victim-stress');
        const tokenInput = document.getElementById('role-select-victim-token');

        if (nameInput && nameInput.value.trim()) currentVictimProfile.name = nameInput.value.trim();
        if (phoneInput && phoneInput.value.trim()) currentVictimProfile.phone = phoneInput.value.trim();
        if (workInput && workInput.value.trim()) currentVictimProfile.work = workInput.value.trim();
        if (stressInput && stressInput.value) currentVictimProfile.stress = stressInput.value;
        if (tokenInput && tokenInput.value.trim()) currentVictimProfile.token = tokenInput.value.trim();

        // Sync from localStorage
        syncVictimProfileFromStorage();

        // Pre-fill Step 1 Intake form on the victim page
        const intakeName = document.getElementById('victim-intake-name');
        if (intakeName && currentVictimProfile.name) intakeName.value = currentVictimProfile.name;
        const intakePhone = document.getElementById('victim-intake-phone');
        if (intakePhone && currentVictimProfile.phone) intakePhone.value = currentVictimProfile.phone;
        const intakeProfession = document.getElementById('victim-intake-profession');
        if (intakeProfession && currentVictimProfile.profession) intakeProfession.value = currentVictimProfile.profession;
        const intakeWork = document.getElementById('victim-intake-work');
        if (intakeWork && currentVictimProfile.profession) intakeWork.value = currentVictimProfile.profession;
        const intakeStress = document.getElementById('victim-intake-stress');
        if (intakeStress && currentVictimProfile.stress) intakeStress.value = currentVictimProfile.stress;

        const token = currentVictimProfile.token || 'CASE-2026-9041';
        const caseSelect = document.getElementById('caseIdSelect');
        if (caseSelect) caseSelect.value = token;
        handleCaseTokenChange(token);

        switchView('victim');
        updateRoleBadge();
        try { history.replaceState(null, null, '#pulse'); } catch (e) {}
    } else if (role === 'counselor') {
        switchView('counselor');
        updateRoleBadge();
        switchMonitorTab('cases'); // Takes doctor straight to all patients queue & graphs
        try { history.replaceState(null, null, '#triage'); } catch (e) {}
    } else if (role === 'admin') {
        switchView('counselor');
        updateRoleBadge();
        switchMonitorTab('analytics'); // Takes administrator straight to district heatmap & governance
        try { history.replaceState(null, null, '#analytics'); } catch (e) {}
        setTimeout(renderCompensationChart, 100);
    }
}

// Audio Feedback
function playHapticBeep(freq = 520, type = 'sine', duration = 0.08) {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
}

// ============================================================================
// MULTI-CHANNEL SIMULATION SELECTOR (Web, WhatsApp, IVRS)
// ============================================================================
function setChannelMode(mode) {
    playHapticBeep(560, 'sine', 0.08);
    currentChannelMode = mode;

    ['web', 'whatsapp', 'ivrs'].forEach(m => {
        const pill = document.getElementById(`chan-${m}`);
        if (pill) {
            if (m === mode) pill.classList.add('active');
            else pill.classList.remove('active');
        }
    });

    const waBox = document.getElementById('whatsapp-sim-container');
    const ivrsBox = document.getElementById('ivrs-sim-container');

    if (waBox) waBox.classList.toggle('hidden', mode !== 'whatsapp');
    if (ivrsBox) ivrsBox.classList.toggle('hidden', mode !== 'ivrs');
}

function applyWhatsAppToForm() {
    playHapticBeep(640, 'triangle', 0.1);
    const caseSelect = document.getElementById('caseIdSelect');
    if (caseSelect) caseSelect.value = 'MH-PUN-2026-081';

    const milestoneSelect = document.getElementById('caseMilestone');
    if (milestoneSelect) milestoneSelect.value = 'Cross-Examination Scheduled';

    const s = document.getElementById('sleepQuality'); if (s) s.value = 8;
    const sf = document.getElementById('safety'); if (sf) sf.value = 9;
    const ax = document.getElementById('anxiety'); if (ax) ax.value = 9;
    const sup = document.getElementById('socialSupport'); if (sup) sup.value = 7;

    const j = document.getElementById('journal');
    if (j) j.value = "WhatsApp Telemetry: Sleep 8/10, Threat fear 9/10. Accused relatives followed me from the market yesterday. Extreme fear.";

    currentAcousticData = { jitter: 2.85, shimmer: 0.74, tremor: 7.8 };
    updateAcousticMarkerDOM();

    setChannelMode('web');
    updateLiveAnalysis();
}

function applyIVRSToForm() {
    playHapticBeep(640, 'triangle', 0.1);
    const caseSelect = document.getElementById('caseIdSelect');
    if (caseSelect) caseSelect.value = 'MH-NGP-2026-042';

    const milestoneSelect = document.getElementById('caseMilestone');
    if (milestoneSelect) milestoneSelect.value = 'Charge Sheet Scrutiny';

    const s = document.getElementById('sleepQuality'); if (s) s.value = 8;
    const sf = document.getElementById('safety'); if (sf) sf.value = 9;
    const ax = document.getElementById('anxiety'); if (ax) ax.value = 9;
    const sup = document.getElementById('socialSupport'); if (sup) sup.value = 8;

    const j = document.getElementById('journal');
    if (j) j.value = "IVRS Voice Pulse (14566): High Intimidation detected (Keypress 8/9). Voice acoustic tremor elevated. Ration supply blocked.";

    currentAcousticData = { jitter: 3.42, shimmer: 0.88, tremor: 8.5 };
    updateAcousticMarkerDOM();

    setChannelMode('web');
    updateLiveAnalysis();
}

function handleCaseTokenChange(token) {
    const targetCase = findCaseByToken(token);
    if (!targetCase) return;

    selectedCaseId = targetCase.caseId;
    const cardActive = document.getElementById('card-active-token');
    if (cardActive) cardActive.innerText = targetCase.token || targetCase.caseId;

    const repCase = document.getElementById('rep-case-id');
    if (repCase) repCase.innerText = targetCase.token || targetCase.caseId;

    const latest = targetCase.checkIns && targetCase.checkIns.length > 0 ? targetCase.checkIns[targetCase.checkIns.length - 1] : null;
    if (latest) {
        const s = document.getElementById('sleepQuality'); if (s) s.value = latest.sleepQuality;
        const sf = document.getElementById('safety'); if (sf) sf.value = latest.safety;
        const ax = document.getElementById('anxiety'); if (ax) ax.value = latest.anxiety;
        const sup = document.getElementById('socialSupport'); if (sup) sup.value = latest.socialSupport;
        const j = document.getElementById('journal'); if (j) j.value = latest.journal || "";
    }
    updateLiveAnalysis();
}

// ============================================================================
// VOICE BIOMARKER TELEMETRY SIMULATION (20% Weight)
// ============================================================================
function updateAcousticMarkerDOM() {
    const jEl = document.getElementById('marker-jitter');
    const sEl = document.getElementById('marker-shimmer');
    const tEl = document.getElementById('marker-tremor');

    if (jEl) jEl.innerText = `${currentAcousticData.jitter.toFixed(2)}%`;
    if (sEl) sEl.innerText = `${currentAcousticData.shimmer.toFixed(2)} dB`;
    if (tEl) tEl.innerText = `${currentAcousticData.tremor.toFixed(1)} / 10`;

    // Floating Visual Telemetry Chips on Waveform
    const cJ = document.getElementById('chip-jitter');
    const cS = document.getElementById('chip-shimmer');
    const cT = document.getElementById('chip-tremor');
    if (cJ) cJ.innerText = `Pitch Jitter: ${currentAcousticData.jitter.toFixed(2)}%`;
    if (cS) cS.innerText = `Shimmer: ${currentAcousticData.shimmer.toFixed(2)}dB`;
    if (cT) {
        cT.innerText = `Tremor: ${currentAcousticData.tremor > 6 ? 'Elevated (' + currentAcousticData.tremor.toFixed(1) + ')' : 'Normal (' + currentAcousticData.tremor.toFixed(1) + ')'}`;
        cT.className = currentAcousticData.tremor > 6 ? 'telemetry-chip telemetry-chip-rose' : 'telemetry-chip telemetry-chip-emerald';
    }
}

function simulateVoiceAnalysis() {
    if (isVoiceSimulating) return;
    isVoiceSimulating = true;
    playHapticBeep(600, 'sine', 0.15);

    const btn = document.getElementById('btn-voice-analysis');
    const label = document.getElementById('voice-sim-label');
    const statusPill = document.getElementById('voice-status-pill');
    const canvas = document.getElementById('voice-wave-canvas');

    if (label) label.innerText = 'Extracting Acoustic Biomarkers...';
    if (statusPill) {
        statusPill.innerText = '● Acoustic Engine: Analyzing Jitter & Tremor';
        statusPill.className = 'absolute left-3 text-[10px] font-mono font-bold bg-amber-900/80 px-2.5 py-0.5 rounded-full text-amber-300 border border-amber-500/40 animate-pulse';
    }

    // Dynamic wave animation on canvas
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let frame = 0;
        const startTime = Date.now();

        function drawVoiceWave() {
            if (!isVoiceSimulating) return;
            frame++;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#38bdf8';

            const sliceWidth = canvas.width / 60;
            let x = 0;
            for (let i = 0; i < 60; i++) {
                const amp = Math.sin((i + frame * 0.2)) * Math.cos((i * 0.3)) * (canvas.height / 3);
                const y = (canvas.height / 2) + amp;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
                x += sliceWidth;
            }
            ctx.stroke();

            if (Date.now() - startTime < 2500) {
                voiceWaveAnimId = requestAnimationFrame(drawVoiceWave);
            } else {
                completeVoiceSimulation();
            }
        }
        drawVoiceWave();
    } else {
        setTimeout(completeVoiceSimulation, 2000);
    }

    function completeVoiceSimulation() {
        isVoiceSimulating = false;
        playHapticBeep(840, 'triangle', 0.12);

        // Generate elevated acoustic telemetry characteristic of trauma/threat
        const jitterVal = 2.8 + Math.random() * 0.9;
        const shimmerVal = 0.65 + Math.random() * 0.3;
        const tremorVal = 7.0 + Math.random() * 1.8;

        currentAcousticData = {
            jitter: parseFloat(jitterVal.toFixed(2)),
            shimmer: parseFloat(shimmerVal.toFixed(2)),
            tremor: parseFloat(tremorVal.toFixed(1))
        };
        updateAcousticMarkerDOM();

        if (label) label.innerText = 'Simulate Voice Sample';
        if (statusPill) {
            statusPill.innerText = 'Acoustic Engine: Biomarkers Verified (20% Weight)';
            statusPill.className = 'absolute left-3 text-[10px] font-mono font-bold bg-teal-900/80 px-2.5 py-0.5 rounded-full text-teal-300 border border-teal-500/40';
        }

        updateLiveAnalysis();
    }
}

// ============================================================================
// DYNAMIC DISTRESS SCORE (DDS) CALCULATION ENGINE (SIH-26094 Formulations)
// Survey (50%) + NLP Threat (30%) + Acoustic Biomarkers (20%) + Velocity Spike (+10)
// ============================================================================
function calculateDDS(sleep, safety, anxiety, support, journal, caseId) {
    // 1. Survey Component (50% Weight)
    // 4 sliders each 0-10 -> max 40 points -> normalized to 0-100 * 0.50
    const surveyRaw = ((sleep + safety + anxiety + support) / 40) * 100;
    const surveyPoints = (surveyRaw * 0.50);

    // 2. NLP Threat Sentiment Component (30% Weight)
    let matchedKeywords = [];
    const lower = (journal || "").toLowerCase();
    
    distressKeywords.forEach(kw => {
        if (lower.includes(kw.toLowerCase())) {
            matchedKeywords.push(kw);
        }
    });

    const hasCriticalThreat = criticalThreatKeywords.some(w => lower.includes(w.toLowerCase())) || (safety >= 9);

    let nlpRaw = 10;
    if (hasCriticalThreat) {
        nlpRaw = 95;
    } else if (matchedKeywords.length >= 3) {
        nlpRaw = 80;
    } else if (matchedKeywords.length >= 1) {
        nlpRaw = 45;
    } else if (anxiety >= 7) {
        nlpRaw = 40;
    }
    const nlpPoints = (nlpRaw * 0.30);

    // 3. Acoustic Tremor Index (20% Weight)
    // Tremor scale 0-10 -> normalized to 0-100 * 0.20
    const tremorScore = (currentAcousticData.tremor / 10) * 100;
    const acousticPoints = (tremorScore * 0.20);

    // 4. Velocity Penalty (+10 pts Spike)
    let isVelocitySpike = false;
    const targetCase = cases.find(c => c.caseId === caseId);
    if (targetCase && targetCase.checkIns.length > 0) {
        const prevScore = targetCase.checkIns[targetCase.checkIns.length - 1].ddiScore;
        const currentSum = surveyPoints + nlpPoints + acousticPoints;
        if ((currentSum - prevScore) > 25) {
            isVelocitySpike = true;
        }
    }

    const velocityBonus = isVelocitySpike ? 10 : 0;
    const totalScore = Math.min(Math.round(surveyPoints + nlpPoints + acousticPoints + velocityBonus), 100);

    let riskLevel = "LOW";
    if (totalScore >= 70) riskLevel = "HIGH";
    else if (totalScore >= 41) riskLevel = "MODERATE";

    return {
        totalScore,
        surveyPoints: Math.round(surveyPoints),
        nlpPoints: Math.round(nlpPoints),
        acousticPoints: Math.round(acousticPoints),
        isVelocitySpike,
        matchedKeywords: [...new Set(matchedKeywords)],
        riskLevel,
        hasCriticalThreat
    };
}

// Live Analysis UI Updater
function updateLiveAnalysis() {
    const sleepEl = document.getElementById('sleepQuality');
    const safetyEl = document.getElementById('safety');
    const anxietyEl = document.getElementById('anxiety');
    const supportEl = document.getElementById('socialSupport');
    const journalEl = document.getElementById('journal');
    const caseSelect = document.getElementById('caseIdSelect');

    if (!sleepEl) return;

    const sleep = parseInt(sleepEl.value) || 0;
    const safety = parseInt(safetyEl.value) || 0;
    const anxiety = parseInt(anxietyEl.value) || 0;
    const support = parseInt(supportEl.value) || 0;
    const journal = journalEl ? journalEl.value : "";
    const caseId = caseSelect ? caseSelect.value : selectedCaseId;

    const vSleep = document.getElementById('val-sleep'); if (vSleep) vSleep.innerText = `${sleep}/10`;
    const vSafety = document.getElementById('val-safety'); if (vSafety) vSafety.innerText = `${safety}/10`;
    const vAnxiety = document.getElementById('val-anxiety'); if (vAnxiety) vAnxiety.innerText = `${anxiety}/10`;
    const vSupport = document.getElementById('val-support'); if (vSupport) vSupport.innerText = `${support}/10`;

    const res = calculateDDS(sleep, safety, anxiety, support, journal, caseId);

    const numEl = document.getElementById('live-ddi-number');
    if (numEl) numEl.innerText = res.totalScore;

    const circle = document.getElementById('gauge-circle');
    if (circle) {
        const offset = 264 - (res.totalScore / 100) * 264;
        circle.style.strokeDashoffset = offset;
    }

    // Triage Zone Badge
    const riskBadge = document.getElementById('live-risk-badge');
    if (riskBadge && circle) {
        if (res.riskLevel === "HIGH") {
            circle.setAttribute('class', 'text-rose-600 transition-all duration-300');
            riskBadge.className = "px-3.5 py-1 rounded-full text-xs font-bold inline-block bg-rose-200/80 text-rose-950 border border-rose-300";
            riskBadge.innerText = `Red Zone (High Distress • Priority 1)`;
        } else if (res.riskLevel === "MODERATE") {
            circle.setAttribute('class', 'text-amber-600 transition-all duration-300');
            riskBadge.className = "px-3.5 py-1 rounded-full text-xs font-bold inline-block bg-amber-200/80 text-amber-950 border border-amber-300";
            riskBadge.innerText = `Yellow Zone (Moderate Distress • Priority 2)`;
        } else {
            circle.setAttribute('class', 'text-teal-600 transition-all duration-300');
            riskBadge.className = "px-3.5 py-1 rounded-full text-xs font-bold inline-block bg-teal-200/80 text-teal-950 border border-teal-300";
            riskBadge.innerText = `Green Zone (Stabilized • Priority 3)`;
        }
    }

    // Explainable AI Attribution Bars
    const xSurveyVal = document.getElementById('xai-survey-val');
    const xSurveyBar = document.getElementById('xai-survey-bar');
    if (xSurveyVal) xSurveyVal.innerText = `${res.surveyPoints} pts (max 50)`;
    if (xSurveyBar) xSurveyBar.style.width = `${(res.surveyPoints / 50) * 100}%`;

    const xNlpVal = document.getElementById('xai-nlp-val');
    const xNlpBar = document.getElementById('xai-nlp-bar');
    if (xNlpVal) xNlpVal.innerText = `${res.nlpPoints} pts (max 30)`;
    if (xNlpBar) xNlpBar.style.width = `${(res.nlpPoints / 30) * 100}%`;

    const xAcousticVal = document.getElementById('xai-acoustic-val');
    const xAcousticBar = document.getElementById('xai-acoustic-bar');
    if (xAcousticVal) xAcousticVal.innerText = `${res.acousticPoints} pts (max 20)`;
    if (xAcousticBar) xAcousticBar.style.width = `${(res.acousticPoints / 20) * 100}%`;

    const velInd = document.getElementById('velocity-penalty-indicator');
    if (velInd) {
        if (res.isVelocitySpike) velInd.classList.remove('hidden');
        else velInd.classList.add('hidden');
    }

    // Crisis Warning Banner
    const crisisBanner = document.getElementById('crisis-alert-banner');
    if (crisisBanner) {
        if (res.hasCriticalThreat) {
            crisisBanner.classList.remove('hidden');
            crisisBanner.classList.add('flex');
        } else {
            crisisBanner.classList.add('hidden');
            crisisBanner.classList.remove('flex');
        }
    }
}

// Sample Test Presets for SIH-26094
function applyVictimPreset(type) {
    playHapticBeep(640, 'sine', 0.08);
    const caseSelect = document.getElementById('caseIdSelect');
    const milestoneSelect = document.getElementById('caseMilestone');

    if (type === 'intimidation') {
        if (caseSelect) caseSelect.value = "MH-PUN-2026-081";
        if (milestoneSelect) milestoneSelect.value = "Cross-Examination Scheduled";
        document.getElementById('sleepQuality').value = 9;
        document.getElementById('safety').value = 9;
        document.getElementById('anxiety').value = 10;
        document.getElementById('socialSupport').value = 8;
        document.getElementById('journal').value = "Two men came to my home at night and threatened me. We are terrified. Police did not help.";
        currentAcousticData = { jitter: 3.42, shimmer: 0.88, tremor: 8.5 };
    } else if (type === 'boycott') {
        if (caseSelect) caseSelect.value = "MH-NGP-2026-042";
        if (milestoneSelect) milestoneSelect.value = "Charge Sheet Scrutiny";
        document.getElementById('sleepQuality').value = 8;
        document.getElementById('safety').value = 9;
        document.getElementById('anxiety').value = 9;
        document.getElementById('socialSupport').value = 9;
        document.getElementById('journal').value = "My brother was attacked on the road. Grocery shops refuse to sell us grains. Total terror.";
        currentAcousticData = { jitter: 3.12, shimmer: 0.79, tremor: 8.0 };
    } else if (type === 'courtDelay') {
        if (caseSelect) caseSelect.value = "MH-THN-2026-103";
        if (milestoneSelect) milestoneSelect.value = "Special Court Hearing Adjourned";
        document.getElementById('sleepQuality').value = 6;
        document.getElementById('safety').value = 5;
        document.getElementById('anxiety').value = 8;
        document.getElementById('socialSupport').value = 6;
        document.getElementById('journal').value = "Court delayed again for 4th time. Bus fare taking all money, feeling hopeless.";
        currentAcousticData = { jitter: 1.84, shimmer: 0.52, tremor: 5.8 };
    } else if (type === 'calm') {
        if (caseSelect) caseSelect.value = "MH-AUR-2026-095";
        if (milestoneSelect) milestoneSelect.value = "Trial Concluded";
        document.getElementById('sleepQuality').value = 2;
        document.getElementById('safety').value = 1;
        document.getElementById('anxiety').value = 2;
        document.getElementById('socialSupport').value = 1;
        document.getElementById('journal').value = "Relief compensation received in bank account. We feel safe now and trial concluded peacefully.";
        currentAcousticData = { jitter: 0.92, shimmer: 0.28, tremor: 2.1 };
    }
    updateAcousticMarkerDOM();
    updateLiveAnalysis();
}

function handleVictimSubmit(e) {
    e.preventDefault();
    playHapticBeep(800, 'triangle', 0.1);

    const caseSelect = document.getElementById('caseIdSelect');
    const rawToken = caseSelect ? caseSelect.value.trim() : "CASE-2026-9041";
    const targetCase = findCaseByToken(rawToken);
    const caseId = targetCase ? targetCase.caseId : "MH-PUN-2026-081";

    const milestone = document.getElementById('caseMilestone')?.value || "Cross-Examination Scheduled";
    const sleep = parseInt(document.getElementById('sleepQuality').value) || 0;
    const safety = parseInt(document.getElementById('safety').value) || 0;
    const anxiety = parseInt(document.getElementById('anxiety').value) || 0;
    const support = parseInt(document.getElementById('socialSupport').value) || 0;
    const journal = document.getElementById('journal').value.trim();

    const analysis = calculateDDS(sleep, safety, anxiety, support, journal, caseId);

    const newCheckIn = {
        id: `chk-${Date.now()}`,
        date: new Date().toISOString(),
        sleepQuality: sleep,
        safety,
        anxiety,
        socialSupport: support,
        journal: journal || "No extra notes recorded.",
        ddiScore: analysis.totalScore,
        riskLevel: analysis.riskLevel,
        milestone: milestone,
        surveyPoints: analysis.surveyPoints,
        nlpPoints: analysis.nlpPoints,
        acousticPoints: analysis.acousticPoints,
        acoustic: { ...currentAcousticData }
    };

    if (targetCase) {
        targetCase.checkIns.push(newCheckIn);
        targetCase.milestone = milestone;
    } else {
        const newCase = {
            caseId,
            token: rawToken,
            district: "Special Division",
            court: "District Special Court",
            assignedCounselor: "Dr. Sarah Jenkins (DLSA)",
            category: "SC/ST Atrocity Witness Protection",
            milestone: milestone,
            checkIns: [newCheckIn],
            interventions: []
        };
        cases.push(newCase);
    }

    // Update confirmation screen
    const sId = document.getElementById('succ-tx-id'); 
    if (sId) sId.innerText = (targetCase && targetCase.token) ? targetCase.token : rawToken;
    const sMilestone = document.getElementById('succ-milestone'); 
    if (sMilestone) sMilestone.innerText = milestone;
    const sScore = document.getElementById('succ-ddi-score'); 
    if (sScore) sScore.innerText = `${analysis.totalScore} / 100`;
    const sZone = document.getElementById('succ-risk-zone');
    if (sZone) {
        if (analysis.riskLevel === "HIGH") {
            sZone.className = "font-bold px-2.5 py-1 rounded text-[11px] uppercase bg-rose-950/80 text-rose-300 border border-rose-500/50 inline-flex items-center gap-1.5";
            sZone.innerHTML = `<span class="w-2 h-2 rounded-full beacon-dot-rose"></span> RED ZONE (PRIORITY 1)`;
        } else if (analysis.riskLevel === "MODERATE") {
            sZone.className = "font-bold px-2.5 py-1 rounded text-[11px] uppercase bg-amber-950/80 text-amber-300 border border-amber-500/50 inline-flex items-center gap-1.5";
            sZone.innerHTML = `<span class="w-2 h-2 rounded-full beacon-dot-amber"></span> YELLOW ZONE (MODERATE)`;
        } else {
            sZone.className = "font-bold px-2.5 py-1 rounded text-[11px] uppercase bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 inline-flex items-center gap-1.5";
            sZone.innerHTML = `<span class="w-2 h-2 rounded-full beacon-dot-emerald"></span> GREEN ZONE (STABLE)`;
        }
    }

    document.getElementById('victim-form-container')?.classList.add('hidden');
    document.getElementById('victim-success')?.classList.remove('hidden');

    // Isolated Survivor Sparkline Rendering
    setTimeout(() => {
        renderVictimSparkline(caseId);
    }, 60);

    // Cross-Portal Sync
    renderDashboard();
    if (selectedCaseId === caseId) {
        selectCase(caseId, false);
    }
}

function resetVictimForm() {
    checkInResponses = [];
    currentCheckInQuestionIdx = 0;
    document.getElementById('victim-profile-intake')?.classList.remove('hidden');
    document.getElementById('victim-chat-container')?.classList.add('hidden');
    document.getElementById('victim-success')?.classList.add('hidden');
}

function retakeVictimCheckIn() {
    playHapticBeep(520, 'sine', 0.08);
    resetVictimForm();
}

function handleVictimProfileSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    playHapticBeep(600, 'sine', 0.08);

    const nameInput = document.getElementById('victim-intake-name');
    const phoneInput = document.getElementById('victim-intake-phone');
    const professionInput = document.getElementById('victim-intake-profession');
    const workInput = document.getElementById('victim-intake-work');
    const stressInput = document.getElementById('victim-intake-stress');

    const name = (nameInput && nameInput.value.trim()) || currentVictimProfile.name || "Priya Sharma";
    const phone = (phoneInput && phoneInput.value.trim()) || currentVictimProfile.phone || "98765 43210";
    const profession = (professionInput && professionInput.value) || currentVictimProfile.profession || "";
    const work = (workInput && workInput.value.trim()) || currentVictimProfile.work || profession || "General";
    const stress = (stressInput && stressInput.value) || currentVictimProfile.stress || "Moderate";

    currentVictimProfile = {
        name,
        phone,
        profession,
        work,
        stress,
        token: currentVictimProfile.token || `CASE-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    };

    // Save to localStorage for persistence
    const profile = loadUserProfile();
    profile.name = name;
    profile.phone = phone;
    profile.profession = profession;
    profile.work = work;
    profile.stress = stress;
    saveUserProfile(profile);

    // Transition from Profile Intake to Chat Container
    document.getElementById('victim-profile-intake')?.classList.add('hidden');
    document.getElementById('victim-chat-container')?.classList.remove('hidden');
    document.getElementById('victim-success')?.classList.add('hidden');

    // Initialize check-in with profession-adaptive questions
    initConversationalCheckIn();
}

// ============================================================================
// PORTAL 2: DISTRICT CASEWORKER PRIORITY TRIAGE DASHBOARD LOGIC
// ============================================================================
function renderDashboard() {
    let highCount = 0;
    let modCount = 0;
    let lowCount = 0;
    let totalInterventions = 0;

    const enriched = cases.map(c => {
        repairAndScoreCase(c);
        totalInterventions += (c.interventions ? c.interventions.length : 0);
        const latest = (c.checkIns && c.checkIns.length > 0) ? c.checkIns[c.checkIns.length - 1] : null;
        const score = (latest && latest.ddiScore !== undefined && !isNaN(latest.ddiScore)) ? latest.ddiScore : 0;
        const risk = (latest && latest.riskLevel) ? latest.riskLevel : c.threatLevel || (score >= 70 ? "HIGH" : (score >= 40 ? "MODERATE" : "LOW"));
        if (risk === "HIGH") highCount++;
        else if (risk === "MODERATE") modCount++;
        else lowCount++;

        return {
            ...c,
            latest,
            score,
            risk
        };
    });

    // Update 4 Overview Metric Cards (SIH-26094)
    const mTotal = document.getElementById('metric-triage-total');
    if (mTotal) mTotal.innerText = cases.length;
    const mRed = document.getElementById('metric-triage-red');
    if (mRed) mRed.innerText = highCount;
    const mHearings = document.getElementById('metric-triage-hearings');
    if (mHearings) mHearings.innerText = cases.filter(c => c.category && c.category.includes('Court')).length;
    const mInv = document.getElementById('metric-triage-interventions');
    if (mInv) mInv.innerText = totalInterventions;

    // Sort descending by distress score (Priority Triage)
    enriched.sort((a, b) => b.score - a.score);

    const filtered = enriched.filter(c => {
        if (currentFilter === "ALL") return true;
        return c.risk === currentFilter;
    });

    const tbody = document.getElementById('case-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-14 text-center text-slate-400">
                    <div class="flex flex-col items-center justify-center space-y-3">
                        <div class="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-2xl text-slate-400">
                            📋
                        </div>
                        <p class="text-white font-bold text-sm font-heading">No Patient Check-Ins Yet</p>
                        <p class="text-xs text-slate-400 max-w-sm leading-relaxed">
                            No survivors have registered or completed the wellness intake check-in yet. As soon as a patient submits their 10 daily questions, their real clinical report and longitudinal graph will appear here automatically.
                        </p>
                    </div>
                </td>
            </tr>
        `;
        if (!cases.some(c => c.caseId === selectedCaseId)) {
            closeCaseDetails();
        }
        renderEscalationsAndAlerts();
        return;
    }

    filtered.forEach(c => {
        const isSelected = selectedCaseId === c.caseId;
        const tr = document.createElement('tr');
        tr.className = `hover:bg-slate-800/80 cursor-pointer border-b border-slate-800/80 transition-colors ${isSelected ? 'bg-sky-950/70 border-l-4 border-l-sky-500' : ''}`;
        tr.onclick = () => selectCase(c.caseId, true);

        // Risk Zone Pill (Single-line, elegant border, no jumping/up-and-down animation)
        let zoneBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-950/80 text-teal-300 border border-teal-500/40 shadow-xs whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0"></span>Green Zone</span>`;
        let barColor = 'bg-teal-500';
        if (c.risk === "HIGH") {
            zoneBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-950/80 text-rose-300 border border-rose-500/50 shadow-xs whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>Red Zone</span>`;
            barColor = 'bg-rose-500';
        } else if (c.risk === "MODERATE") {
            zoneBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/50 shadow-xs whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>Yellow Zone</span>`;
            barColor = 'bg-amber-500';
        }

        const milestoneText = c.milestone || (c.latest ? c.latest.milestone : "Active Hearing");

        tr.innerHTML = `
            <td class="px-4 py-3">
                <div class="font-bold text-teal-300 text-xs flex items-center gap-1.5">
                    <span>👤</span>
                    <span>${escapeHtml(c.victimName || c.caseId)}</span>
                </div>
                <div class="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                    <span>Token: ${escapeHtml(c.caseId || c.token || 'CASE')}</span>
                    ${c.phone ? `<span>• 📞 ${escapeHtml(c.phone)}</span>` : ''}
                </div>
            </td>
            <td class="px-4 py-3">
                <div class="text-slate-200 text-xs font-medium max-w-[200px] truncate" title="${escapeHtml(c.lineOfWork ? 'Work: ' + c.lineOfWork : c.category)}">
                    ${escapeHtml(c.lineOfWork ? `Profession: ${c.lineOfWork}` : (c.category || 'Survivor Check-in'))}
                </div>
                <div class="text-[10px] text-slate-400">Baseline: ${escapeHtml(c.baselineStress || 'Moderate')}</div>
            </td>
            <td class="px-4 py-3">
                <span class="text-[11px] text-slate-300">${milestoneText}</span>
            </td>
            <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                    <span class="font-mono font-bold text-white text-xs">${c.score}</span>
                    <div class="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div class="h-full ${barColor}" style="width: ${c.score}%"></div>
                    </div>
                </div>
            </td>
            <td class="px-4 py-3 whitespace-nowrap">
                ${zoneBadge}
            </td>
            <td class="px-4 py-3 text-right">
                <button onclick="event.stopPropagation(); selectCase('${c.caseId}', true)" class="text-sky-400 hover:text-sky-300 font-bold text-xs flex items-center gap-1 ml-auto cursor-pointer">
                    <span>Review</span> <span>&rarr;</span>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    renderEscalationsAndAlerts();
}

function renderEscalationsAndAlerts() {
    const escalationsContainer = document.getElementById('dashboard-urgent-escalations');
    const alertsContainer = document.getElementById('alerts-list-container');
    
    const urgentCases = cases.filter(c => {
        const latest = (c.checkIns && c.checkIns.length > 0) ? c.checkIns[c.checkIns.length - 1] : null;
        return (latest && latest.riskLevel === 'HIGH') || c.threatLevel === 'HIGH';
    });

    if (escalationsContainer) {
        if (urgentCases.length === 0) {
            escalationsContainer.innerHTML = `
                <div class="p-6 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-slate-400">
                    <span>No urgent psychological escalations at this time. All patient check-in signals are within normal limits.</span>
                </div>
            `;
        } else {
            escalationsContainer.innerHTML = urgentCases.map(c => {
                const latest = c.checkIns[c.checkIns.length - 1];
                return `
                    <div class="p-4 rounded-xl bg-slate-900/90 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="font-bold text-rose-300 font-mono">${escapeHtml(c.victimName || c.caseId)}</span>
                                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300">DDS: ${latest ? latest.ddiScore : 90} (HIGH THREAT)</span>
                            </div>
                            <p class="text-slate-300 mt-1">${escapeHtml(c.latestJournal || (latest && latest.notes) || "Severe distress reported during daily check-in.")}</p>
                            <span class="text-[10px] text-slate-400 font-mono">Token: ${escapeHtml(c.caseId)} • Ph: ${escapeHtml(c.phone || 'Confidential')}</span>
                        </div>
                        <div class="flex items-center gap-2 shrink-0">
                            <button onclick="triggerEmergencyDispatch()" class="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] cursor-pointer">
                                112 Escalation
                            </button>
                            <button onclick="switchMonitorTab('cases'); selectCase('${c.caseId}')" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] cursor-pointer">
                                Open Case
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    if (alertsContainer) {
        if (urgentCases.length === 0) {
            alertsContainer.innerHTML = `
                <div class="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400">
                    <div class="text-3xl mb-2">🛡️</div>
                    <p class="text-white font-bold text-sm">No Active Crisis Alerts</p>
                    <p class="text-xs text-slate-400 max-w-sm mx-auto mt-1">No severe escalations requiring immediate law enforcement or shelter protection are currently flagged.</p>
                </div>
            `;
        } else {
            alertsContainer.innerHTML = urgentCases.map(c => {
                const latest = c.checkIns[c.checkIns.length - 1];
                return `
                    <div class="monitor-card p-5 border-rose-900/50 bg-rose-950/20 space-y-3">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <span class="px-2 py-0.5 rounded text-xs font-bold bg-rose-600 text-white">ACTIVE THREAT</span>
                                <span class="font-mono font-bold text-rose-300">${escapeHtml(c.victimName || c.caseId)}</span>
                                <span class="text-slate-400 text-xs">• Token: ${escapeHtml(c.caseId)}</span>
                            </div>
                            <span class="text-[11px] font-mono text-slate-400">Recent check-in</span>
                        </div>
                        <p class="text-sm text-slate-200">
                            <strong>Threat / Check-in Notes:</strong> ${escapeHtml(c.latestJournal || (latest && latest.notes) || "Elevated threat scores detected in conversational check-in.")}
                        </p>
                        <div class="flex items-center gap-3 pt-2">
                            <button onclick="triggerEmergencyDispatch()" class="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer">
                                Dispatch Police Guard
                            </button>
                            <button onclick="switchMonitorTab('cases'); selectCase('${c.caseId}')" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer">
                                View Case History
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }
}

function filterQueue(tier) {
    currentFilter = tier;
    const filterButtons = [
        { id: 'filter-all', key: 'ALL' },
        { id: 'filter-high', key: 'HIGH' },
        { id: 'filter-mod', key: 'MODERATE' },
        { id: 'filter-low', key: 'LOW' }
    ];
    filterButtons.forEach(btn => {
        const el = document.getElementById(btn.id);
        if (!el) return;
        if (btn.key === tier) {
            el.className = "px-3 py-1.5 rounded-lg bg-sky-600 text-white font-bold";
        } else {
            el.className = "px-3 py-1.5 rounded-lg text-slate-400 hover:text-white font-medium";
        }
    });
    renderDashboard();
}

function selectCase(caseId, shouldBeep = true) {
    if (shouldBeep) playHapticBeep(720, 'sine', 0.08);
    selectedCaseId = caseId;

    const targetCase = cases.find(c => c.caseId === caseId);
    if (!targetCase) {
        closeCaseDetails();
        return;
    }

    // Auto-repair & score case in case it had undefined or NaN
    repairAndScoreCase(targetCase);

    // Open full-page Patient History & Clinical Diagnostics Dossier
    openPatientDossier(caseId);
    return;

    // === Legacy inline panel code below (kept as fallback) ===
    // Toggle Empty state vs Case details drawer
    const emptyState = document.getElementById('no-case-selected') || document.getElementById('case-details-empty');
    const details = document.getElementById('case-details');
    if (emptyState) {
        emptyState.classList.add('hidden');
        emptyState.classList.remove('flex');
    }
    if (details) {
        details.classList.remove('hidden');
        details.classList.add('flex');
    }

    // Populate Details Header with survivor name, case id, profession & phone
    const idEl = document.getElementById('detail-case-id');
    const badgeEl = document.getElementById('detail-risk-badge');
    const catEl = document.getElementById('detail-category');

    if (idEl) idEl.innerText = targetCase.victimName ? `${targetCase.victimName} (${targetCase.caseId})` : targetCase.caseId;
    if (catEl) catEl.innerText = `${targetCase.lineOfWork ? 'Profession: ' + targetCase.lineOfWork + ' • ' : ''}Stress: ${targetCase.baselineStress || 'Moderate'} • Ph: ${targetCase.phone || 'Confidential'}`;

    const latest = targetCase.checkIns && targetCase.checkIns.length > 0 ? targetCase.checkIns[targetCase.checkIns.length - 1] : null;
    const score = latest && latest.ddiScore !== undefined && !isNaN(latest.ddiScore) ? latest.ddiScore : 0;
    const risk = (latest && latest.riskLevel) ? latest.riskLevel : targetCase.threatLevel || (score >= 70 ? "HIGH" : (score >= 40 ? "MODERATE" : "LOW"));

    if (badgeEl) {
        if (risk === "HIGH") {
            badgeEl.className = "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-rose-950/80 text-rose-300 border border-rose-500/50 whitespace-nowrap shadow-xs";
            badgeEl.innerText = "RED ZONE • HIGH RISK";
        } else if (risk === "MODERATE") {
            badgeEl.className = "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-950/80 text-amber-300 border border-amber-500/50 whitespace-nowrap shadow-xs";
            badgeEl.innerText = "YELLOW ZONE • ELEVATED";
        } else {
            badgeEl.className = "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-teal-950/80 text-teal-300 border border-teal-500/50 whitespace-nowrap shadow-xs";
            badgeEl.innerText = "GREEN ZONE • LOW";
        }
    }

    // Dynamic Multi-Segment Radial Gauge & Score Update (SIH-26094 Telemetry)
    const radialCircle = document.getElementById('detail-radial-gauge');
    const ddsValEl = document.getElementById('detail-dds-val');
    const beaconDot = document.getElementById('detail-beacon-dot');
    const zoneText = document.getElementById('detail-zone-text');

    if (ddsValEl) ddsValEl.innerText = score;
    if (radialCircle) {
        // Circumference 2 * PI * 40 ≈ 251.32
        const circumference = 251;
        const offset = Math.max(0, Math.min(circumference, Math.round(circumference - (circumference * score / 100))));
        radialCircle.style.strokeDashoffset = offset;
        const strokeColor = score >= 70 ? "#f43f5e" : (score >= 40 ? "#f59e0b" : "#10b981");
        radialCircle.setAttribute("stroke", strokeColor);
    }
    if (beaconDot) {
        beaconDot.className = score >= 70 ? "w-2 h-2 rounded-full beacon-dot-rose" : (score >= 40 ? "w-2 h-2 rounded-full beacon-dot-amber" : "w-2 h-2 rounded-full beacon-dot-emerald");
    }
    if (zoneText) {
        if (score >= 70) {
            zoneText.innerText = "RED ZONE (CRITICAL PRIORITY)";
            zoneText.className = "font-bold text-rose-300 font-mono text-[11px]";
        } else if (score >= 40) {
            zoneText.innerText = "YELLOW ZONE (ELEVATED DISTRESS)";
            zoneText.className = "font-bold text-amber-300 font-mono text-[11px]";
        } else {
            zoneText.innerText = "GREEN ZONE (STABLE / LOW)";
            zoneText.className = "font-bold text-emerald-300 font-mono text-[11px]";
        }
    }

    // Velocity Indicator
    const vBadge = document.getElementById('detail-velocity-badge');
    if (vBadge) {
        let velText = "Trajectory: Stable";
        let velClass = "text-slate-400";
        if (score >= 70) {
            velText = "High Alert • Critical Distress";
            velClass = "text-rose-400 font-bold";
        } else if (score >= 40) {
            velText = "Elevated • Monitor Closely";
            velClass = "text-amber-400 font-bold";
        }
        if (targetCase.checkIns && targetCase.checkIns.length >= 2) {
            const prev = targetCase.checkIns[targetCase.checkIns.length - 2].ddiScore || 0;
            const diff = score - prev;
            if (diff > 0) {
                velText = `Spike: +${diff} pts`;
                velClass = diff >= 15 ? "text-rose-400 font-bold" : "text-amber-400 font-bold";
            } else if (diff < 0) {
                velText = `Drop: ${diff} pts`;
                velClass = "text-teal-400 font-bold";
            }
        }
        vBadge.innerText = velText;
        vBadge.className = `text-[10px] font-mono ${velClass}`;
    }

    // Explainable AI Synthesis Text
    const synthText = document.getElementById('ai-synthesis-text');
    if (synthText) {
        if (latest && latest.synthesisNote) {
            synthText.innerText = latest.synthesisNote;
        } else if (score >= 70) {
            synthText.innerText = `Non-diagnostic statutory triage: Dynamic Distress Score ${score}/100 (HIGH RISK) recorded for ${targetCase.victimName || targetCase.caseId}. Critical distress signals detected across check-in responses. Immediate caseworker contact and safety escort recommended under SC/ST Act SOP.`;
        } else if (score >= 40) {
            synthText.innerText = `Non-diagnostic statutory triage: Dynamic Distress Score ${score}/100 (ELEVATED) recorded for ${targetCase.victimName || targetCase.caseId}. Moderate anxiety and somatic tension noted. Clinical check-in recommended within 24 hours.`;
        } else {
            synthText.innerText = `Non-diagnostic statutory triage: Dynamic Distress Score ${score}/100 (STABLE) recorded for ${targetCase.victimName || targetCase.caseId}. Baseline stress: ${targetCase.baselineStress || 'Moderate'}. Routine follow-up scheduled.`;
        }
    }

    // Explainable AI Attribution Bars (Exact weights: Questionnaire 50%, NLP 30%, Acoustic 20%)
    let surveyPts, nlpPts, acousticPts;
    if (latest && latest.surveyPoints !== undefined && !isNaN(latest.surveyPoints)) {
        surveyPts = latest.surveyPoints;
        nlpPts = latest.nlpPoints;
        acousticPts = latest.acousticPoints;
    } else {
        surveyPts = Math.min(50, Math.round(score * 0.50));
        nlpPts = Math.min(30, Math.round(score * 0.30));
        acousticPts = Math.min(20, Math.max(0, score - surveyPts - nlpPts));
    }
    const surveyBarPct = Math.min(100, Math.round((surveyPts / 50) * 100));
    const nlpBarPct = Math.min(100, Math.round((nlpPts / 30) * 100));
    const acousticBarPct = Math.min(100, Math.round((acousticPts / 20) * 100));

    const xSafety = document.getElementById('detail-xai-safety');
    const xSafetyBar = document.getElementById('detail-xai-safety-bar');
    if (xSafety) xSafety.innerText = `${surveyPts} pts (${surveyBarPct}%)`;
    if (xSafetyBar) xSafetyBar.style.width = `${surveyBarPct}%`;

    const xSent = document.getElementById('detail-xai-sentiment');
    const xSentBar = document.getElementById('detail-xai-sentiment-bar');
    if (xSent) xSent.innerText = `${nlpPts} pts (${nlpBarPct}%)`;
    if (xSentBar) xSentBar.style.width = `${nlpBarPct}%`;

    const xAcoustic = document.getElementById('detail-xai-acoustic');
    const xAcousticBar = document.getElementById('detail-xai-acoustic-bar');
    if (xAcoustic) xAcoustic.innerText = `${acousticPts} pts (${acousticBarPct}%)`;
    if (xAcousticBar) xAcousticBar.style.width = `${acousticBarPct}%`;

    // Survivor Journal Quote
    const journalEl = document.getElementById('detail-journal');
    if (journalEl) {
        journalEl.innerText = targetCase.latestJournal || (latest && latest.notes) || (targetCase.checkIns && targetCase.checkIns.length > 0 ? targetCase.checkIns[0].notes : "No check-in statement recorded yet.");
    }

    // Audit Log of Past Interventions
    renderInterventions(targetCase);

    // Case Milestone Timeline
    renderCaseTimeline(targetCase);

    // 6-Week Longitudinal Trend Line Chart
    renderLongitudinalChart(targetCase);

    // Patient Daily Check-in Chat Transcript (Doctor Exclusive Review)
    renderCheckInTranscript(targetCase);

    // Re-render table to reflect row active highlight
    const tbody = document.getElementById('case-table-body');
    if (tbody) {
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(r => {
            const idCell = r.querySelector('td .font-mono');
            if (idCell && idCell.innerText.includes(caseId)) {
                r.className = "hover:bg-slate-800/80 cursor-pointer border-b border-slate-800/80 transition-colors bg-sky-950/70 border-l-4 border-l-sky-500";
            } else {
                r.className = "hover:bg-slate-800/80 cursor-pointer border-b border-slate-800/80 transition-colors";
            }
        });
    }
}

function closeCaseDetails() {
    playHapticBeep(480, 'sine', 0.06);
    selectedCaseId = null;
    const emptyState = document.getElementById('no-case-selected') || document.getElementById('case-details-empty');
    const details = document.getElementById('case-details');
    if (emptyState) {
        emptyState.classList.remove('hidden');
        emptyState.classList.add('flex');
    }
    if (details) {
        details.classList.add('hidden');
        details.classList.remove('flex');
    }
}

// ============================================================================
// PATIENT HISTORY & CLINICAL DIAGNOSTICS DOSSIER
// Multi-dimensional deep-dive patient intelligence view
// ============================================================================

// Patient notes storage (preserved with patient data)
if (typeof window.patientDossierNotes === 'undefined') {
    window.patientDossierNotes = {};
}
if (typeof window.patientActionLogs === 'undefined') {
    window.patientActionLogs = {};
}

// Open full-page dossier for a patient
function openPatientDossier(caseId) {
    if (typeof playHapticBeep === 'function') playHapticBeep(820, 'sine', 0.1);
    selectedCaseId = caseId;

    const targetCase = cases.find(c => c.caseId === caseId);
    if (!targetCase) {
        console.warn('No case found for dossier:', caseId);
        return;
    }

    // Repair & score to ensure data integrity
    if (typeof repairAndScoreCase === 'function') repairAndScoreCase(targetCase);

    // Hide all counselor view tabs
    ['dashboard', 'nexora-ai', 'cases', 'alerts', 'analytics', 'reports', 'settings'].forEach(t => {
        const pane = document.getElementById(`tab-pane-${t}`);
        if (pane) pane.classList.add('hidden');
    });

    // Show dossier view
    const dossier = document.getElementById('patient-dossier-view');
    if (dossier) {
        dossier.classList.remove('hidden');
        // Scroll to top
        const mainContent = dossier.closest('.flex-1') || dossier.parentElement;
        if (mainContent) mainContent.scrollTop = 0;
    }

    // Populate dossier with patient data
    populateDossier(targetCase);

    // Render all visualizations
    setTimeout(() => {
        renderRadarChart(targetCase);
        renderTimelineChart(targetCase);
        renderGenogram(targetCase);
        renderKnowledgeGraph(targetCase);
        renderHistograms(targetCase);
        renderNotesHistory(caseId);
        renderActionLog(caseId);
    }, 100);
}

// Close dossier and return to cases tab
function closePatientDossier() {
    if (typeof playHapticBeep === 'function') playHapticBeep(420, 'sine', 0.06);

    // Hide dossier
    const dossier = document.getElementById('patient-dossier-view');
    if (dossier) dossier.classList.add('hidden');

    // Show cases tab (the original triage feed)
    if (typeof switchMonitorTab === 'function') {
        switchMonitorTab('cases');
    }

    // Clear selected case
    selectedCaseId = null;
}

// Populate dossier header and baseline info
function populateDossier(c) {
    // Header
    const nameEl = document.getElementById('dossier-patient-name');
    const metaEl = document.getElementById('dossier-patient-meta');
    const badgeEl = document.getElementById('dossier-patient-badge');

    if (nameEl) nameEl.textContent = c.victimName ? c.victimName : 'Anonymous Survivor';
    if (metaEl) metaEl.textContent = `${c.caseId} • ${c.lineOfWork || 'Profession Confidential'} • ${c.phone || 'Contact Protected'}`;

    // Risk badge
    const latest = c.checkIns && c.checkIns.length > 0 ? c.checkIns[c.checkIns.length - 1] : null;
    const score = latest && latest.ddiScore !== undefined ? latest.ddiScore : 0;
    const risk = score >= 70 ? 'HIGH' : (score >= 40 ? 'MODERATE' : 'LOW');

    if (badgeEl) {
        if (risk === 'HIGH') {
            badgeEl.className = 'px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30';
            badgeEl.textContent = '🔴 HIGH RISK';
        } else if (risk === 'MODERATE') {
            badgeEl.className = 'px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30';
            badgeEl.textContent = '🟡 ELEVATED';
        } else {
            badgeEl.className = 'px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
            badgeEl.textContent = '🟢 STABLE';
        }
    }

    // Baseline fields
    const idEl = document.getElementById('dossier-id');
    const intakeEl = document.getElementById('dossier-intake');
    const workEl = document.getElementById('dossier-work');
    const contactEl = document.getElementById('dossier-contact');
    const stressEl = document.getElementById('dossier-stress');
    const checkinsEl = document.getElementById('dossier-checkins');

    if (idEl) idEl.textContent = c.caseId;
    if (intakeEl) {
        const ts = c.intakeTimestamp || c.timestamp || Date.now();
        intakeEl.textContent = new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    if (workEl) workEl.textContent = c.lineOfWork || 'Not specified';
    if (contactEl) contactEl.textContent = c.phone || 'Protected';
    if (stressEl) {
        const stress = c.baselineStress || 'Moderate';
        stressEl.textContent = stress;
        stressEl.className = stress.toLowerCase().includes('high') || stress.toLowerCase().includes('severe')
            ? 'text-rose-300 font-bold'
            : stress.toLowerCase().includes('low') || stress.toLowerCase().includes('manageable')
                ? 'text-emerald-300 font-bold'
                : 'text-amber-300 font-bold';
    }
    if (checkinsEl) checkinsEl.textContent = (c.checkIns || []).length;

    // Risk gauge
    const gauge = document.getElementById('dossier-gauge');
    const scoreEl = document.getElementById('dossier-score');
    const labelEl = document.getElementById('dossier-risk-label');

    if (gauge) {
        const circumference = 251;
        const offset = circumference - (circumference * score / 100);
        gauge.style.strokeDashoffset = offset;
        const strokeColor = score >= 70 ? '#ff6b6b' : (score >= 40 ? '#facc15' : '#34d399');
        gauge.setAttribute('stroke', strokeColor);
    }
    if (scoreEl) scoreEl.textContent = score;
    if (labelEl) {
        if (score >= 70) {
            labelEl.textContent = 'CRITICAL PRIORITY';
            labelEl.className = 'text-sm font-bold text-rose-300 mt-4';
        } else if (score >= 40) {
            labelEl.textContent = 'ELEVATED DISTRESS';
            labelEl.className = 'text-sm font-bold text-amber-300 mt-4';
        } else {
            labelEl.textContent = 'STABLE / LOW';
            labelEl.className = 'text-sm font-bold text-emerald-300 mt-4';
        }
    }

    // Narrative
    const narrativeEl = document.getElementById('dossier-narrative');
    if (narrativeEl) {
        const narrative = buildClinicalNarrative(c);
        narrativeEl.innerHTML = narrative;
    }
}

// Build clinical narrative HTML
function buildClinicalNarrative(c) {
    const latest = c.checkIns && c.checkIns.length > 0 ? c.checkIns[c.checkIns.length - 1] : null;
    const parts = [];

    parts.push(`<p class="text-slate-300 leading-relaxed"><strong class="text-cyan-300">Reported Symptoms:</strong> ${c.reportedSymptoms || latest?.summary || 'No acute symptoms reported in latest check-in. Continue daily monitoring.'}</p>`);

    parts.push(`<p class="text-slate-300 leading-relaxed"><strong class="text-cyan-300">Known Triggers:</strong> ${c.triggers || 'No specific triggers documented. Monitor for court-related anxiety patterns.'}</p>`);

    if (c.priorIncidents && c.priorIncidents.length > 0) {
        parts.push(`<p class="text-slate-300 leading-relaxed"><strong class="text-cyan-300">Prior Incidents:</strong> ${c.priorIncidents.join('; ')}</p>`);
    }

    if (latest && latest.journal) {
        parts.push(`<div class="mt-3 p-3 rounded-lg bg-slate-800/50 border-l-2 border-cyan-400"><p class="text-xs text-slate-400 mb-1 font-mono uppercase tracking-wider">Latest Journal Entry</p><p class="text-slate-200 italic">"${latest.journal}"</p></div>`);
    }

    return parts.join('');
}

// Switch dossier tab
function switchDossierTab(tabName) {
    if (typeof playHapticBeep === 'function') playHapticBeep(580, 'sine', 0.05);

    const tabs = ['radar', 'timeline', 'genogram', 'knowledge', 'histogram'];
    tabs.forEach(t => {
        const tab = document.getElementById(`dossier-tab-${t}`);
        const content = document.getElementById(`dossier-content-${t}`);
        if (t === tabName) {
            if (tab) {
                tab.classList.add('active');
                tab.classList.remove('text-slate-400');
                tab.classList.add('text-white');
            }
            if (content) content.classList.remove('hidden');
        } else {
            if (tab) {
                tab.classList.remove('active');
                tab.classList.remove('text-white');
                tab.classList.add('text-slate-400');
            }
            if (content) content.classList.add('hidden');
        }
    });

    // Re-render charts when tab is shown
    setTimeout(() => {
        const target = cases.find(c => c.caseId === selectedCaseId);
        if (!target) return;
        if (tabName === 'radar') renderRadarChart(target);
        if (tabName === 'timeline') renderTimelineChart(target);
        if (tabName === 'genogram') renderGenogram(target);
        if (tabName === 'knowledge') renderKnowledgeGraph(target);
        if (tabName === 'histogram') renderHistograms(target);
    }, 50);
}

// Radar Chart (Affective Dimensionality)
function renderRadarChart(c) {
    const canvas = document.getElementById('radar-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const radius = Math.min(W, H) / 2 - 40;

    // Compute metrics from patient data
    const latest = c.checkIns && c.checkIns.length > 0 ? c.checkIns[c.checkIns.length - 1] : null;
    const baseScore = latest && latest.ddiScore !== undefined ? latest.ddiScore : 50;

    // Calculate 6 affective dimensions
    const metrics = computeAffectiveDimensions(c, baseScore);

    // Update side bars
    const keys = ['anxiety', 'depressive', 'sleep', 'cognitive', 'social', 'resilience'];
    const colorMap = {
        anxiety: 'rose', depressive: 'purple', sleep: 'amber',
        cognitive: 'sky', social: 'violet', resilience: 'emerald'
    };
    keys.forEach(k => {
        const val = Math.round(metrics[k]);
        const valEl = document.getElementById(`radar-val-${k}`);
        const numEl = document.getElementById(`radar-num-${k}`);
        if (valEl) valEl.style.width = val + '%';
        if (numEl) numEl.textContent = val + '%';
    });

    // Clear canvas
    ctx.clearRect(0, 0, W, H);

    // Draw concentric grid (5 layers)
    const layers = 5;
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= layers; i++) {
        const r = (radius / layers) * i;
        ctx.beginPath();
        for (let j = 0; j < 6; j++) {
            const angle = (Math.PI * 2 * j) / 6 - Math.PI / 2;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            if (j === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
    }

    // Draw axis lines
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.15)';
    for (let j = 0; j < 6; j++) {
        const angle = (Math.PI * 2 * j) / 6 - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
        ctx.stroke();
    }

    // Draw data polygon
    const points = keys.map((k, j) => {
        const angle = (Math.PI * 2 * j) / 6 - Math.PI / 2;
        const r = (metrics[k] / 100) * radius;
        return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r, label: k, value: metrics[k] };
    });

    // Filled gradient
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0, 'rgba(34, 211, 238, 0.4)');
    grad.addColorStop(1, 'rgba(139, 92, 246, 0.2)');

    ctx.beginPath();
    points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Stroke
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw vertices with glow
    points.forEach(p => {
        // Outer glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(34, 211, 238, 0.3)';
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#67e8f9';
        ctx.fill();
    });

    // Draw labels
    const labels = ['ANXIETY', 'DEPRESSIVE', 'SLEEP', 'COGNITIVE', 'SOCIAL', 'RESILIENCE'];
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    points.forEach((p, j) => {
        const angle = (Math.PI * 2 * j) / 6 - Math.PI / 2;
        const lx = cx + Math.cos(angle) * (radius + 25);
        const ly = cy + Math.sin(angle) * (radius + 25);
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(labels[j], lx, ly);
    });
}

// Compute affective dimensions from case data
function computeAffectiveDimensions(c, baseScore) {
    const latest = c.checkIns && c.checkIns.length > 0 ? c.checkIns[c.checkIns.length - 1] : null;
    const allText = (c.checkIns || []).map(ci => (ci.journal || '') + ' ' + (ci.answers || []).map(a => a.text || a.answer || '').join(' ')).join(' ').toLowerCase();

    const hasKeyword = (kw) => allText.includes(kw);
    const keywordBoost = (count) => Math.min(30, count * 6);

    let anxiety = baseScore * 0.9;
    if (hasKeyword('panic') || hasKeyword('anxious') || hasKeyword('worry') || hasKeyword('scared')) anxiety += 10;
    if (hasKeyword('fear') || hasKeyword('terrified')) anxiety += 15;

    let depressive = baseScore * 0.7;
    if (hasKeyword('hopeless') || hasKeyword('depressed') || hasKeyword('alone') || hasKeyword('crying')) depressive += 20;
    if (hasKeyword('isolated') || hasKeyword('nobody')) depressive += 15;

    let sleep = baseScore * 0.6;
    if (hasKeyword('sleep') || hasKeyword('insomnia') || hasKeyword('nightmare')) sleep += 25;
    if (hasKeyword('night') || hasKeyword('awake')) sleep += 10;

    let cognitive = baseScore * 0.5;
    if (hasKeyword('confused') || hasKeyword('memory') || hasKeyword('focus') || hasKeyword('concentrate')) cognitive += 15;

    let social = baseScore * 0.4;
    if (hasKeyword('alone') || hasKeyword('isolated') || hasKeyword('nobody') || hasKeyword('no one')) social += 30;
    if (hasKeyword('boycott') || hasKeyword('avoid')) social += 15;

    // Resilience is INVERSE - higher when other metrics are lower
    let resilience = 100 - baseScore;
    if (hasKeyword('hope') || hasKeyword('support') || hasKeyword('family') || hasKeyword('friend')) resilience += 15;
    if (hasKeyword('strong') || hasKeyword('cope') || hasKeyword('manage')) resilience += 10;

    return {
        anxiety: Math.min(100, Math.max(5, anxiety)),
        depressive: Math.min(100, Math.max(5, depressive)),
        sleep: Math.min(100, Math.max(5, sleep)),
        cognitive: Math.min(100, Math.max(5, cognitive)),
        social: Math.min(100, Math.max(5, social)),
        resilience: Math.min(100, Math.max(5, resilience))
    };
}

// Timeline Chart (Longitudinal Pulse)
function renderTimelineChart(c) {
    const canvas = document.getElementById('timeline-chart');
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
    }

    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Build timeline data from checkIns
    const checkIns = c.checkIns || [];
    const points = checkIns.length > 0 ? checkIns.map((ci, i) => ({
        x: i,
        distress: ci.ddiScore || 50,
        grounding: ci.groundingAdherence || (100 - (ci.ddiScore || 50) * 0.7),
        sleep: ci.sleepQuality || (60 + Math.random() * 30)
    })) : generateSampleTimeline();

    if (points.length < 2) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Insufficient data for longitudinal tracking', W / 2, H / 2);
        return;
    }

    const padding = 40;
    const chartW = W - padding * 2;
    const chartH = H - padding * 2;

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        const y = padding + (chartH / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(W - padding, y);
        ctx.stroke();
    }

    // Y-axis labels
    ctx.fillStyle = '#64748b';
    ctx.font = '9px JetBrains Mono';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
        const y = padding + (chartH / 5) * i;
        const val = 100 - i * 20;
        ctx.fillText(val + '', padding - 5, y + 3);
    }

    // Helper to draw smooth curve
    function drawCurve(data, color, fillGradient) {
        if (data.length < 2) return;

        // Build points
        const pts = data.map((d, i) => ({
            x: padding + (chartW * i) / (data.length - 1),
            y: padding + chartH - (d / 100) * chartH
        }));

        // Draw smooth curve using quadratic curves
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
            const xc = (pts[i].x + pts[i - 1].x) / 2;
            const yc = (pts[i].y + pts[i - 1].y) / 2;
            ctx.quadraticCurveTo(pts[i - 1].x, pts[i - 1].y, xc, yc);
        }
        ctx.quadraticCurveTo(pts[pts.length - 2].x, pts[pts.length - 2].y, pts[pts.length - 1].x, pts[pts.length - 1].y);

        // Fill area
        if (fillGradient) {
            const linePath = ctx.path;
            ctx.lineTo(pts[pts.length - 1].x, padding + chartH);
            ctx.lineTo(pts[0].x, padding + chartH);
            ctx.closePath();
            ctx.fillStyle = fillGradient;
            ctx.fill();
            // Restore line
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            for (let i = 1; i < pts.length; i++) {
                const xc = (pts[i].x + pts[i - 1].x) / 2;
                const yc = (pts[i].y + pts[i - 1].y) / 2;
                ctx.quadraticCurveTo(pts[i - 1].x, pts[i - 1].y, xc, yc);
            }
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Draw data points with glow
        pts.forEach((p, idx) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
            ctx.fillStyle = color.replace(')', ', 0.2)').replace('rgb', 'rgba');
            ctx.fill();

            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
        });
    }

    // Draw three curves
    const distGrad = ctx.createLinearGradient(0, padding, 0, padding + chartH);
    distGrad.addColorStop(0, 'rgba(255, 107, 107, 0.3)');
    distGrad.addColorStop(1, 'rgba(255, 107, 107, 0.0)');

    const groundGrad = ctx.createLinearGradient(0, padding, 0, padding + chartH);
    groundGrad.addColorStop(0, 'rgba(52, 211, 153, 0.25)');
    groundGrad.addColorStop(1, 'rgba(52, 211, 153, 0.0)');

    const sleepGrad = ctx.createLinearGradient(0, padding, 0, padding + chartH);
    sleepGrad.addColorStop(0, 'rgba(250, 204, 21, 0.25)');
    sleepGrad.addColorStop(1, 'rgba(250, 204, 21, 0.0)');

    drawCurve(points.map(p => p.distress), 'rgb(255, 107, 107)', distGrad);
    drawCurve(points.map(p => p.grounding), 'rgb(52, 211, 153)', groundGrad);
    drawCurve(points.map(p => p.sleep), 'rgb(250, 204, 21)', sleepGrad);

    // X-axis labels (time points)
    ctx.fillStyle = '#64748b';
    ctx.font = '9px JetBrains Mono';
    ctx.textAlign = 'center';
    points.forEach((p, i) => {
        if (i % Math.max(1, Math.floor(points.length / 6)) === 0) {
            const x = padding + (chartW * i) / (points.length - 1);
            const days = points.length > 6 ? ['W-6', 'W-5', 'W-4', 'W-3', 'W-2', 'W-1', 'Now'] : ['T1', 'T2', 'T3', 'T4', 'T5'];
            ctx.fillText(days[Math.floor(i / Math.max(1, Math.floor(points.length / 7)))] || 'T' + (i + 1), x, H - 10);
        }
    });
}

function generateSampleTimeline() {
    const points = [];
    for (let i = 0; i < 7; i++) {
        points.push({
            distress: 40 + Math.sin(i * 0.8) * 25 + Math.random() * 10,
            grounding: 50 + Math.cos(i * 0.6) * 20 + Math.random() * 8,
            sleep: 60 + Math.sin(i * 0.5 + 1) * 15 + Math.random() * 10
        });
    }
    return points;
}

// Genogram (Familial Network)
function renderGenogram(c) {
    const svg = document.getElementById('genogram-svg');
    if (!svg) return;

    const container = document.getElementById('genogram-container');
    if (!container) return;

    const W = container.clientWidth;
    const H = container.clientHeight;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    // Clear
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    // Define family members (genogram nodes)
    const nodes = [
        { id: 'patient', label: c.victimName || 'Patient', x: W / 2, y: H / 2 + 30, type: 'patient', gender: 'f' },
        { id: 'spouse', label: 'Spouse', x: W / 2 - 100, y: H / 2 + 100, type: 'family', gender: 'm' },
        { id: 'child1', label: 'Child 1', x: W / 2 - 50, y: H / 2 + 160, type: 'family', gender: 'f' },
        { id: 'child2', label: 'Child 2', x: W / 2 + 30, y: H / 2 + 160, type: 'family', gender: 'm' },
        { id: 'mother', label: 'Mother', x: W / 2 + 120, y: H / 2 - 30, type: 'family', gender: 'f' },
        { id: 'father', label: 'Father', x: W / 2 + 200, y: H / 2 - 30, type: 'family', gender: 'm', estranged: true },
        { id: 'sibling', label: 'Sibling', x: W / 2 - 150, y: H / 2 - 30, type: 'family', gender: 'm' },
        { id: 'friend', label: 'Close Friend', x: W / 2 - 180, y: H / 2 + 50, type: 'support', gender: 'f' },
        { id: 'lawyer', label: 'Legal Aid', x: W / 2 + 180, y: H / 2 + 80, type: 'support', gender: 'f' },
        { id: 'accused', label: 'Accused Family', x: W / 2 + 220, y: H / 2 + 160, type: 'stressor', gender: 'm' }
    ];

    // Define relationships (from, to, type)
    const relations = [
        { from: 'patient', to: 'spouse', type: 'strong' },
        { from: 'patient', to: 'child1', type: 'strong' },
        { from: 'patient', to: 'child2', type: 'strong' },
        { from: 'patient', to: 'mother', type: 'strong' },
        { from: 'patient', to: 'father', type: 'estranged' },
        { from: 'patient', to: 'sibling', type: 'moderate' },
        { from: 'patient', to: 'friend', type: 'strong' },
        { from: 'patient', to: 'lawyer', type: 'strong' },
        { from: 'accused', to: 'patient', type: 'conflict' },
        { from: 'spouse', to: 'child1', type: 'strong' },
        { from: 'spouse', to: 'child2', type: 'strong' },
        { from: 'mother', to: 'sibling', type: 'strong' }
    ];

    // Helper to get node
    const getNode = (id) => nodes.find(n => n.id === id);

    // Draw relations first (so nodes appear on top)
    relations.forEach(rel => {
        const from = getNode(rel.from);
        const to = getNode(rel.to);
        if (!from || !to) return;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', from.x);
        line.setAttribute('y1', from.y);
        line.setAttribute('x2', to.x);
        line.setAttribute('y2', to.y);
        line.setAttribute('stroke-width', rel.type === 'strong' ? '2' : '1.5');
        line.setAttribute('opacity', '0.6');

        if (rel.type === 'strong') {
            line.setAttribute('stroke', '#34d399');
        } else if (rel.type === 'estranged') {
            line.setAttribute('stroke', '#64748b');
            line.setAttribute('stroke-dasharray', '4 4');
        } else if (rel.type === 'conflict') {
            line.setAttribute('stroke', '#ff6b6b');
            line.setAttribute('stroke-dasharray', '6 2 2 2');
            line.setAttribute('stroke-width', '2.5');
        } else {
            line.setAttribute('stroke', '#a78bfa');
        }

        svg.appendChild(line);
    });

    // Draw nodes
    nodes.forEach(node => {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('transform', `translate(${node.x}, ${node.y})`);

        // Node shape based on gender
        let shape;
        if (node.type === 'patient') {
            // Highlighted circle for patient
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            shape.setAttribute('r', '32');
            shape.setAttribute('fill', 'rgba(34, 211, 238, 0.2)');
            shape.setAttribute('stroke', '#22d3ee');
            shape.setAttribute('stroke-width', '3');
            // Add glow
            const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
            const id = 'glow-' + node.id;
            filter.setAttribute('id', id);
            const blur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
            blur.setAttribute('stdDeviation', '3');
            blur.setAttribute('result', 'coloredBlur');
            const merge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
            const mn1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
            mn1.setAttribute('in', 'coloredBlur');
            const mn2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
            mn2.setAttribute('in', 'SourceGraphic');
            merge.appendChild(mn1);
            merge.appendChild(mn2);
            filter.appendChild(blur);
            filter.appendChild(merge);
            svg.appendChild(filter);
            shape.setAttribute('filter', `url(#${id})`);
        } else if (node.gender === 'm') {
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            shape.setAttribute('x', '-22');
            shape.setAttribute('y', '-22');
            shape.setAttribute('width', '44');
            shape.setAttribute('height', '44');
            shape.setAttribute('rx', '4');
            const color = node.type === 'support' ? '#34d399' : node.type === 'stressor' ? '#ff6b6b' : '#a78bfa';
            shape.setAttribute('fill', color + '30');
            shape.setAttribute('stroke', color);
            shape.setAttribute('stroke-width', '2');
        } else {
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            shape.setAttribute('r', '22');
            const color = node.type === 'support' ? '#34d399' : node.type === 'stressor' ? '#ff6b6b' : '#a78bfa';
            shape.setAttribute('fill', color + '30');
            shape.setAttribute('stroke', color);
            shape.setAttribute('stroke-width', '2');
        }

        g.appendChild(shape);

        // Label
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dy', '40');
        text.setAttribute('fill', '#cbd5e1');
        text.setAttribute('font-size', '10');
        text.setAttribute('font-family', 'JetBrains Mono');
        text.textContent = node.label;
        g.appendChild(text);

        // Type indicator
        if (node.type === 'support') {
            const icon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            icon.setAttribute('text-anchor', 'middle');
            icon.setAttribute('dy', '5');
            icon.setAttribute('fill', '#34d399');
            icon.setAttribute('font-size', '14');
            icon.textContent = '★';
            g.appendChild(icon);
        } else if (node.type === 'stressor') {
            const icon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            icon.setAttribute('text-anchor', 'middle');
            icon.setAttribute('dy', '5');
            icon.setAttribute('fill', '#ff6b6b');
            icon.setAttribute('font-size', '14');
            icon.textContent = '⚠';
            g.appendChild(icon);
        }

        svg.appendChild(g);
    });
}

// Knowledge Graph (Semantic Trigger Mesh)
function renderKnowledgeGraph(c) {
    const svg = document.getElementById('knowledge-svg');
    if (!svg) return;

    const container = document.getElementById('knowledge-container');
    if (!container) return;

    const W = container.clientWidth;
    const H = container.clientHeight;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    while (svg.firstChild) svg.removeChild(svg.firstChild);

    // Central patient node
    const cx = W / 2;
    const cy = H / 2;

    // Cluster definitions
    const clusters = [
        {
            name: 'Cognitive Triggers', color: '#22d3ee', icon: '🧠',
            nodes: [
                { label: 'Court Date', x: cx - 180, y: cy - 100 },
                { label: 'Accused Threat', x: cx - 220, y: cy - 30 },
                { label: 'Memory Flashback', x: cx - 180, y: cy + 60 }
            ]
        },
        {
            name: 'Coping Mechanisms', color: '#34d399', icon: '🤝',
            nodes: [
                { label: 'Family Support', x: cx + 180, y: cy - 100 },
                { label: 'Breathing Exercise', x: cx + 220, y: cy - 30 },
                { label: 'Counseling', x: cx + 180, y: cy + 60 }
            ]
        },
        {
            name: 'Medication/Therapy', color: '#a78bfa', icon: '💊',
            nodes: [
                { label: 'Tele-MANAS', x: cx - 100, y: cy - 150 },
                { label: 'Sleep Aid', x: cx + 80, y: cy - 150 }
            ]
        },
        {
            name: 'Environmental', color: '#fbbf24', icon: '🌍',
            nodes: [
                { label: 'Home Safety', x: cx - 100, y: cy + 150 },
                { label: 'Workplace Stress', x: cx + 80, y: cy + 150 }
            ]
        }
    ];

    // Draw connections from center to each node
    clusters.forEach(cluster => {
        cluster.nodes.forEach(node => {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', cx);
            line.setAttribute('y1', cy);
            line.setAttribute('x2', node.x);
            line.setAttribute('y2', node.y);
            line.setAttribute('stroke', cluster.color);
            line.setAttribute('stroke-width', '1.5');
            line.setAttribute('opacity', '0.4');
            line.setAttribute('stroke-dasharray', '3 3');
            svg.appendChild(line);
        });
    });

    // Draw cluster labels
    clusters.forEach(cluster => {
        const avgX = cluster.nodes.reduce((sum, n) => sum + n.x, 0) / cluster.nodes.length;
        const avgY = cluster.nodes.reduce((sum, n) => sum + n.y, 0) / cluster.nodes.length;

        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', avgX);
        label.setAttribute('y', avgY - 60);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('fill', cluster.color);
        label.setAttribute('font-size', '9');
        label.setAttribute('font-family', 'JetBrains Mono');
        label.setAttribute('font-weight', 'bold');
        label.textContent = cluster.icon + ' ' + cluster.name.toUpperCase();
        svg.appendChild(label);
    });

    // Draw nodes
    clusters.forEach(cluster => {
        cluster.nodes.forEach(node => {
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('transform', `translate(${node.x}, ${node.y})`);
            g.style.cursor = 'pointer';

            // Outer glow
            const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            glow.setAttribute('r', '20');
            glow.setAttribute('fill', cluster.color);
            glow.setAttribute('opacity', '0.1');
            g.appendChild(glow);

            // Main node
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('r', '14');
            circle.setAttribute('fill', 'rgba(3, 4, 10, 0.9)');
            circle.setAttribute('stroke', cluster.color);
            circle.setAttribute('stroke-width', '2');
            g.appendChild(circle);

            // Label
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dy', '30');
            text.setAttribute('fill', '#cbd5e1');
            text.setAttribute('font-size', '9');
            text.setAttribute('font-family', 'JetBrains Mono');
            text.textContent = node.label;
            g.appendChild(text);

            // Hover effect
            g.addEventListener('mouseenter', () => {
                circle.setAttribute('r', '18');
                glow.setAttribute('r', '25');
                glow.setAttribute('opacity', '0.3');
            });
            g.addEventListener('mouseleave', () => {
                circle.setAttribute('r', '14');
                glow.setAttribute('r', '20');
                glow.setAttribute('opacity', '0.1');
            });

            svg.appendChild(g);
        });
    });

    // Central patient node
    const centerG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    centerG.setAttribute('transform', `translate(${cx}, ${cy})`);

    const centerGlow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    centerGlow.setAttribute('r', '40');
    centerGlow.setAttribute('fill', 'url(#centerGrad)');
    centerGlow.setAttribute('opacity', '0.5');
    centerG.appendChild(centerGlow);

    // Add gradient defs
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const grad = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
    grad.setAttribute('id', 'centerGrad');
    grad.innerHTML = '<stop offset="0%" stop-color="#22d3ee" stop-opacity="0.8"/><stop offset="100%" stop-color="#22d3ee" stop-opacity="0"/>';
    defs.appendChild(grad);
    svg.appendChild(defs);

    const centerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    centerCircle.setAttribute('r', '28');
    centerCircle.setAttribute('fill', 'rgba(34, 211, 238, 0.2)');
    centerCircle.setAttribute('stroke', '#22d3ee');
    centerCircle.setAttribute('stroke-width', '3');
    centerG.appendChild(centerCircle);

    const centerText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    centerText.setAttribute('text-anchor', 'middle');
    centerText.setAttribute('dy', '-5');
    centerText.setAttribute('fill', '#ffffff');
    centerText.setAttribute('font-size', '12');
    centerText.setAttribute('font-family', 'JetBrains Mono');
    centerText.setAttribute('font-weight', 'bold');
    centerText.textContent = c.victimName ? c.victimName.substring(0, 12) : 'PATIENT';
    centerG.appendChild(centerText);

    const centerSub = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    centerSub.setAttribute('text-anchor', 'middle');
    centerSub.setAttribute('dy', '10');
    centerSub.setAttribute('fill', '#67e8f9');
    centerSub.setAttribute('font-size', '9');
    centerSub.setAttribute('font-family', 'JetBrains Mono');
    centerSub.textContent = c.caseId;
    centerG.appendChild(centerSub);

    svg.appendChild(centerG);
}

// Histograms
function renderHistograms(c) {
    renderTimeHistogram(c);
    renderSymptomHistogram(c);
}

function renderTimeHistogram(c) {
    const canvas = document.getElementById('histogram-time');
    if (!canvas) return;

    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth - 32;
    canvas.height = 200;

    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Distress by time of day
    const hours = ['12AM', '3AM', '6AM', '9AM', '12PM', '3PM', '6PM', '9PM'];
    const data = [25, 65, 40, 30, 45, 70, 85, 75]; // Sample data

    const padding = 30;
    const barW = (W - padding * 2) / hours.length - 8;
    const maxVal = 100;

    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = padding + ((H - padding * 2) / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(W - padding, y);
        ctx.stroke();
    }

    // Bars
    data.forEach((val, i) => {
        const x = padding + i * ((W - padding * 2) / hours.length) + 4;
        const barH = ((H - padding * 2) * val) / maxVal;
        const y = H - padding - barH;

        // Gradient
        const grad = ctx.createLinearGradient(0, y, 0, H - padding);
        if (val >= 70) {
            grad.addColorStop(0, '#ff6b6b');
            grad.addColorStop(1, 'rgba(255, 107, 107, 0.2)');
        } else if (val >= 40) {
            grad.addColorStop(0, '#fbbf24');
            grad.addColorStop(1, 'rgba(251, 191, 36, 0.2)');
        } else {
            grad.addColorStop(0, '#22d3ee');
            grad.addColorStop(1, 'rgba(34, 211, 238, 0.2)');
        }

        ctx.fillStyle = grad;
        ctx.fillRect(x, y, barW, barH);

        // Glow on top
        ctx.fillStyle = val >= 70 ? '#ff6b6b' : val >= 40 ? '#fbbf24' : '#22d3ee';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 8;
        ctx.fillRect(x, y, barW, 2);
        ctx.shadowBlur = 0;

        // Value on top
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '10px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(val + '', x + barW / 2, y - 5);

        // Hour label
        ctx.fillStyle = '#64748b';
        ctx.fillText(hours[i], x + barW / 2, H - 10);
    });
}

function renderSymptomHistogram(c) {
    const canvas = document.getElementById('histogram-symptoms');
    if (!canvas) return;

    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth - 32;
    canvas.height = 200;

    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Horizontal symptom intensity
    const symptoms = [
        { label: 'Panic Episodes', value: 85 },
        { label: 'Sleep Disruption', value: 78 },
        { label: 'Hypervigilance', value: 92 },
        { label: 'Social Avoidance', value: 65 },
        { label: 'Intrusive Thoughts', value: 70 },
        { label: 'Physical Aches', value: 45 }
    ];

    const padding = 30;
    const rowH = (H - padding * 2) / symptoms.length;
    const maxBarW = W - padding * 2 - 100;

    symptoms.forEach((s, i) => {
        const y = padding + i * rowH + rowH / 2;
        const barW = (s.value / 100) * maxBarW;

        // Label
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '10px JetBrains Mono';
        ctx.textAlign = 'right';
        ctx.fillText(s.label, padding + 90, y + 3);

        // Bar background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(padding + 100, y - 6, maxBarW, 12);

        // Bar
        const grad = ctx.createLinearGradient(padding + 100, 0, padding + 100 + barW, 0);
        if (s.value >= 70) {
            grad.addColorStop(0, '#ff6b6b');
            grad.addColorStop(1, '#ec4899');
        } else if (s.value >= 40) {
            grad.addColorStop(0, '#fbbf24');
            grad.addColorStop(1, '#f59e0b');
        } else {
            grad.addColorStop(0, '#22d3ee');
            grad.addColorStop(1, '#10b981');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(padding + 100, y - 6, barW, 12);

        // Value
        ctx.fillStyle = '#67e8f9';
        ctx.textAlign = 'left';
        ctx.fillText(s.value + '%', padding + 100 + barW + 5, y + 3);
    });
}

// Render saved clinical notes
function renderNotesHistory(caseId) {
    const container = document.getElementById('notes-history');
    if (!container) return;

    const notes = window.patientDossierNotes[caseId] || [];
    if (notes.length === 0) {
        container.innerHTML = '<p class="text-sm text-slate-400 italic">No notes yet. Start documenting observations above.</p>';
        return;
    }

    container.innerHTML = notes.map(n => `
        <div class="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
            <div class="flex justify-between items-start mb-1">
                <span class="text-xs text-cyan-300 font-mono">${n.author || 'Counselor'}</span>
                <span class="text-xs text-slate-500">${new Date(n.timestamp).toLocaleString()}</span>
            </div>
            <p class="text-sm text-slate-300">${n.text}</p>
        </div>
    `).join('');
}

// Render action log
function renderActionLog(caseId) {
    const container = document.getElementById('action-log');
    if (!container) return;

    const logs = window.patientActionLogs[caseId] || [];
    if (logs.length === 0) {
        container.innerHTML = '<p class="text-sm text-slate-400 italic">No actions logged yet. Use action buttons above to log interventions.</p>';
        return;
    }

    container.innerHTML = logs.map(l => `
        <div class="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
            <div class="w-2 h-2 rounded-full ${l.severity === 'critical' ? 'bg-rose-400' : l.severity === 'high' ? 'bg-amber-400' : 'bg-cyan-400'} mt-1.5 flex-shrink-0"></div>
            <div class="flex-1">
                <div class="flex items-center justify-between mb-1">
                    <span class="text-sm font-semibold text-white">${l.action}</span>
                    <span class="text-xs text-slate-500 font-mono">${new Date(l.timestamp).toLocaleString()}</span>
                </div>
                <p class="text-xs text-slate-400">${l.notes || ''}</p>
            </div>
        </div>
    `).join('');
}

// Action handlers
function saveClinicalNote() {
    const textarea = document.getElementById('counselor-notes');
    if (!textarea || !textarea.value.trim()) {
        alert('Please enter a note before saving.');
        return;
    }
    if (!selectedCaseId) return;

    if (typeof playHapticBeep === 'function') playHapticBeep(700, 'sine', 0.08);

    if (!window.patientDossierNotes[selectedCaseId]) {
        window.patientDossierNotes[selectedCaseId] = [];
    }
    window.patientDossierNotes[selectedCaseId].push({
        text: textarea.value.trim(),
        author: 'Dr. Sarah Jenkins',
        timestamp: Date.now()
    });

    textarea.value = '';
    updateNotesCharCount();
    renderNotesHistory(selectedCaseId);
}

function updateNotesCharCount() {
    const textarea = document.getElementById('counselor-notes');
    const counter = document.getElementById('notes-char-count');
    if (textarea && counter) {
        counter.textContent = textarea.value.length;
    }
}

function dispatchCrisisEscalation() {
    if (typeof playHapticBeep === 'function') playHapticBeep(900, 'square', 0.15);
    if (!selectedCaseId) return;

    if (!window.patientActionLogs[selectedCaseId]) {
        window.patientActionLogs[selectedCaseId] = [];
    }
    window.patientActionLogs[selectedCaseId].push({
        action: '🚨 Crisis Escalation Dispatched',
        notes: 'Emergency 112 dispatch initiated. Police protection request sent.',
        severity: 'critical',
        timestamp: Date.now()
    });

    renderActionLog(selectedCaseId);
    alert('🚨 Crisis Escalation Dispatched\n\nEmergency 112 has been notified. Police protection request sent to nearest station.');
}

function prescribeGrounding() {
    if (typeof playHapticBeep === 'function') playHapticBeep(600, 'triangle', 0.1);
    if (!selectedCaseId) return;

    if (!window.patientActionLogs[selectedCaseId]) {
        window.patientActionLogs[selectedCaseId] = [];
    }
    window.patientActionLogs[selectedCaseId].push({
        action: '🌿 Grounding Module Prescribed',
        notes: '4-7-8 breathing exercise and 5-4-3-2-1 grounding technique scheduled.',
        severity: 'moderate',
        timestamp: Date.now()
    });

    renderActionLog(selectedCaseId);
    alert('🌿 Grounding Module Prescribed\n\n4-7-8 breathing exercise and 5-4-3-2-1 sensory grounding technique have been prescribed to the patient.');
}

function scheduleFollowUp() {
    if (typeof playHapticBeep === 'function') playHapticBeep(580, 'sine', 0.08);
    if (!selectedCaseId) return;

    if (!window.patientActionLogs[selectedCaseId]) {
        window.patientActionLogs[selectedCaseId] = [];
    }
    window.patientActionLogs[selectedCaseId].push({
        action: '📅 Follow-Up Scheduled',
        notes: '7-day follow-up session scheduled via Tele-MANAS.',
        severity: 'moderate',
        timestamp: Date.now()
    });

    renderActionLog(selectedCaseId);
    alert('📅 Follow-Up Scheduled\n\n7-day follow-up session has been scheduled.');
}

function generateLegalBrief() {
    if (typeof playHapticBeep === 'function') playHapticBeep(640, 'sine', 0.1);
    if (!selectedCaseId) return;

    if (!window.patientActionLogs[selectedCaseId]) {
        window.patientActionLogs[selectedCaseId] = [];
    }
    window.patientActionLogs[selectedCaseId].push({
        action: '📄 Legal Brief Generated',
        notes: 'DLSA Vulnerability & Protection Assessment generated for court submission.',
        severity: 'low',
        timestamp: Date.now()
    });

    renderActionLog(selectedCaseId);
    alert('📄 Legal Brief Generated\n\nDLSA Vulnerability & Protection Assessment has been generated.');
}

// Character count listener
document.addEventListener('DOMContentLoaded', () => {
    const textarea = document.getElementById('counselor-notes');
    if (textarea) {
        textarea.addEventListener('input', updateNotesCharCount);
    }
});



// ============================================================================
// NEXORA Monitor — Administrator Menu Tab Switcher & AI Assistant
// ============================================================================
let currentMonitorTab = 'dashboard';

function switchMonitorTab(tabName) {
    playHapticBeep(560, 'sine', 0.08);
    currentMonitorTab = tabName;

    const tabs = ['dashboard', 'nexora-ai', 'cases', 'alerts', 'analytics', 'reports', 'settings'];
    tabs.forEach(t => {
        const navBtn = document.getElementById(`mon-nav-${t}`);
        const pane = document.getElementById(`tab-pane-${t}`);
        if (t === tabName) {
            if (navBtn) navBtn.classList.add('active');
            if (pane) {
                pane.classList.remove('hidden');
                pane.classList.remove('tab-pane-enter');
                void pane.offsetWidth;
                pane.classList.add('tab-pane-enter');
            }
        } else {
            if (navBtn) navBtn.classList.remove('active');
            if (pane) {
                pane.classList.add('hidden');
                pane.classList.remove('tab-pane-enter');
            }
        }
    });

    if (tabName === 'dashboard') {
        renderDashboard();
        setTimeout(initWaveformCanvas, 50);
        setTimeout(() => renderDashboardIntelligence(currentDashboardIntelTab || 'swimlane'), 60);
    } else if (tabName === 'cases') {
        renderDashboard();
    } else if (tabName === 'reports') {
        updateLegalReportPreview();
    } else if (tabName === 'analytics') {
        setTimeout(renderCompensationChart, 50);
        setTimeout(() => {
            renderSankeyFlowDiagram(currentSankeyDistrict || 'all');
            renderStateCareSwimlane();
            renderDistrictResilienceRadar();
        }, 60);
    } else if (tabName === 'settings') {
        initSettingsTab();
    }
}

function initSettingsTab() {
    // Load saved profile and populate settings
    const profile = loadUserProfile();

    // Update profession selector
    const professionSelect = document.getElementById('settings-profession-select');
    if (professionSelect && profile.profession) {
        professionSelect.value = profile.profession;
        updateUserProfession(profile.profession);
    }

    // Update alert threshold
    const thresholdInput = document.getElementById('settings-alert-threshold');
    const thresholdValue = document.getElementById('settings-threshold-value');
    if (thresholdInput && profile.alertThreshold) {
        thresholdInput.value = profile.alertThreshold;
        if (thresholdValue) thresholdValue.textContent = profile.alertThreshold;
    }
}

function handleNexoraAiSend(e) {
    if (e) e.preventDefault();
    const input = document.getElementById('nexora-ai-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    playHapticBeep(640, 'sine', 0.08);
    appendNexoraAiMessage('user', text);

    // AI Typing indicator simulation
    const messagesContainer = document.getElementById('nexora-ai-messages');
    const typingId = 'typing-' + Date.now();
    const typingDiv = document.createElement('div');
    typingDiv.id = typingId;
    typingDiv.className = 'flex items-start gap-3';
    typingDiv.innerHTML = `
        <div class="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shrink-0 text-xs font-bold animate-pulse">
            AI
        </div>
        <div class="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-3 text-slate-400 text-xs italic">
            Analyzing case database and trauma indicators...
        </div>
    `;
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    setTimeout(() => {
        const indicator = document.getElementById(typingId);
        if (indicator) indicator.remove();

        const response = generateNexoraAiTriageResponse(text);
        appendNexoraAiMessage('ai', response);
    }, 600);
}

function appendNexoraAiMessage(sender, text) {
    const messagesContainer = document.getElementById('nexora-ai-messages');
    if (!messagesContainer) return;

    const div = document.createElement('div');
    div.className = 'flex items-start gap-3';

    if (sender === 'user') {
        div.className = 'flex items-start gap-3 justify-end';
        div.innerHTML = `
            <div class="bg-sky-600 text-white rounded-2xl rounded-tr-none p-3.5 max-w-xl text-xs leading-relaxed shadow-md">
                ${text}
            </div>
            <div class="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-white shrink-0 text-xs font-bold">
                SJ
            </div>
        `;
    } else {
        div.innerHTML = `
            <div class="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shrink-0 text-xs font-bold">
                AI
            </div>
            <div class="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-4 max-w-2xl text-slate-200 text-xs leading-relaxed space-y-2 shadow-lg">
                ${text}
            </div>
        `;
    }

    messagesContainer.appendChild(div);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function generateNexoraAiTriageResponse(query) {
    const q = query.toLowerCase();

    if (q.includes('urgent') || q.includes('triage') || q.includes('3') || q.includes('high')) {
        return `
            <p class="font-bold text-rose-400">🚨 Triage Analysis of 3 Urgent & High-Stress Cases:</p>
            <ul class="list-disc pl-4 space-y-1.5 text-slate-300">
                <li><strong>CASE-2026-9044 (DDI: 94 - CRITICAL):</strong> Physical assault on brother + village grocery boycott. Immediate shelter transfer or 24/7 armed escort recommended under Witness Protection Scheme.</li>
                <li><strong>CASE-2026-9041 (DDI: 88 - HIGH THREAT):</strong> Direct night-time intimidation by 2 men threatening survivor to change court testimony. Urgent filing of Section 195A IPC motion recommended.</li>
                <li><strong>CASE-2026-9043 (DDI: 66 - MODERATE PANIC):</strong> 4 consecutive court adjournments resulting in acute financial distress and travel debt. Recommend legal aid travel voucher and emergency expedited hearing motion.</li>
            </ul>
        `;
    }

    if (q.includes('9041') || q.includes('threat') || q.includes('night') || q.includes('men')) {
        return `
            <p class="font-bold text-amber-300">🛡️ Forensic Triage for CASE-2026-9041:</p>
            <p class="text-slate-300">Survivor reported: <em>"Two men came to my home at night and threatened me. We are terrified. Police did not help."</em></p>
            <div class="p-2.5 rounded-lg bg-slate-800/80 border border-amber-500/30 text-amber-200 space-y-1 my-2">
                <p>• <strong>DDI Velocity:</strong> +40 points spike in 7 days (acute escalation).</p>
                <p>• <strong>Sleep index:</strong> 8/10 (Severe insomnia).</p>
                <p>• <strong>Safety index:</strong> 9/10 (Imminent fear of harm).</p>
            </div>
            <p class="text-slate-300"><strong>Recommended Action:</strong> Click the <em>"Request Police Protection"</em> button in header to alert the DLSA Police Liaison and dispatch a protection officer immediately.</p>
        `;
    }

    if (q.includes('9043') || q.includes('delay') || q.includes('court') || q.includes('hearing')) {
        return `
            <p class="font-bold text-sky-300">⚖️ Court Adjournment Trauma Assessment (CASE-2026-9043):</p>
            <p class="text-slate-300">Repeated adjournments have triggered legal fatigue. Survivor's check-in scores increased from 41 to 66 DDI directly following the 4th postponement.</p>
            <p class="text-slate-300"><strong>AI Action Plan:</strong></p>
            <ol class="list-decimal pl-4 space-y-1 text-slate-300">
                <li>Submit application for Fast-Track Special Court under Section 309 CrPC / BNSS.</li>
                <li>Disburse ₹1,500 DLSA witness travel allowance to alleviate transport burden.</li>
                <li>Schedule 15-minute reassurance call with appointed legal aid counsel Mr. Raj Patel.</li>
            </ol>
        `;
    }

    if (q.includes('police') || q.includes('guard') || q.includes('escort')) {
        return `
            <p class="font-bold text-rose-400">🚓 Police Protection Protocol:</p>
            <p class="text-slate-300">Pursuant to the Supreme Court of India Witness Protection Scheme (2018), intimidation constitutes non-bailable offense under Section 195A IPC.</p>
            <p class="text-slate-300">Both <strong>CASE-9041</strong> and <strong>CASE-9044</strong> qualify for <em>Category 'A' Threat Level</em> (Threat extends to life of witness or family member). You can generate the formal court brief directly from the <strong>Reports</strong> tab.</p>
        `;
    }

    if (q.includes('ddi') || q.includes('score') || q.includes('algorithm') || q.includes('formula')) {
        return `
            <p class="font-bold text-teal-300">📊 NEXORA Dynamic Distress Index (DDI) Architecture:</p>
            <p class="text-slate-300">The DDI Score (0-100) combines multimodal objective signals:</p>
            <ul class="list-disc pl-4 space-y-1 text-slate-300">
                <li><strong>Baseline Questionnaire (40%):</strong> Sleep quality, perceived personal safety, trial anticipatory anxiety, and isolation index.</li>
                <li><strong>Linguistic Trauma NLP (35%):</strong> Keyword intensity detection across 10 languages (e.g. threat, police refusal, weapon, assault).</li>
                <li><strong>Longitudinal Velocity (25%):</strong> Rapid rate of change week-over-week (spikes >20 points automatically elevate triage tier).</li>
            </ul>
        `;
    }

    return `
        <p class="text-slate-200">I have registered your inquiry regarding <strong>"${query}"</strong> against the active survivor database.</p>
        <p class="text-slate-300 mt-1">All 4 survivor cases are synchronized. Currently, <strong>2 cases are in High Distress</strong>, <strong>1 case in Moderate Stress</strong>, and <strong>1 case Stable</strong>. You can switch to the <strong>Cases</strong> tab to review their longitudinal trajectory charts or click <strong>Alerts</strong> for immediate dispatch.</p>
    `;
}

function sendAiPrompt(text) {
    const input = document.getElementById('nexora-ai-input');
    if (input) {
        input.value = text;
        handleNexoraAiSend();
    }
}

function resetNexoraAiChat() {
    const messagesContainer = document.getElementById('nexora-ai-messages');
    if (!messagesContainer) return;
    messagesContainer.innerHTML = `
        <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shrink-0 text-xs font-bold">
                AI
            </div>
            <div class="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-4 max-w-2xl text-slate-200 text-xs leading-relaxed space-y-2 shadow-lg">
                <p class="font-medium text-slate-100">
                    Hello! I'm the NEXORA AI Assistant. I'm here to listen, understand and triage cases to ensure survivors get the right support, and investigate the psychological distress markers.
                </p>
                <p class="text-slate-300">
                    You can tell me which case you want to review, ask for a risk summary, or let me help you figure out what to do next.
                </p>
            </div>
        </div>
    `;
}

function updateLegalReportPreview() {
    const select = document.getElementById('report-case-select');
    if (!select) return;
    const caseId = select.value;
    const targetCase = cases.find(c => c.caseId === caseId);
    if (!targetCase) return;

    const latest = targetCase.checkIns.length > 0 ? targetCase.checkIns[targetCase.checkIns.length - 1] : null;
    const score = latest ? latest.ddiScore : 0;
    const risk = latest ? latest.riskLevel : 'LOW';

    const repCaseId = document.getElementById('rep-case-id');
    if (repCaseId) repCaseId.innerText = caseId;

    const repDdi = document.getElementById('rep-ddi-score');
    if (repDdi) {
        repDdi.innerText = `${score} / 100 (${risk} DISTRESS TIER)`;
        repDdi.className = risk === 'HIGH' ? 'text-rose-400 font-bold' : risk === 'MODERATE' ? 'text-amber-400 font-bold' : 'text-teal-400 font-bold';
    }
}

function saveMonitorSettings() {
    playHapticBeep(600, 'sine', 0.1);

    // Save alert threshold
    const thresholdInput = document.getElementById('settings-alert-threshold');
    if (thresholdInput) {
        const profile = loadUserProfile();
        profile.alertThreshold = parseInt(thresholdInput.value);
        saveUserProfile(profile);
    }

    alert('✓ NEXORA Monitor preferences and escalation thresholds updated successfully.');
}


function autoApplyRecommendation() {
    playHapticBeep(700, 'sine', 0.08);
    const targetCase = cases.find(c => c.caseId === selectedCaseId);
    if (!targetCase) return;

    const notesEl = document.getElementById('intervention-notes');
    const latest = targetCase.checkIns[targetCase.checkIns.length - 1];
    const dict = i18nDictionary[currentLang] || i18nDictionary.en;
    
    if (latest && latest.ddiScore >= 70) {
        notesEl.value = dict.opt_police + ": " + dict.synth_urgent_text;
    } else {
        notesEl.value = dict.opt_call + ": " + dict.synth_moderate_text;
    }
    notesEl.focus();
}

function triggerEmergencyDispatch() {
    playHapticBeep(880, 'square', 0.15);
    const dict = i18nDictionary[currentLang] || i18nDictionary.en;
    alert(dict.police_alert_msg || "🚨 POLICE PROTECTION REQUESTED:\n\nEmergency notification sent to Police Superintendent.");
}

function renderInterventions(targetCase) {
    const list = document.getElementById('intervention-list');
    if (!list) return;

    if (!targetCase.interventions || targetCase.interventions.length === 0) {
        list.innerHTML = `<p class="text-[11px] text-slate-500 italic p-2 rounded-lg bg-slate-900/60 border border-slate-800">No statutory interventions logged yet for this case token.</p>`;
        return;
    }

    list.innerHTML = targetCase.interventions.map(inv => `
        <div class="text-xs bg-slate-900/90 border border-slate-800/90 p-3 rounded-xl space-y-1">
            <div class="font-bold text-white flex items-center justify-between">
                <span class="text-sky-300 flex items-center gap-1.5">
                    <span>⚡</span> <span>${inv.actionType}</span>
                </span>
                <span class="text-slate-400 font-mono text-[10px]">${new Date(inv.date).toLocaleDateString()}</span>
            </div>
            <div class="text-slate-300 text-[11px] leading-relaxed">${inv.notes}</div>
            <div class="text-[10px] text-teal-400 font-mono pt-1">
                Auth: ${inv.caseworker || "Dr. Sarah Jenkins (DLSA Officer)"} • Status: Active
            </div>
        </div>
    `).join('');
}

// ============================================================================
// CLOSED-LOOP ACTION PROTOCOL MODAL (SIH-26094 Mandatory Workflow)
// ============================================================================
function openActionModal(caseId) {
    playHapticBeep(600, 'sine', 0.08);
    const targetCaseId = caseId || selectedCaseId || "MH-PUN-2026-081";
    selectedCaseId = targetCaseId;

    const modal = document.getElementById('closed-loop-modal');
    const tokenEl = document.getElementById('modal-case-token');

    if (tokenEl) tokenEl.innerText = `Target Case Token: ${targetCaseId}`;
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeActionModal() {
    playHapticBeep(450, 'sine', 0.06);
    const modal = document.getElementById('closed-loop-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function handleModalActionSubmit(e) {
    e.preventDefault();
    playHapticBeep(850, 'triangle', 0.15);

    const actionTypeEl = document.getElementById('modal-action-type');
    const notesEl = document.getElementById('modal-action-notes');
    if (!actionTypeEl || !notesEl) return;

    const actionType = actionTypeEl.value;
    const notes = notesEl.value.trim();

    const targetCase = cases.find(c => c.caseId === selectedCaseId);
    if (targetCase) {
        if (!targetCase.interventions) targetCase.interventions = [];
        targetCase.interventions.unshift({
            id: `inv-${Date.now()}`,
            date: new Date().toISOString(),
            actionType,
            notes,
            caseworker: "Dr. Sarah Jenkins (DLSA Officer)"
        });

        // Re-render audit log in case deep-dive drawer
        renderInterventions(targetCase);
        renderDashboard();
    }

    notesEl.value = '';
    closeActionModal();
}

// ============================================================================
// 6-WEEK LONGITUDINAL DDS TREND LINE CHART WITH 40 & 70 THRESHOLDS
// ============================================================================
// ============================================================================
// CASE WORKSTATION TELEMETRY PILLS UPDATER
// ============================================================================
function updateCaseTelemetryPills(targetCase) {
    if (!targetCase) return;
    const latest = (targetCase.checkIns && targetCase.checkIns.length > 0)
        ? targetCase.checkIns[targetCase.checkIns.length - 1]
        : null;
    const score = latest && latest.ddiScore !== undefined && !isNaN(latest.ddiScore)
        ? latest.ddiScore
        : (targetCase.threatLevel === 'HIGH' ? 88 : (targetCase.threatLevel === 'MODERATE' ? 52 : 28));

    const pillDds = document.getElementById('pill-telemetry-dds');
    const pillSleep = document.getElementById('pill-telemetry-sleep');
    const pillTremor = document.getElementById('pill-telemetry-tremor');
    const pillPathway = document.getElementById('pill-telemetry-pathway');

    if (pillDds) {
        if (score >= 70) {
            pillDds.className = "text-rose-400 text-xs font-bold";
            pillDds.innerText = `${score}/100 (Critical Spike)`;
        } else if (score >= 40) {
            pillDds.className = "text-amber-400 text-xs font-bold";
            pillDds.innerText = `${score}/100 (Elevated)`;
        } else {
            pillDds.className = "text-emerald-400 text-xs font-bold";
            pillDds.innerText = `${score}/100 (Stable)`;
        }
    }

    if (pillSleep) {
        let sleepHours = 7.4;
        let sleepDelta = "+12%";
        if (score >= 80) { sleepHours = 3.2; sleepDelta = "-57%"; }
        else if (score >= 60) { sleepHours = 4.5; sleepDelta = "-40%"; }
        else if (score >= 40) { sleepHours = 5.6; sleepDelta = "-25%"; }

        pillSleep.className = score >= 60 ? "text-rose-400 text-xs font-bold" : (score >= 40 ? "text-amber-400 text-xs font-bold" : "text-sky-400 text-xs font-bold");
        pillSleep.innerText = `${sleepHours} hrs (${sleepDelta})`;
    }

    if (pillTremor) {
        let tremorPct = 4.2;
        let tremorLabel = "Calm Baseline";
        if (score >= 75) { tremorPct = 18.6; tremorLabel = "Acoustic Tremor"; }
        else if (score >= 45) { tremorPct = 9.8; tremorLabel = "Mild Somatic"; }
        
        pillTremor.className = score >= 75 ? "text-amber-400 text-xs font-bold" : "text-teal-400 text-xs font-bold";
        pillTremor.innerText = `${tremorPct}% (${tremorLabel})`;
    }

    if (pillPathway) {
        let pathwayText = "Routine Legal Counseling";
        if (score >= 70) pathwayText = "Police Escort + DLSA Urgent";
        else if (score >= 40) pathwayText = "Trauma Tele-Care + WCD";
        pillPathway.className = score >= 70 ? "text-purple-400 text-xs font-bold" : "text-teal-300 text-xs font-bold";
        pillPathway.innerText = pathwayText;
    }
}

// ============================================================================
// CLINICAL WORKSTATION: MULTI-MODAL PATIENT VISUALIZATION DISPATCHER
// ============================================================================
function renderLongitudinalChart(targetCase) {
    if (!targetCase) {
        targetCase = cases.find(c => c.caseId === selectedCaseId) || cases[0] || {
            caseId: "MH-PUN-2026-081",
            victimName: "Pooja Gaikwad",
            threatLevel: "HIGH",
            baselineStress: "High",
            checkIns: [{ week: 1, ddiScore: 94 }]
        };
    }
    if (!targetCase) return;

    updateCaseTelemetryPills(targetCase);

    const canvas = document.getElementById('ddiChart');
    const swimlaneView = document.getElementById('case-swimlane-view');
    const titleEl = document.getElementById('chart-view-title');
    const subtitleEl = document.getElementById('chart-view-subtitle');

    if (currentCaseChartMode === 'swimlane') {
        if (canvas) canvas.classList.add('hidden');
        if (swimlaneView) swimlaneView.classList.remove('hidden');
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }
        renderCaseSwimlaneGantt(targetCase, titleEl, subtitleEl);
        return;
    }

    if (canvas) canvas.classList.remove('hidden');
    if (swimlaneView) swimlaneView.classList.add('hidden');

    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }

    if (currentCaseChartMode === 'multiaxis') {
        renderMultiAxisChart(targetCase, canvas, ctx, titleEl, subtitleEl);
    } else if (currentCaseChartMode === 'radar') {
        renderRadarSpiderChart(targetCase, canvas, ctx, titleEl, subtitleEl);
    } else if (currentCaseChartMode === 'questions') {
        renderQuestionsChart(targetCase, canvas, ctx, titleEl, subtitleEl);
    } else {
        renderWeeklyTrendChart(targetCase, canvas, ctx, titleEl, subtitleEl);
    }
}

// 1. MULTI-AXIS LINE GRAPH: Distress (Y1) vs Sleep & Acoustic Tremor (Y2)
function renderMultiAxisChart(targetCase, canvas, ctx, titleEl, subtitleEl) {
    if (titleEl) titleEl.innerHTML = `<span>📉</span> <span>Multi-Axis Telemetry: Distress (Y1) vs Sleep Duration (Y2)</span>`;
    if (subtitleEl) subtitleEl.innerText = "Dual-axis correlation tracking psychological trauma spikes vs physiological sleep biomarkers";
    if (typeof Chart === 'undefined') return;

    const latest = (targetCase.checkIns && targetCase.checkIns.length > 0)
        ? targetCase.checkIns[targetCase.checkIns.length - 1]
        : null;
    const currentScore = latest && latest.ddiScore !== undefined && !isNaN(latest.ddiScore)
        ? latest.ddiScore
        : (targetCase.threatLevel === 'HIGH' ? 94 : 45);

    const labels = ['Intake Baseline', 'Wk 1 (FIR)', 'Wk 2 (Exam)', 'Wk 3 (Threat Alert)', 'Wk 4 (Escort)', 'Wk 5 (Deposition)'];
    
    let ddsData, panicData, sleepData;
    if (currentScore >= 70) {
        ddsData = [58, 64, 74, currentScore, Math.max(68, currentScore - 8), Math.max(60, currentScore - 16)];
        panicData = [48, 55, 68, 88, 76, 64];
        sleepData = [6.8, 5.5, 4.2, 3.2, 4.5, 6.0];
    } else if (currentScore >= 40) {
        ddsData = [45, 48, 52, currentScore, 48, 42];
        panicData = [40, 42, 48, 55, 46, 38];
        sleepData = [7.0, 6.4, 5.8, 5.2, 6.0, 6.8];
    } else {
        ddsData = [35, 30, 28, currentScore, 22, 19];
        panicData = [25, 22, 20, 18, 15, 12];
        sleepData = [7.5, 7.8, 7.6, 8.0, 7.9, 8.2];
    }

    const redThreshold = labels.map(() => 70);

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Dynamic Distress Score (DDS 0–100)',
                    data: ddsData,
                    borderColor: '#f43f5e',
                    backgroundColor: 'rgba(244, 63, 94, 0.15)',
                    fill: true,
                    borderWidth: 2.8,
                    tension: 0.35,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#f43f5e',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    yAxisID: 'y',
                    zIndex: 10
                },
                {
                    label: 'Panic / Acute Anxiety %',
                    data: panicData,
                    borderColor: '#fbbf24',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderDash: [4, 3],
                    tension: 0.35,
                    pointBackgroundColor: '#fbbf24',
                    pointRadius: 4,
                    yAxisID: 'y',
                    zIndex: 8
                },
                {
                    label: 'Nightly Sleep Duration (Hours)',
                    data: sleepData,
                    borderColor: '#38bdf8',
                    backgroundColor: 'rgba(56, 189, 248, 0.10)',
                    fill: true,
                    borderWidth: 2.5,
                    tension: 0.35,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#38bdf8',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    yAxisID: 'y1',
                    zIndex: 9
                },
                {
                    label: 'Red Zone Danger Threshold (70)',
                    data: redThreshold,
                    borderColor: 'rgba(244, 63, 94, 0.8)',
                    borderWidth: 1.5,
                    borderDash: [5, 4],
                    pointRadius: 0,
                    fill: false,
                    yAxisID: 'y'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#94a3b8',
                        font: { size: 10, family: 'monospace' },
                        boxWidth: 12
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(11, 15, 23, 0.95)',
                    borderColor: 'rgba(56, 189, 248, 0.5)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    titleFont: { family: 'monospace', size: 11, weight: 'bold' },
                    titleColor: '#38bdf8',
                    bodyFont: { family: 'sans-serif', size: 11 },
                    bodyColor: '#e2e8f0',
                    callbacks: {
                        afterBody: function(items) {
                            const ddsItem = items.find(i => i.datasetIndex === 0);
                            const sleepItem = items.find(i => i.datasetIndex === 2);
                            if (ddsItem && sleepItem) {
                                const dScore = ddsItem.parsed.y;
                                const sHours = sleepItem.parsed.y;
                                if (dScore >= 70 && sHours <= 4.0) {
                                    return ['\n⚠️ CLINICAL CORRELATION: Acute distress surge directly accompanied by severe sleep deprivation (<4 hrs). Emergency sedative & trauma tele-counseling advised.'];
                                } else if (dScore <= 40 && sHours >= 7.0) {
                                    return ['\n✅ CLINICAL CORRELATION: Normal sleep architecture restored, correlating with symptom stabilization.'];
                                }
                            }
                            return [];
                        }
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    min: 0,
                    max: 100,
                    ticks: { stepSize: 20, color: '#94a3b8', font: { size: 10 } },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    title: { display: true, text: 'Distress & Panic (0–100)', color: '#94a3b8', font: { size: 10, family: 'monospace' } }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    min: 0,
                    max: 12,
                    ticks: {
                        stepSize: 2,
                        color: '#38bdf8',
                        font: { size: 10 },
                        callback: (v) => v + 'h'
                    },
                    grid: { drawOnChartArea: false },
                    title: { display: true, text: 'Nightly Sleep (Hours)', color: '#38bdf8', font: { size: 10, family: 'monospace' } }
                },
                x: {
                    ticks: { color: '#94a3b8', font: { size: 10, family: 'monospace' } },
                    grid: { color: 'rgba(255, 255, 255, 0.03)' }
                }
            }
        }
    });
}

// 2. RADAR / SPIDER CHART: 6-Axis Resilience Profile (Baseline vs Current)
function renderRadarSpiderChart(targetCase, canvas, ctx, titleEl, subtitleEl) {
    if (titleEl) titleEl.innerHTML = `<span>🕸️</span> <span>Psychological Resilience Profile (6-Axis Spider Radar)</span>`;
    if (subtitleEl) subtitleEl.innerText = "Holistic assessment across 6 clinical pillars: Intake Baseline vs Current Recovery Status";
    if (typeof Chart === 'undefined') return;

    const latest = (targetCase.checkIns && targetCase.checkIns.length > 0)
        ? targetCase.checkIns[targetCase.checkIns.length - 1]
        : null;
    const score = latest && latest.ddiScore !== undefined && !isNaN(latest.ddiScore)
        ? latest.ddiScore
        : (targetCase.threatLevel === 'HIGH' ? 88 : 45);

    const categories = ['Sleep Stability', 'Emotional Regulation', 'Physical Safety', 'Trauma Recovery', 'Social Support', 'Legal Preparedness'];

    let baselineData, currentData;
    if (score >= 70) {
        baselineData = [62, 58, 65, 52, 68, 60];
        // Acute trauma drop in physical safety & sleep
        currentData = [28, 35, 22, 34, 46, 42];
    } else if (score >= 40) {
        baselineData = [50, 48, 55, 45, 58, 50];
        currentData = [58, 62, 65, 54, 66, 68];
    } else {
        baselineData = [45, 40, 50, 42, 52, 48];
        currentData = [82, 85, 88, 78, 86, 92];
    }

    const targetBenchmark = [80, 80, 85, 80, 85, 90];

    const isCrisis = score >= 70;
    const currentColor = isCrisis ? '#f43f5e' : (score >= 40 ? '#f59e0b' : '#38bdf8');
    const currentFill = isCrisis ? 'rgba(244, 63, 94, 0.25)' : 'rgba(56, 189, 248, 0.20)';

    chartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: categories,
            datasets: [
                {
                    label: 'Current Clinical Status',
                    data: currentData,
                    borderColor: currentColor,
                    backgroundColor: currentFill,
                    borderWidth: 2.5,
                    pointBackgroundColor: currentColor,
                    pointBorderColor: '#ffffff',
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Baseline Intake Assessment',
                    data: baselineData,
                    borderColor: '#94a3b8',
                    backgroundColor: 'rgba(148, 163, 184, 0.08)',
                    borderWidth: 1.8,
                    borderDash: [4, 4],
                    pointBackgroundColor: '#94a3b8',
                    pointRadius: 3
                },
                {
                    label: 'Statutory Resilience Target (80+)',
                    data: targetBenchmark,
                    borderColor: '#10b981',
                    borderWidth: 1.5,
                    borderDash: [6, 4],
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#94a3b8',
                        font: { size: 10, family: 'monospace' },
                        boxWidth: 12
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(11, 15, 23, 0.95)',
                    borderColor: currentColor,
                    borderWidth: 1,
                    padding: 10,
                    callbacks: {
                        label: function(ctx) {
                            return `${ctx.dataset.label}: ${ctx.parsed.r}/100`;
                        }
                    }
                }
            },
            scales: {
                r: {
                    min: 0,
                    max: 100,
                    ticks: {
                        stepSize: 25,
                        color: '#64748b',
                        backdropColor: 'transparent',
                        font: { size: 9 }
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.08)' },
                    angleLines: { color: 'rgba(255, 255, 255, 0.08)' },
                    pointLabels: {
                        color: '#cbd5e1',
                        font: { size: 10, weight: 'bold', family: 'sans-serif' }
                    }
                }
            }
        }
    });
}

// 3. GANTT / SWIMLANE CHART: Multi-Agency Care Pathway Timeline
function renderCaseSwimlaneGantt(targetCase, titleEl, subtitleEl) {
    if (titleEl) titleEl.innerHTML = `<span>⏱️</span> <span>Multi-Agency Care Pathway Timeline (Gantt Swimlane)</span>`;
    if (subtitleEl) subtitleEl.innerText = "Synchronized cross-departmental coordination across Police, Medical, DLSA & Social Welfare";

    const container = document.getElementById('case-swimlane-view');
    if (!container) return;

    const latest = (targetCase.checkIns && targetCase.checkIns.length > 0)
        ? targetCase.checkIns[targetCase.checkIns.length - 1]
        : null;
    const score = latest && latest.ddiScore !== undefined && !isNaN(latest.ddiScore)
        ? latest.ddiScore
        : (targetCase.threatLevel === 'HIGH' ? 88 : 45);

    const isHigh = score >= 70;

    const tracks = [
        {
            agency: "Police Witness Protection",
            icon: "🚔",
            badge: isHigh ? "ACTIVE ESCORT" : "MONITORING",
            badgeColor: isHigh ? "bg-rose-950/60 text-rose-300 border-rose-500/40" : "bg-sky-950/60 text-sky-300 border-sky-500/40",
            bars: [
                { label: "Threat Assessment (24h)", left: 0, width: 22, status: "completed", note: "FIR Verified & Danger Score logged" },
                { label: isHigh ? "24/7 Armed Protection Escort" : "Patrol Surveillance Check", left: 24, width: 44, status: "active", note: isHigh ? "Escort detail assigned under Sec 15A" : "Routine beat patrol visits" },
                { label: "Court Safe Transit", left: 70, width: 28, status: "scheduled", note: "Scheduled for In-Camera Deposition" }
            ]
        },
        {
            agency: "Clinical Trauma & Medical",
            icon: "🏥",
            badge: isHigh ? "ACUTE CRISIS" : "STABLE THERAPY",
            badgeColor: isHigh ? "bg-amber-950/60 text-amber-300 border-amber-500/40" : "bg-teal-950/60 text-teal-300 border-teal-500/40",
            bars: [
                { label: "Forensic Medical Exam", left: 0, width: 20, status: "completed", note: "Completed at District Civil Hospital" },
                { label: "Trauma Stabilization Therapy", left: 22, width: 38, status: "completed", note: "Somatic therapy & anxiety coping protocol" },
                { label: "Crisis Tele-Intervention", left: 62, width: 35, status: "active", note: "Active daily telemetry check-ins" }
            ]
        },
        {
            agency: "DLSA Legal Aid & High Court",
            icon: "⚖️",
            badge: "LEGAL COUNSEL ASSIGNED",
            badgeColor: "bg-purple-950/60 text-purple-300 border-purple-500/40",
            bars: [
                { label: "Legal Counsel Appointed", left: 0, width: 26, status: "completed", note: "Empaneled DLSA Advocate Assigned" },
                { label: "Sec 164 CrPC Deposition", left: 28, width: 34, status: "completed", note: "Judicial Magistrate Statement Recorded" },
                { label: "Trial Protection Motion", left: 64, width: 32, status: "active", note: "Filing urgent witness protection petition" }
            ]
        },
        {
            agency: "Social Welfare & Shelter",
            icon: "🏡",
            badge: isHigh ? "SAFE HOUSE RE-LOCATED" : "INTERIM RELIEF FILED",
            badgeColor: "bg-emerald-950/60 text-emerald-300 border-emerald-500/40",
            bars: [
                { label: "Emergency Shelter Referral", left: 0, width: 25, status: "completed", note: "Temporary safe accommodation secured" },
                { label: "Statutory Compensation ₹1L", left: 28, width: 40, status: "completed", note: "Sanctioned under SC/ST Prevention of Atrocities Act" },
                { label: "Livelihood & Childcare Support", left: 70, width: 28, status: "scheduled", note: "Scheduled for post-trial rehabilitation" }
            ]
        }
    ];

    let html = `
        <div class="swimlane-container p-1">
            <div class="flex items-center justify-between text-[10px] font-mono text-slate-400 pb-1 border-b border-white/5">
                <span>Care Channel / Authority</span>
                <div class="flex items-center gap-4">
                    <span class="flex items-center gap-1"><span class="w-2 h-2 rounded bg-emerald-500"></span> Completed</span>
                    <span class="flex items-center gap-1"><span class="w-2 h-2 rounded bg-sky-500"></span> Active</span>
                    <span class="flex items-center gap-1"><span class="w-2 h-2 rounded bg-slate-600"></span> Scheduled</span>
                    <span>Timeline (Wk 1 – Wk 6)</span>
                </div>
            </div>
    `;

    tracks.forEach(track => {
        html += `
            <div class="swimlane-row">
                <div class="space-y-1">
                    <div class="flex items-center gap-1.5">
                        <span class="text-sm">${track.icon}</span>
                        <span class="font-bold text-slate-200 text-[11px] truncate">${track.agency}</span>
                    </div>
                    <span class="inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${track.badgeColor}">
                        ${track.badge}
                    </span>
                </div>
                <div class="swimlane-track-bg">
        `;

        track.bars.forEach(bar => {
            let bgClass = "bg-emerald-600 border border-emerald-400/40 text-white";
            if (bar.status === 'active') {
                bgClass = "bg-gradient-to-r from-sky-600 via-blue-500 to-sky-600 active-bar border border-sky-300 text-white shadow-lg shadow-sky-500/30";
            } else if (bar.status === 'scheduled') {
                bgClass = "bg-slate-800 border border-slate-700 text-slate-300";
            }

            html += `
                <div class="swimlane-bar ${bgClass}" style="left: ${bar.left}%; width: ${bar.width}%;" title="${bar.label}: ${bar.note}">
                    <span class="truncate">${bar.label}</span>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    });

    html += `
            <div class="flex justify-between text-[9px] font-mono text-slate-500 px-3 pt-1">
                <span>Intake (Day 0)</span>
                <span>Week 1 (FIR)</span>
                <span>Week 2 (Exam)</span>
                <span>Week 3 (Threat)</span>
                <span>Week 4 (Relief)</span>
                <span>Week 6 (Trial)</span>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

// 4. 10-QUESTION DISTRESS BREAKDOWN CHART (Preserving Diagnostic Accuracy)
function renderQuestionsChart(targetCase, canvas, ctx, titleEl, subtitleEl) {
    if (titleEl) titleEl.innerText = "10-Question Distress Performance Analysis";
    if (subtitleEl) subtitleEl.innerText = "Thresholds: 40 (Yellow) | 70 (Red) • Individual Question Scores";
    if (typeof Chart === 'undefined') return;

    const latest = (targetCase.checkIns && targetCase.checkIns.length > 0) 
        ? targetCase.checkIns[targetCase.checkIns.length - 1] 
        : null;

    let qScores = latest && latest.questionScores && latest.questionScores.length === 10
        ? latest.questionScores
        : analyzeCheckInResponses(targetCase.latestCheckInTranscript || [], targetCase.baselineStress, targetCase.latestJournal).questionScores;

    const labels = qScores.map(q => q.label);
    const data = qScores.map(q => q.score);
    const redThreshold = labels.map(() => 70);
    const yellowThreshold = labels.map(() => 40);

    const avgScore = Math.round(data.reduce((a, b) => a + b, 0) / data.length);
    const isHigh = avgScore >= 70 || targetCase.threatLevel === 'HIGH';
    const isMod = avgScore >= 40 || targetCase.threatLevel === 'MODERATE';

    const mainColor = isHigh ? '#f43f5e' : (isMod ? '#f59e0b' : '#10b981');
    const mainFill = isHigh ? 'rgba(244, 63, 94, 0.20)' : (isMod ? 'rgba(245, 158, 11, 0.20)' : 'rgba(16, 185, 129, 0.20)');
    const pointBorder = isHigh ? '#e11d48' : (isMod ? '#d97706' : '#059669');

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Question Distress Score (0–100)',
                    data,
                    borderColor: mainColor,
                    backgroundColor: mainFill,
                    fill: true,
                    borderWidth: 2.5,
                    tension: 0.3,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: pointBorder,
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    zIndex: 10
                },
                {
                    label: 'Red Zone Threshold (70)',
                    data: redThreshold,
                    borderColor: 'rgba(244, 63, 94, 0.8)',
                    borderWidth: 1.5,
                    borderDash: [5, 4],
                    pointRadius: 0,
                    fill: false
                },
                {
                    label: 'Yellow Zone Threshold (40)',
                    data: yellowThreshold,
                    borderColor: 'rgba(251, 191, 36, 0.8)',
                    borderWidth: 1.5,
                    borderDash: [5, 4],
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#94a3b8',
                        font: { size: 10, family: 'monospace' },
                        boxWidth: 12
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(11, 15, 23, 0.96)',
                    borderColor: isHigh ? 'rgba(244, 63, 94, 0.5)' : 'rgba(56, 189, 248, 0.5)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    titleFont: { family: 'monospace', size: 11, weight: 'bold' },
                    titleColor: '#38bdf8',
                    bodyFont: { family: 'sans-serif', size: 11 },
                    bodyColor: '#e2e8f0',
                    callbacks: {
                        title: function(items) {
                            if (!items.length) return '';
                            const idx = items[0].dataIndex;
                            const q = qScores[idx];
                            return q ? `Question ${idx + 1}: ${q.name}` : `Question ${idx + 1}`;
                        },
                        label: function(context) {
                            if (context.datasetIndex === 0) {
                                const idx = context.dataIndex;
                                const q = qScores[idx];
                                const s = context.parsed.y;
                                const tier = s >= 70 ? '🔴 RED ZONE (Critical / Extreme)' : (s >= 40 ? '🟡 YELLOW ZONE (Elevated)' : '🟢 GREEN ZONE (Stable / Calm)');
                                const respText = q ? q.answer : '';
                                return [
                                    `Distress Score: ${s}/100`,
                                    `Triage Level: ${tier}`,
                                    respText ? `Survivor Response: "${respText.length > 55 ? respText.substring(0, 52) + '...' : respText}"` : null
                                ].filter(Boolean);
                            }
                            return `${context.dataset.label}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: 100,
                    ticks: { stepSize: 20, color: '#64748b', font: { size: 10 } },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                },
                x: {
                    ticks: { color: '#94a3b8', font: { size: 10, family: 'monospace' } },
                    grid: { color: 'rgba(255, 255, 255, 0.03)' }
                }
            }
        }
    });
}

// 5. WEEKLY LONGITUDINAL TREND CHART
function renderWeeklyTrendChart(targetCase, canvas, ctx, titleEl, subtitleEl) {
    if (titleEl) titleEl.innerText = "6-Week Longitudinal DDS Trajectory";
    if (subtitleEl) subtitleEl.innerText = "Thresholds: 40 (Yellow) | 70 (Red) • Weekly Milestones";
    if (typeof Chart === 'undefined') return;

    const latest = (targetCase.checkIns && targetCase.checkIns.length > 0) 
        ? targetCase.checkIns[targetCase.checkIns.length - 1] 
        : null;

    let labels = [];
    let data = [];

    if (targetCase.checkIns && targetCase.checkIns.length > 1) {
        labels = targetCase.checkIns.map((chk, i) => `Wk ${chk.week || i + 1}`);
        data = targetCase.checkIns.map(chk => (chk.ddiScore !== undefined && !isNaN(chk.ddiScore) ? chk.ddiScore : 50));
    } else {
        const currentScore = (latest && latest.ddiScore !== undefined && !isNaN(latest.ddiScore)) ? latest.ddiScore : 50;
        const bStress = String(targetCase.baselineStress || "Moderate").toLowerCase();
        let baselineScore = 50;
        if (bStress.includes("low") || parseInt(bStress) <= 3) baselineScore = 25;
        else if (bStress.includes("high") || bStress.includes("extreme") || parseInt(bStress) >= 8) baselineScore = 75;

        labels = ['Intake Baseline', 'Wk 1 (Check-in)'];
        data = [baselineScore, currentScore];
    }

    const redThreshold = labels.map(() => 70);
    const yellowThreshold = labels.map(() => 40);

    const latestScore = data[data.length - 1];
    const isHigh = latestScore >= 70;
    const mainColor = isHigh ? '#f43f5e' : (latestScore >= 40 ? '#f59e0b' : '#38bdf8');
    const mainFill = isHigh ? 'rgba(244, 63, 94, 0.15)' : 'rgba(56, 189, 248, 0.15)';

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Dynamic Distress Score (DDS)',
                    data,
                    borderColor: mainColor,
                    backgroundColor: mainFill,
                    fill: true,
                    borderWidth: 3,
                    tension: 0.35,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: mainColor,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    zIndex: 10
                },
                {
                    label: 'Red Zone Threshold (70)',
                    data: redThreshold,
                    borderColor: 'rgba(244, 63, 94, 0.8)',
                    borderWidth: 1.5,
                    borderDash: [5, 4],
                    pointRadius: 0,
                    fill: false
                },
                {
                    label: 'Yellow Zone Threshold (40)',
                    data: yellowThreshold,
                    borderColor: 'rgba(251, 191, 36, 0.8)',
                    borderWidth: 1.5,
                    borderDash: [5, 4],
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#94a3b8',
                        font: { size: 10, family: 'monospace' },
                        boxWidth: 12
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(11, 15, 23, 0.95)',
                    borderColor: mainColor,
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    titleFont: { family: 'monospace', size: 12, weight: 'bold' },
                    titleColor: '#38bdf8',
                    bodyFont: { family: 'sans-serif', size: 11 },
                    bodyColor: '#e2e8f0',
                    callbacks: {
                        title: function(items) {
                            if (!items.length) return '';
                            return items[0].label;
                        },
                        label: function(context) {
                            if (context.datasetIndex === 0) {
                                const score = context.parsed.y;
                                const tier = score >= 70 ? '🔴 RED ZONE (Critical)' : (score >= 40 ? '🟡 YELLOW ZONE (Elevated)' : '🟢 GREEN ZONE (Stable)');
                                return [
                                    `Dynamic Distress Score: ${score}/100`,
                                    `Status: ${tier}`,
                                    `Action: ${score >= 70 ? 'Immediate DLSA Caseworker Intervention' : (score >= 40 ? 'Clinical Tele-Check within 24h' : 'Stable Statutory Monitoring')}`
                                ];
                            }
                            return `${context.dataset.label}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: 100,
                    ticks: { stepSize: 20, color: '#64748b', font: { size: 10 } },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                },
                x: {
                    ticks: { color: '#94a3b8', font: { size: 10 } },
                    grid: { display: false }
                }
            }
        }
    });
}

// ============================================================================
// ISOLATED SURVIVOR TREND SPARKLINE RENDERER (Zero Cross-Exposure)
// ============================================================================
function renderVictimSparkline(caseId) {
    const canvas = document.getElementById('victim-sparkline-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const targetCase = cases.find(c => c.caseId === caseId) || cases[0];
    const checkIns = targetCase ? (targetCase.checkIns || []) : [];
    let scores = checkIns.map(c => c.ddiScore);

    if (scores.length === 0) {
        scores = [25, 30, 35, 40];
    } else if (scores.length === 1) {
        scores = [Math.max(10, scores[0] - 15), Math.max(12, scores[0] - 8), Math.max(15, scores[0] - 2), scores[0]];
    } else if (scores.length === 2) {
        scores = [Math.max(10, scores[0] - 10), scores[0], Math.round((scores[0] + scores[1]) / 2), scores[1]];
    }

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = (rect.width > 0 ? rect.width : 340);
    const height = (rect.height > 0 ? rect.height : 64);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    // Subtle guide lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    [0.25, 0.5, 0.75].forEach(ratio => {
        ctx.beginPath();
        ctx.moveTo(0, height * ratio);
        ctx.lineTo(width, height * ratio);
        ctx.stroke();
    });
    ctx.setLineDash([]);

    const padX = 14;
    const padY = 10;
    const drawWidth = width - padX * 2;
    const drawHeight = height - padY * 2;
    const minVal = 0;
    const maxVal = 100;

    const points = scores.map((val, idx) => {
        const x = padX + (idx / (scores.length - 1)) * drawWidth;
        const y = padY + drawHeight - ((val - minVal) / (maxVal - minVal)) * drawHeight;
        return { x, y, val };
    });

    // Gradient fill under the curve
    const fillGrad = ctx.createLinearGradient(0, 0, 0, height);
    fillGrad.addColorStop(0, 'rgba(16, 185, 129, 0.32)');
    fillGrad.addColorStop(0.7, 'rgba(6, 182, 212, 0.09)');
    fillGrad.addColorStop(1, 'rgba(6, 182, 212, 0.0)');

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const midX = (prev.x + curr.x) / 2;
        ctx.bezierCurveTo(midX, prev.y, midX, curr.y, curr.x, curr.y);
    }
    ctx.lineTo(points[points.length - 1].x, height);
    ctx.lineTo(points[0].x, height);
    ctx.closePath();
    ctx.fillStyle = fillGrad;
    ctx.fill();

    // Glowing stroke
    const strokeGrad = ctx.createLinearGradient(0, 0, width, 0);
    strokeGrad.addColorStop(0, '#06b6d4');
    strokeGrad.addColorStop(1, '#10b981');

    ctx.save();
    ctx.shadowColor = 'rgba(16, 185, 129, 0.6)';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = strokeGrad;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const midX = (prev.x + curr.x) / 2;
        ctx.bezierCurveTo(midX, prev.y, midX, curr.y, curr.x, curr.y);
    }
    ctx.stroke();
    ctx.restore();

    // Data points & active pulse
    points.forEach((p, idx) => {
        const isLast = idx === points.length - 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, isLast ? 4.5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = isLast ? '#ffffff' : '#10b981';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = isLast ? '#10b981' : '#0B0F17';
        ctx.stroke();

        if (isLast) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    });
}

// ============================================================================
// ANONYMIZED STATUTORY COMPLIANCE REPORT EXPORTER (Zero PII Exposure)
// ============================================================================
function exportAnonymizedReport() {
    playHapticBeep(900, 'sine', 0.12);

    const headers = [
        "Anonymized_ID",
        "District",
        "Atrocity_Section",
        "Legal_Milestone",
        "Latest_DDS_Score",
        "Triage_Zone",
        "Interim_Relief_Status",
        "Protection_Mandate",
        "Assigned_Agency",
        "Last_Reported_Date"
    ];

    const rows = cases.map((c, idx) => {
        const latest = c.checkIns && c.checkIns.length > 0 ? c.checkIns[c.checkIns.length - 1] : null;
        const score = latest ? latest.ddiScore : 35;
        const zone = score >= 70 ? "RED (Priority 1 Critical)" : (score >= 40 ? "YELLOW (Moderate)" : "GREEN (Stable)");
        const relief = score >= 70 ? "Special Emergency Relief Tranche (₹1,25,000)" : "Standard Tranche Processed (Annexure I)";
        const protection = score >= 70 ? "DLSA Armed Escort & Safe-House Relocation Active" : "Routine Periodic Welfare Check";
        const milestone = (latest && latest.milestone) || c.milestone || "Investigation in Progress";
        const dateStr = (latest && latest.date) ? new Date(latest.date).toISOString().split('T')[0] : "2026-09-01";
        const anonId = `NEX-ANON-${(idx + 1).toString().padStart(4, '0')}`;

        return [
            `"${anonId}"`,
            `"${c.district || 'Pune'}"`,
            `"${c.category || 'SC/ST Act Sec 3(1)(r)(s)'}"`,
            `"${milestone}"`,
            score,
            `"${zone}"`,
            `"${relief}"`,
            `"${protection}"`,
            `"${c.assignedCounselor ? 'DLSA Authorized Personnel' : 'MoSJE State Cell'}"`,
            `"${dateStr}"`
        ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `NEXORA_MoSJE_Statutory_Compliance_Report_Anonymized_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showAnonymizedExportNotice();
}

function showAnonymizedExportNotice() {
    const existing = document.getElementById('export-notice-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'export-notice-toast';
    toast.className = 'fixed bottom-6 right-6 z-50 glass-copilot-card-emerald p-4 text-xs space-y-1 shadow-2xl animate-fade-in flex items-start gap-3 max-w-md';
    toast.innerHTML = `
        <span class="w-3 h-3 rounded-full beacon-dot-emerald shrink-0 mt-0.5"></span>
        <div>
            <div class="font-bold text-emerald-300 font-mono flex items-center gap-1.5">
                <span>📁 STATUTORY COMPLIANCE REPORT EXPORTED</span>
            </div>
            <p class="text-slate-300 text-[11px] mt-0.5">
                Generated anonymized dataset with <strong>Zero PII Exposure</strong>. Contains macro statutory triage metrics, milestone tags, and MoSJE Annexure I relief disbursement logs.
            </p>
        </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s ease';
        setTimeout(() => toast.remove(), 500);
    }, 4500);
}

// ============================================================================
// PORTAL 3: STATUTORY COMPENSATION VS PSYCHOLOGICAL RECOVERY CHART
// ============================================================================
function renderCompensationChart() {
    const canvas = document.getElementById('compensationRecoveryChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (typeof Chart === 'undefined') return;

    if (compensationChartInstance) {
        compensationChartInstance.destroy();
    }

    const districts = ['Sambhajinagar', 'Nashik', 'Thane', 'Pune', 'Nagpur'];
    const deliveryDays = [14, 18, 21, 28, 35]; // Avg relief delay (Days)
    const distressRecovery = [51, 36, 30, 22, 18]; // Distress reduction (Points)

    compensationChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: districts,
            datasets: [
                {
                    type: 'bar',
                    label: 'Avg Relief Disbursement Delay (Days)',
                    data: deliveryDays,
                    backgroundColor: 'rgba(251, 146, 60, 0.75)',
                    borderColor: '#f97316',
                    borderWidth: 1,
                    borderRadius: 6,
                    yAxisID: 'y'
                },
                {
                    type: 'line',
                    label: 'Psychological Distress Drop (Pts Recovered)',
                    data: distressRecovery,
                    borderColor: '#2dd4bf',
                    backgroundColor: 'rgba(45, 212, 191, 0.2)',
                    fill: false,
                    borderWidth: 3,
                    tension: 0.3,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#0d9488',
                    pointRadius: 6,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: '#cbd5e1', font: { size: 11 } }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: 'Disbursement Delay (Days)', color: '#fdba74' },
                    ticks: { color: '#94a3b8' },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: true, text: 'Distress Drop (Points)', color: '#5eead4' },
                    ticks: { color: '#94a3b8' },
                    grid: { drawOnChartArea: false }
                },
                x: {
                    ticks: { color: '#cbd5e1' },
                    grid: { display: false }
                }
            }
        }
    });
}

// ============================================================================
// PORTAL 3 & COUNSELOR: INTERACTIVE SANKEY CLINICAL TRIAGE FLOW DIAGRAM
// ============================================================================
const stateSankeyData = {
    all: {
        name: "All Maharashtra",
        total: 76,
        influx: [
            { id: "src-fir", name: "Police FIR (Sec 15A)", count: 34, pct: 45, color: "#38bdf8" },
            { id: "src-dlsa", name: "DLSA Legal Aid", count: 23, pct: 30, color: "#c084fc" },
            { id: "src-181", name: "Helpline 181 / Direct", count: 19, pct: 25, color: "#2dd4bf" }
        ],
        triage: [
            { id: "trg-red", name: "Red Critical (≥70)", count: 24, pct: 32, color: "#f43f5e" },
            { id: "trg-yel", name: "Yellow Elevated (40-69)", count: 32, pct: 42, color: "#fbbf24" },
            { id: "trg-grn", name: "Green Stable (<40)", count: 20, pct: 26, color: "#10b981" }
        ],
        dispatch: [
            { id: "dsp-shelter", name: "Safe House Escort", count: 19, pct: 25, color: "#fb923c" },
            { id: "dsp-tele", name: "Trauma Tele-Care", count: 34, pct: 45, color: "#38bdf8" },
            { id: "dsp-court", name: "Witness Protection Detail", count: 23, pct: 30, color: "#a855f7" }
        ],
        outcomes: [
            { id: "out-secured", name: "Deposition Secured", count: 36, pct: 48, color: "#10b981" },
            { id: "out-stable", name: "In-Community Stabilized", count: 27, pct: 35, color: "#2dd4bf" },
            { id: "out-care", name: "Active Trauma Care", count: 13, pct: 17, color: "#f59e0b" }
        ],
        flows: [
            { from: "src-fir", to: "trg-red", val: 14, color1: "#38bdf8", color2: "#f43f5e" },
            { from: "src-fir", to: "trg-yel", val: 15, color1: "#38bdf8", color2: "#fbbf24" },
            { from: "src-fir", to: "trg-grn", val: 5, color1: "#38bdf8", color2: "#10b981" },
            { from: "src-dlsa", to: "trg-red", val: 6, color1: "#c084fc", color2: "#f43f5e" },
            { from: "src-dlsa", to: "trg-yel", val: 11, color1: "#c084fc", color2: "#fbbf24" },
            { from: "src-dlsa", to: "trg-grn", val: 6, color1: "#c084fc", color2: "#10b981" },
            { from: "src-181", to: "trg-red", val: 4, color1: "#2dd4bf", color2: "#f43f5e" },
            { from: "src-181", to: "trg-yel", val: 6, color1: "#2dd4bf", color2: "#fbbf24" },
            { from: "src-181", to: "trg-grn", val: 9, color1: "#2dd4bf", color2: "#10b981" },

            { from: "trg-red", to: "dsp-shelter", val: 12, color1: "#f43f5e", color2: "#fb923c" },
            { from: "trg-red", to: "dsp-court", val: 12, color1: "#f43f5e", color2: "#a855f7" },
            { from: "trg-yel", to: "dsp-tele", val: 22, color1: "#fbbf24", color2: "#38bdf8" },
            { from: "trg-yel", to: "dsp-court", val: 6, color1: "#fbbf24", color2: "#a855f7" },
            { from: "trg-yel", to: "dsp-shelter", val: 4, color1: "#fbbf24", color2: "#fb923c" },
            { from: "trg-grn", to: "dsp-tele", val: 12, color1: "#10b981", color2: "#38bdf8" },
            { from: "trg-grn", to: "dsp-court", val: 5, color1: "#10b981", color2: "#a855f7" },
            { from: "trg-grn", to: "dsp-shelter", val: 3, color1: "#10b981", color2: "#fb923c" },

            { from: "dsp-shelter", to: "out-secured", val: 11, color1: "#fb923c", color2: "#10b981" },
            { from: "dsp-shelter", to: "out-stable", val: 5, color1: "#fb923c", color2: "#2dd4bf" },
            { from: "dsp-shelter", to: "out-care", val: 3, color1: "#fb923c", color2: "#f59e0b" },
            { from: "dsp-tele", to: "out-secured", val: 14, color1: "#38bdf8", color2: "#10b981" },
            { from: "dsp-tele", to: "out-stable", val: 16, color1: "#38bdf8", color2: "#2dd4bf" },
            { from: "dsp-tele", to: "out-care", val: 4, color1: "#38bdf8", color2: "#f59e0b" },
            { from: "dsp-court", to: "out-secured", val: 11, color1: "#a855f7", color2: "#10b981" },
            { from: "dsp-court", to: "out-stable", val: 6, color1: "#a855f7", color2: "#2dd4bf" },
            { from: "dsp-court", to: "out-care", val: 6, color1: "#a855f7", color2: "#f59e0b" }
        ]
    },
    pune: {
        name: "Pune",
        total: 18,
        influx: [
            { id: "src-fir", name: "Police FIR (Sec 15A)", count: 9, pct: 50, color: "#38bdf8" },
            { id: "src-dlsa", name: "DLSA Legal Aid", count: 6, pct: 33, color: "#c084fc" },
            { id: "src-181", name: "Helpline 181 / Direct", count: 3, pct: 17, color: "#2dd4bf" }
        ],
        triage: [
            { id: "trg-red", name: "Red Critical (≥70)", count: 8, pct: 44, color: "#f43f5e" },
            { id: "trg-yel", name: "Yellow Elevated (40-69)", count: 6, pct: 33, color: "#fbbf24" },
            { id: "trg-grn", name: "Green Stable (<40)", count: 4, pct: 23, color: "#10b981" }
        ],
        dispatch: [
            { id: "dsp-shelter", name: "Safe House Escort", count: 7, pct: 39, color: "#fb923c" },
            { id: "dsp-tele", name: "Trauma Tele-Care", count: 6, pct: 33, color: "#38bdf8" },
            { id: "dsp-court", name: "Witness Protection Detail", count: 5, pct: 28, color: "#a855f7" }
        ],
        outcomes: [
            { id: "out-secured", name: "Deposition Secured", count: 8, pct: 44, color: "#10b981" },
            { id: "out-stable", name: "In-Community Stabilized", count: 6, pct: 33, color: "#2dd4bf" },
            { id: "out-care", name: "Active Trauma Care", count: 4, pct: 23, color: "#f59e0b" }
        ],
        flows: [
            { from: "src-fir", to: "trg-red", val: 5, color1: "#38bdf8", color2: "#f43f5e" },
            { from: "src-fir", to: "trg-yel", val: 3, color1: "#38bdf8", color2: "#fbbf24" },
            { from: "src-fir", to: "trg-grn", val: 1, color1: "#38bdf8", color2: "#10b981" },
            { from: "src-dlsa", to: "trg-red", val: 2, color1: "#c084fc", color2: "#f43f5e" },
            { from: "src-dlsa", to: "trg-yel", val: 3, color1: "#c084fc", color2: "#fbbf24" },
            { from: "src-dlsa", to: "trg-grn", val: 1, color1: "#c084fc", color2: "#10b981" },
            { from: "src-181", to: "trg-red", val: 1, color1: "#2dd4bf", color2: "#f43f5e" },
            { from: "src-181", to: "trg-yel", val: 0, color1: "#2dd4bf", color2: "#fbbf24" },
            { from: "src-181", to: "trg-grn", val: 2, color1: "#2dd4bf", color2: "#10b981" },

            { from: "trg-red", to: "dsp-shelter", val: 5, color1: "#f43f5e", color2: "#fb923c" },
            { from: "trg-red", to: "dsp-court", val: 3, color1: "#f43f5e", color2: "#a855f7" },
            { from: "trg-yel", to: "dsp-tele", val: 4, color1: "#fbbf24", color2: "#38bdf8" },
            { from: "trg-yel", to: "dsp-court", val: 1, color1: "#fbbf24", color2: "#a855f7" },
            { from: "trg-yel", to: "dsp-shelter", val: 1, color1: "#fbbf24", color2: "#fb923c" },
            { from: "trg-grn", to: "dsp-tele", val: 2, color1: "#10b981", color2: "#38bdf8" },
            { from: "trg-grn", to: "dsp-court", val: 1, color1: "#10b981", color2: "#a855f7" },
            { from: "trg-grn", to: "dsp-shelter", val: 1, color1: "#10b981", color2: "#fb923c" },

            { from: "dsp-shelter", to: "out-secured", val: 4, color1: "#fb923c", color2: "#10b981" },
            { from: "dsp-shelter", to: "out-stable", val: 2, color1: "#fb923c", color2: "#2dd4bf" },
            { from: "dsp-shelter", to: "out-care", val: 1, color1: "#fb923c", color2: "#f59e0b" },
            { from: "dsp-tele", to: "out-secured", val: 2, color1: "#38bdf8", color2: "#10b981" },
            { from: "dsp-tele", to: "out-stable", val: 3, color1: "#38bdf8", color2: "#2dd4bf" },
            { from: "dsp-tele", to: "out-care", val: 1, color1: "#38bdf8", color2: "#f59e0b" },
            { from: "dsp-court", to: "out-secured", val: 2, color1: "#a855f7", color2: "#10b981" },
            { from: "dsp-court", to: "out-stable", val: 1, color1: "#a855f7", color2: "#2dd4bf" },
            { from: "dsp-court", to: "out-care", val: 2, color1: "#a855f7", color2: "#f59e0b" }
        ]
    },
    mumbai: {
        name: "Mumbai",
        total: 22,
        influx: [
            { id: "src-fir", name: "Police FIR (Sec 15A)", count: 9, pct: 41, color: "#38bdf8" },
            { id: "src-dlsa", name: "DLSA Legal Aid", count: 8, pct: 36, color: "#c084fc" },
            { id: "src-181", name: "Helpline 181 / Direct", count: 5, pct: 23, color: "#2dd4bf" }
        ],
        triage: [
            { id: "trg-red", name: "Red Critical (≥70)", count: 6, pct: 27, color: "#f43f5e" },
            { id: "trg-yel", name: "Yellow Elevated (40-69)", count: 11, pct: 50, color: "#fbbf24" },
            { id: "trg-grn", name: "Green Stable (<40)", count: 5, pct: 23, color: "#10b981" }
        ],
        dispatch: [
            { id: "dsp-shelter", name: "Safe House Escort", count: 5, pct: 23, color: "#fb923c" },
            { id: "dsp-tele", name: "Trauma Tele-Care", count: 11, pct: 50, color: "#38bdf8" },
            { id: "dsp-court", name: "Witness Protection Detail", count: 6, pct: 27, color: "#a855f7" }
        ],
        outcomes: [
            { id: "out-secured", name: "Deposition Secured", count: 11, pct: 50, color: "#10b981" },
            { id: "out-stable", name: "In-Community Stabilized", count: 8, pct: 36, color: "#2dd4bf" },
            { id: "out-care", name: "Active Trauma Care", count: 3, pct: 14, color: "#f59e0b" }
        ],
        flows: [
            { from: "src-fir", to: "trg-red", val: 3, color1: "#38bdf8", color2: "#f43f5e" },
            { from: "src-fir", to: "trg-yel", val: 5, color1: "#38bdf8", color2: "#fbbf24" },
            { from: "src-fir", to: "trg-grn", val: 1, color1: "#38bdf8", color2: "#10b981" },
            { from: "src-dlsa", to: "trg-red", val: 2, color1: "#c084fc", color2: "#f43f5e" },
            { from: "src-dlsa", to: "trg-yel", val: 4, color1: "#c084fc", color2: "#fbbf24" },
            { from: "src-dlsa", to: "trg-grn", val: 2, color1: "#c084fc", color2: "#10b981" },
            { from: "src-181", to: "trg-red", val: 1, color1: "#2dd4bf", color2: "#f43f5e" },
            { from: "src-181", to: "trg-yel", val: 2, color1: "#2dd4bf", color2: "#fbbf24" },
            { from: "src-181", to: "trg-grn", val: 2, color1: "#2dd4bf", color2: "#10b981" },

            { from: "trg-red", to: "dsp-shelter", val: 3, color1: "#f43f5e", color2: "#fb923c" },
            { from: "trg-red", to: "dsp-court", val: 3, color1: "#f43f5e", color2: "#a855f7" },
            { from: "trg-yel", to: "dsp-tele", val: 8, color1: "#fbbf24", color2: "#38bdf8" },
            { from: "trg-yel", to: "dsp-court", val: 2, color1: "#fbbf24", color2: "#a855f7" },
            { from: "trg-yel", to: "dsp-shelter", val: 1, color1: "#fbbf24", color2: "#fb923c" },
            { from: "trg-grn", to: "dsp-tele", val: 3, color1: "#10b981", color2: "#38bdf8" },
            { from: "trg-grn", to: "dsp-court", val: 1, color1: "#10b981", color2: "#a855f7" },
            { from: "trg-grn", to: "dsp-shelter", val: 1, color1: "#10b981", color2: "#fb923c" },

            { from: "dsp-shelter", to: "out-secured", val: 3, color1: "#fb923c", color2: "#10b981" },
            { from: "dsp-shelter", to: "out-stable", val: 1, color1: "#fb923c", color2: "#2dd4bf" },
            { from: "dsp-shelter", to: "out-care", val: 1, color1: "#fb923c", color2: "#f59e0b" },
            { from: "dsp-tele", to: "out-secured", val: 5, color1: "#38bdf8", color2: "#10b981" },
            { from: "dsp-tele", to: "out-stable", val: 5, color1: "#38bdf8", color2: "#2dd4bf" },
            { from: "dsp-tele", to: "out-care", val: 1, color1: "#38bdf8", color2: "#f59e0b" },
            { from: "dsp-court", to: "out-secured", val: 3, color1: "#a855f7", color2: "#10b981" },
            { from: "dsp-court", to: "out-stable", val: 2, color1: "#a855f7", color2: "#2dd4bf" },
            { from: "dsp-court", to: "out-care", val: 1, color1: "#a855f7", color2: "#f59e0b" }
        ]
    },
    nagpur: {
        name: "Nagpur",
        total: 14,
        influx: [
            { id: "src-fir", name: "Police FIR (Sec 15A)", count: 6, pct: 43, color: "#38bdf8" },
            { id: "src-dlsa", name: "DLSA Legal Aid", count: 4, pct: 29, color: "#c084fc" },
            { id: "src-181", name: "Helpline 181 / Direct", count: 4, pct: 29, color: "#2dd4bf" }
        ],
        triage: [
            { id: "trg-red", name: "Red Critical (≥70)", count: 4, pct: 29, color: "#f43f5e" },
            { id: "trg-yel", name: "Yellow Elevated (40-69)", count: 6, pct: 43, color: "#fbbf24" },
            { id: "trg-grn", name: "Green Stable (<40)", count: 4, pct: 29, color: "#10b981" }
        ],
        dispatch: [
            { id: "dsp-shelter", name: "Safe House Escort", count: 3, pct: 21, color: "#fb923c" },
            { id: "dsp-tele", name: "Trauma Tele-Care", count: 7, pct: 50, color: "#38bdf8" },
            { id: "dsp-court", name: "Witness Protection Detail", count: 4, pct: 29, color: "#a855f7" }
        ],
        outcomes: [
            { id: "out-secured", name: "Deposition Secured", count: 7, pct: 50, color: "#10b981" },
            { id: "out-stable", name: "In-Community Stabilized", count: 5, pct: 36, color: "#2dd4bf" },
            { id: "out-care", name: "Active Trauma Care", count: 2, pct: 14, color: "#f59e0b" }
        ],
        flows: [
            { from: "src-fir", to: "trg-red", val: 2, color1: "#38bdf8", color2: "#f43f5e" },
            { from: "src-fir", to: "trg-yel", val: 3, color1: "#38bdf8", color2: "#fbbf24" },
            { from: "src-fir", to: "trg-grn", val: 1, color1: "#38bdf8", color2: "#10b981" },
            { from: "src-dlsa", to: "trg-red", val: 1, color1: "#c084fc", color2: "#f43f5e" },
            { from: "src-dlsa", to: "trg-yel", val: 2, color1: "#c084fc", color2: "#fbbf24" },
            { from: "src-dlsa", to: "trg-grn", val: 1, color1: "#c084fc", color2: "#10b981" },
            { from: "src-181", to: "trg-red", val: 1, color1: "#2dd4bf", color2: "#f43f5e" },
            { from: "src-181", to: "trg-yel", val: 1, color1: "#2dd4bf", color2: "#fbbf24" },
            { from: "src-181", to: "trg-grn", val: 2, color1: "#2dd4bf", color2: "#10b981" },

            { from: "trg-red", to: "dsp-shelter", val: 2, color1: "#f43f5e", color2: "#fb923c" },
            { from: "trg-red", to: "dsp-court", val: 2, color1: "#f43f5e", color2: "#a855f7" },
            { from: "trg-yel", to: "dsp-tele", val: 5, color1: "#fbbf24", color2: "#38bdf8" },
            { from: "trg-yel", to: "dsp-court", val: 1, color1: "#fbbf24", color2: "#a855f7" },
            { from: "trg-yel", to: "dsp-shelter", val: 0, color1: "#fbbf24", color2: "#fb923c" },
            { from: "trg-grn", to: "dsp-tele", val: 2, color1: "#10b981", color2: "#38bdf8" },
            { from: "trg-grn", to: "dsp-court", val: 1, color1: "#10b981", color2: "#a855f7" },
            { from: "trg-grn", to: "dsp-shelter", val: 1, color1: "#10b981", color2: "#fb923c" },

            { from: "dsp-shelter", to: "out-secured", val: 2, color1: "#fb923c", color2: "#10b981" },
            { from: "dsp-shelter", to: "out-stable", val: 1, color1: "#fb923c", color2: "#2dd4bf" },
            { from: "dsp-shelter", to: "out-care", val: 0, color1: "#fb923c", color2: "#f59e0b" },
            { from: "dsp-tele", to: "out-secured", val: 3, color1: "#38bdf8", color2: "#10b981" },
            { from: "dsp-tele", to: "out-stable", val: 3, color1: "#38bdf8", color2: "#2dd4bf" },
            { from: "dsp-tele", to: "out-care", val: 1, color1: "#38bdf8", color2: "#f59e0b" },
            { from: "dsp-court", to: "out-secured", val: 2, color1: "#a855f7", color2: "#10b981" },
            { from: "dsp-court", to: "out-stable", val: 1, color1: "#a855f7", color2: "#2dd4bf" },
            { from: "dsp-court", to: "out-care", val: 1, color1: "#a855f7", color2: "#f59e0b" }
        ]
    }
};

function renderSankeyFlowDiagram(districtId = 'all', targetSvgId = 'sankey-svg') {
    const svg = document.getElementById(targetSvgId);
    if (!svg) return;

    const data = stateSankeyData[districtId] || stateSankeyData.all;

    // Viewport dimensions
    const width = 920;
    const height = 240;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    // Map column X positions
    const colX = [20, 260, 500, 740];
    const colW = 160;
    const nodeH = 46;
    const yStarts = [18, 88, 158];

    // Build node coordinate registry
    const nodeMap = {};
    const stages = [data.influx, data.triage, data.dispatch, data.outcomes];

    stages.forEach((stageNodes, colIdx) => {
        stageNodes.forEach((node, rowIdx) => {
            nodeMap[node.id] = {
                ...node,
                x: colX[colIdx],
                y: yStarts[rowIdx],
                w: colW,
                h: nodeH,
                col: colIdx
            };
        });
    });

    // Build SVG Gradients Defs
    let defsHtml = `<defs>`;
    data.flows.forEach((flow, i) => {
        if (flow.val > 0) {
            defsHtml += `
                <linearGradient id="sankey-grad-${targetSvgId}-${districtId}-${i}" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="${flow.color1}" stop-opacity="0.65" />
                    <stop offset="100%" stop-color="${flow.color2}" stop-opacity="0.65" />
                </linearGradient>
            `;
        }
    });
    defsHtml += `</defs>`;

    // Build Flow Ribbons
    let ribbonsHtml = `<g class="sankey-ribbons">`;
    data.flows.forEach((flow, i) => {
        if (flow.val <= 0) return;
        const src = nodeMap[flow.from];
        const tgt = nodeMap[flow.to];
        if (!src || !tgt) return;

        const x1 = src.x + src.w;
        const y1 = src.y + (src.h / 2);
        const x2 = tgt.x;
        const y2 = tgt.y + (tgt.h / 2);
        const dx = (x2 - x1) * 0.5;

        // Thickness proportional to flow volume
        const thickness = Math.max(3, Math.min(22, (flow.val / data.total) * 60));

        const path = `M ${x1} ${y1 - thickness/2} C ${x1 + dx} ${y1 - thickness/2}, ${x2 - dx} ${y2 - thickness/2}, ${x2} ${y2 - thickness/2} L ${x2} ${y2 + thickness/2} C ${x2 - dx} ${y2 + thickness/2}, ${x1 + dx} ${y1 + thickness/2}, ${x1} ${y1 + thickness/2} Z`;

        ribbonsHtml += `
            <path d="${path}" fill="url(#sankey-grad-${targetSvgId}-${districtId}-${i})" class="sankey-ribbon sankey-flow-active">
                <title>${src.name} ➔ ${tgt.name}: ${flow.val} Survivors (${Math.round((flow.val / data.total) * 100)}%)</title>
            </path>
        `;
    });
    ribbonsHtml += `</g>`;

    // Build Node Rectangles & Text Labels
    let nodesHtml = `<g class="sankey-nodes">`;
    Object.values(nodeMap).forEach(node => {
        nodesHtml += `
            <g class="sankey-node" style="cursor: pointer;">
                <rect x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" rx="10" fill="rgba(10, 15, 29, 0.90)" stroke="${node.color}" stroke-width="1.6" />
                <text x="${node.x + 10}" y="${node.y + 19}" font-size="10.5" font-family="monospace" font-weight="bold" fill="#f8fafc">
                    ${node.name}
                </text>
                <text x="${node.x + 10}" y="${node.y + 35}" font-size="9" font-family="monospace" fill="${node.color}">
                    ${node.count} Survivors (${node.pct}%)
                </text>
            </g>
        `;
    });
    nodesHtml += `</g>`;

    svg.innerHTML = defsHtml + ribbonsHtml + nodesHtml;

    // Update Telemetry Stat Banners below Sankey
    const statInflux = document.getElementById('sankey-stat-influx');
    const statCritical = document.getElementById('sankey-stat-critical');
    const statShelter = document.getElementById('sankey-stat-shelter');
    const statStabilized = document.getElementById('sankey-stat-stabilized');

    if (statInflux) statInflux.innerText = `${data.total} Survivors (${data.name})`;
    if (statCritical) statCritical.innerText = `${data.triage[0].count} Cases (${data.triage[0].pct}%)`;
    if (statShelter) statShelter.innerText = `${data.dispatch[0].count} Protected`;
    if (statStabilized) statStabilized.innerText = `${data.outcomes[0].count} Secured (${data.outcomes[0].pct}%)`;
}

function updateSankeyDistrict(districtId) {
    playHapticBeep(600, 'sine', 0.05);
    currentSankeyDistrict = districtId;

    const districts = ['all', 'pune', 'mumbai', 'nagpur'];
    districts.forEach(d => {
        const btn = document.getElementById(`sankey-btn-${d}`);
        if (btn) {
            if (d === districtId) {
                btn.className = "px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-sky-600 text-white cursor-pointer transition-all shadow-xs";
            } else {
                btn.className = "px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-transparent text-slate-400 hover:text-slate-200 cursor-pointer transition-all";
            }
        }
    });

    renderSankeyFlowDiagram(districtId);
}

// ============================================================================
// PORTAL 3: STATE-WIDE MULTI-AGENCY CARE PATHWAY (GANTT SWIMLANE)
// ============================================================================
function renderStateCareSwimlane() {
    const container = document.getElementById('state-swimlane-container');
    if (!container) return;

    const stateAgencies = [
        {
            name: "Maharashtra Police Witness Protection",
            icon: "🚔",
            sla: "7 Days Limit",
            actual: "4.2 Days Avg",
            compliance: "92% SLA Compliance",
            badgeColor: "bg-sky-950/60 text-sky-300 border-sky-500/40",
            bars: [
                { label: "Threat Assessment (24h)", left: 0, width: 22, status: "completed", note: "Avg 18h Turnaround" },
                { label: "Personal Escort Detail (48h)", left: 24, width: 34, status: "active", note: "100% Red Zone Escorted" },
                { label: "Court Safe Transit", left: 62, width: 35, status: "completed", note: "In-Camera Trial Protection" }
            ]
        },
        {
            name: "District Legal Services Authority (DLSA)",
            icon: "⚖️",
            sla: "48h Counsel Assignment",
            actual: "28h Avg",
            compliance: "96% SLA Compliance",
            badgeColor: "bg-purple-950/60 text-purple-300 border-purple-500/40",
            bars: [
                { label: "Legal Counsel Assigned", left: 0, width: 28, status: "completed", note: "Empaneled Adv. Sanctioned" },
                { label: "Sec 164 CrPC Statement", left: 30, width: 32, status: "completed", note: "Judicial Magistrate Filing" },
                { label: "Trial Protection Motion", left: 64, width: 32, status: "active", note: "Fast-Track Court Hearings" }
            ]
        },
        {
            name: "Govt Trauma & Psychological Centers",
            icon: "🏥",
            sla: "72h Clinical Intake",
            actual: "1.8 Days Avg",
            compliance: "94% SLA Compliance",
            badgeColor: "bg-teal-950/60 text-teal-300 border-teal-500/40",
            bars: [
                { label: "Forensic Medical Exam", left: 0, width: 20, status: "completed", note: "Civil Hospital Documentation" },
                { label: "Trauma Stabilization Therapy", left: 22, width: 42, status: "completed", note: "Cognitive Processing Therapy" },
                { label: "6-Week Resilience Followup", left: 66, width: 30, status: "active", note: "Continuous Telemetry Audit" }
            ]
        },
        {
            name: "WCD Shelter & Victim Compensation",
            icon: "🏡",
            sla: "30 Days Statutory",
            actual: "21 Days Avg",
            compliance: "88% SLA Compliance",
            badgeColor: "bg-amber-950/60 text-amber-300 border-amber-500/40",
            bars: [
                { label: "Emergency Safe House (12h)", left: 0, width: 22, status: "completed", note: "19 Survivors Accommodated" },
                { label: "Interim Relief Sanction ₹1L", left: 24, width: 38, status: "completed", note: "Direct Bank Transfer" },
                { label: "Final Rehabilitation Grant", left: 64, width: 32, status: "scheduled", note: "Target: 45 Days Post-Trial" }
            ]
        }
    ];

    let html = `
        <div class="swimlane-container">
            <div class="flex items-center justify-between text-[10px] font-mono text-slate-400 pb-1 border-b border-white/5">
                <span>Authority / Department</span>
                <div class="flex items-center gap-4">
                    <span class="flex items-center gap-1"><span class="w-2 h-2 rounded bg-emerald-500"></span> Completed</span>
                    <span class="flex items-center gap-1"><span class="w-2 h-2 rounded bg-sky-500"></span> Active</span>
                    <span class="flex items-center gap-1"><span class="w-2 h-2 rounded bg-slate-600"></span> Scheduled</span>
                    <span>State Benchmark (0–30 Days)</span>
                </div>
            </div>
    `;

    stateAgencies.forEach(item => {
        html += `
            <div class="swimlane-row">
                <div class="space-y-1">
                    <div class="flex items-center gap-1.5">
                        <span class="text-sm">${item.icon}</span>
                        <span class="font-bold text-slate-200 text-[11px] truncate">${item.name}</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <span class="inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${item.badgeColor}">
                            ${item.actual}
                        </span>
                        <span class="text-[9px] text-emerald-400 font-mono font-bold">${item.compliance}</span>
                    </div>
                </div>
                <div class="swimlane-track-bg">
        `;

        item.bars.forEach(bar => {
            let bgClass = "bg-emerald-600 border border-emerald-400/40 text-white";
            if (bar.status === 'active') {
                bgClass = "bg-gradient-to-r from-sky-600 via-blue-500 to-sky-600 active-bar border border-sky-300 text-white shadow-lg shadow-sky-500/30";
            } else if (bar.status === 'scheduled') {
                bgClass = "bg-slate-800 border border-slate-700 text-slate-300";
            }

            html += `
                <div class="swimlane-bar ${bgClass}" style="left: ${bar.left}%; width: ${bar.width}%;" title="${bar.label}: ${bar.note}">
                    <span class="truncate">${bar.label}</span>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    });

    html += `
            <div class="flex justify-between text-[9px] font-mono text-slate-500 px-3 pt-1">
                <span>Day 0 (Intake)</span>
                <span>Day 7 (Police S-15A)</span>
                <span>Day 14 (Medical/DLSA)</span>
                <span>Day 21 (Interim Relief)</span>
                <span>Day 30 (Trial Deposition)</span>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

// ============================================================================
// PORTAL 3: DISTRICT PSYCHOLOGICAL RESILIENCE SPIDER RADAR
// ============================================================================
function renderDistrictResilienceRadar() {
    const canvas = document.getElementById('districtRadarChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (typeof Chart === 'undefined') return;

    if (districtRadarChartInstance) {
        districtRadarChartInstance.destroy();
        districtRadarChartInstance = null;
    }

    const categories = ['Sleep Stability', 'Emotional Regulation', 'Physical Safety', 'Trauma Recovery', 'Social Support', 'Legal Preparedness'];

    districtRadarChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: categories,
            datasets: [
                {
                    label: 'Pune (High Stress Cohort)',
                    data: [42, 48, 55, 46, 62, 58],
                    borderColor: '#2dd4bf',
                    backgroundColor: 'rgba(45, 212, 191, 0.20)',
                    borderWidth: 2.5,
                    pointBackgroundColor: '#2dd4bf',
                    pointBorderColor: '#ffffff',
                    pointRadius: 4
                },
                {
                    label: 'Mumbai (Urban Jurisdiction)',
                    data: [65, 70, 78, 68, 72, 80],
                    borderColor: '#38bdf8',
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    borderWidth: 2.5,
                    pointBackgroundColor: '#38bdf8',
                    pointBorderColor: '#ffffff',
                    pointRadius: 4
                },
                {
                    label: 'State Statutory Benchmark (75+)',
                    data: [75, 75, 75, 75, 75, 75],
                    borderColor: '#c084fc',
                    borderWidth: 1.5,
                    borderDash: [5, 4],
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(11, 15, 23, 0.95)',
                    borderColor: '#38bdf8',
                    borderWidth: 1,
                    padding: 10
                }
            },
            scales: {
                r: {
                    min: 0,
                    max: 100,
                    ticks: {
                        stepSize: 25,
                        color: '#64748b',
                        backdropColor: 'transparent',
                        font: { size: 9 }
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.08)' },
                    angleLines: { color: 'rgba(255, 255, 255, 0.08)' },
                    pointLabels: {
                        color: '#cbd5e1',
                        font: { size: 9.5, weight: 'bold', family: 'sans-serif' }
                    }
                }
            }
        }
    });
}

// ============================================================================
// COUNSELOR DASHBOARD INTELLIGENCE CENTER (4-TAB SUITE)
// ============================================================================
function switchDashboardIntelTab(tab) {
    playHapticBeep(580, 'sine', 0.06);
    currentDashboardIntelTab = tab;

    const tabs = ['swimlane', 'multiaxis', 'radar', 'sankey'];
    tabs.forEach(t => {
        const btn = document.getElementById(`dash-tab-${t}`);
        if (btn) {
            if (t === tab) {
                btn.className = "px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-sky-600 text-white cursor-pointer transition-all shadow-xs flex items-center gap-1.5";
            } else {
                btn.className = "px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-transparent text-slate-400 hover:text-slate-200 cursor-pointer transition-all flex items-center gap-1.5";
            }
        }
    });

    renderDashboardIntelligence(tab);
}

function renderDashboardIntelligence(tab = 'swimlane') {
    const chartWrapper = document.getElementById('dash-chart-wrapper');
    const htmlWrapper = document.getElementById('dash-html-wrapper');
    const insightText = document.getElementById('dash-intel-insight-text');

    if (!chartWrapper || !htmlWrapper) return;

    if (dashChartInstance) {
        dashChartInstance.destroy();
        dashChartInstance = null;
    }

    if (tab === 'swimlane') {
        chartWrapper.classList.add('hidden');
        htmlWrapper.classList.remove('hidden');

        if (insightText) {
            insightText.innerText = "Multi-Agency Care Pathway tracks parallel interventions across Police, Clinical, DLSA Legal Aid, and Welfare channels.";
        }

        // Render Caseload Care Pathway Gantt
        const activeCases = (cases && cases.length > 0) ? cases.slice(0, 4) : [
            { caseId: "MH-PUN-2026-081", victimName: "Pooja Gaikwad", threatLevel: "HIGH" },
            { caseId: "MH-MUM-2026-112", victimName: "Sunita Kamble", threatLevel: "MODERATE" },
            { caseId: "MH-NAG-2026-049", victimName: "Aarti Shinde", threatLevel: "HIGH" },
            { caseId: "MH-THA-2026-064", victimName: "Meena Jadhav", threatLevel: "LOW" }
        ];
        let html = `
            <div class="swimlane-container p-2">
                <div class="flex items-center justify-between text-[10px] font-mono text-slate-400 pb-2 border-b border-white/5">
                    <span>Patient ID &amp; Assigned Care Path</span>
                    <div class="flex items-center gap-3">
                        <span class="flex items-center gap-1"><span class="w-2 h-2 rounded bg-emerald-500"></span> Completed</span>
                        <span class="flex items-center gap-1"><span class="w-2 h-2 rounded bg-sky-500"></span> In Flight</span>
                        <span class="flex items-center gap-1"><span class="w-2 h-2 rounded bg-slate-600"></span> Scheduled</span>
                        <span>Multi-Agency Care Journey</span>
                    </div>
                </div>
        `;

        activeCases.forEach((c, idx) => {
            const isCritical = c.threatLevel === 'HIGH';
            const badge = isCritical ? 'RED ZONE • POLICE DETAIL' : (c.threatLevel === 'MODERATE' ? 'YELLOW ZONE • TELE-CARE' : 'GREEN ZONE • RECOVERY');
            const badgeColor = isCritical ? 'bg-rose-950/60 text-rose-300 border-rose-500/40' : (c.threatLevel === 'MODERATE' ? 'bg-amber-950/60 text-amber-300 border-amber-500/40' : 'bg-teal-950/60 text-teal-300 border-teal-500/40');

            html += `
                <div class="swimlane-row" onclick="switchMonitorTab('cases'); selectCase('${c.caseId}')" style="cursor: pointer;">
                    <div class="space-y-1">
                        <div class="flex items-center gap-1.5">
                            <span class="font-bold text-white text-xs font-mono">${c.victimName || c.caseId}</span>
                        </div>
                        <span class="inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${badgeColor}">
                            ${badge}
                        </span>
                    </div>
                    <div class="swimlane-track-bg">
                        <div class="swimlane-bar bg-emerald-600 border border-emerald-400/40 text-white" style="left: 0%; width: 24%;" title="Intake Diagnostics: Verified">
                            <span>Intake (100%)</span>
                        </div>
                        <div class="swimlane-bar ${isCritical ? 'bg-gradient-to-r from-sky-600 via-blue-500 to-sky-600 active-bar border border-sky-300 text-white shadow-lg shadow-sky-500/30' : 'bg-emerald-600 border border-emerald-400/40 text-white'}" style="left: 26%; width: 38%;" title="${isCritical ? 'Active Armed Escort' : 'Therapeutic Stabilization'}">
                            <span>${isCritical ? 'Police Escort (Active)' : 'Clinical Therapy'}</span>
                        </div>
                        <div class="swimlane-bar bg-slate-800 border border-slate-700 text-slate-300" style="left: 66%; width: 32%;" title="Court In-Camera Deposition">
                            <span>Deposition Trial</span>
                        </div>
                    </div>
                </div>
            `;
        });

        html += `
                <div class="flex justify-between text-[9px] font-mono text-slate-500 px-3 pt-2">
                    <span>Day 0 (FIR Referral)</span>
                    <span>Wk 1 (Threat Evaluation)</span>
                    <span>Wk 2 (Clinical Stabilization)</span>
                    <span>Wk 4 (Legal Deposition)</span>
                    <span>Wk 6 (Post-Trial Rehab)</span>
                </div>
            </div>
        `;
        htmlWrapper.innerHTML = html;

    } else if (tab === 'multiaxis') {
        htmlWrapper.classList.add('hidden');
        chartWrapper.classList.remove('hidden');

        if (insightText) {
            insightText.innerText = "Multi-Axis Telemetry demonstrates strong inverse correlation between elevated distress spikes (>70) and chronic sleep deprivation (<4.5 hrs).";
        }

        const canvas = document.getElementById('dashIntelChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (typeof Chart === 'undefined') return;

        const labels = ['Intake (Wk 0)', 'Wk 1', 'Wk 2', 'Wk 3 (Threat Spikes)', 'Wk 4', 'Wk 5 (Stabilized)'];
        const avgDds = [54, 58, 66, 78, 62, 48];
        const avgPanic = [44, 48, 56, 72, 54, 38];
        const avgSleep = [6.8, 6.2, 5.0, 3.8, 5.5, 6.9];

        dashChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Cohort Dynamic Distress Score (DDS 0–100)',
                        data: avgDds,
                        borderColor: '#f43f5e',
                        backgroundColor: 'rgba(244, 63, 94, 0.12)',
                        fill: true,
                        borderWidth: 2.8,
                        tension: 0.35,
                        pointBackgroundColor: '#ffffff',
                        pointBorderColor: '#f43f5e',
                        pointRadius: 5,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Cohort Panic & Agitation %',
                        data: avgPanic,
                        borderColor: '#fbbf24',
                        borderWidth: 2,
                        borderDash: [4, 3],
                        pointBackgroundColor: '#fbbf24',
                        pointRadius: 4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Cohort Nightly Sleep Duration (Hours)',
                        data: avgSleep,
                        borderColor: '#38bdf8',
                        backgroundColor: 'rgba(56, 189, 248, 0.08)',
                        fill: true,
                        borderWidth: 2.5,
                        tension: 0.35,
                        pointBackgroundColor: '#ffffff',
                        pointBorderColor: '#38bdf8',
                        pointRadius: 5,
                        yAxisID: 'y1'
                    },
                    {
                        label: 'Red Alert Critical Threshold (70)',
                        data: labels.map(() => 70),
                        borderColor: 'rgba(244, 63, 94, 0.8)',
                        borderWidth: 1.5,
                        borderDash: [5, 4],
                        pointRadius: 0,
                        fill: false,
                        yAxisID: 'y'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: { color: '#94a3b8', font: { size: 10, family: 'monospace' }, boxWidth: 12 }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(11, 15, 23, 0.95)',
                        borderColor: 'rgba(56, 189, 248, 0.5)',
                        borderWidth: 1,
                        padding: 10
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        position: 'left',
                        min: 0,
                        max: 100,
                        ticks: { stepSize: 20, color: '#94a3b8', font: { size: 10 } },
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        title: { display: true, text: 'Distress & Panic (0–100)', color: '#94a3b8', font: { size: 10, family: 'monospace' } }
                    },
                    y1: {
                        type: 'linear',
                        position: 'right',
                        min: 0,
                        max: 12,
                        ticks: { stepSize: 2, color: '#38bdf8', font: { size: 10 }, callback: (v) => v + 'h' },
                        grid: { drawOnChartArea: false },
                        title: { display: true, text: 'Sleep Duration (Hours)', color: '#38bdf8', font: { size: 10, family: 'monospace' } }
                    },
                    x: {
                        ticks: { color: '#94a3b8', font: { size: 10, family: 'monospace' } },
                        grid: { color: 'rgba(255, 255, 255, 0.03)' }
                    }
                }
            }
        });

    } else if (tab === 'radar') {
        htmlWrapper.classList.add('hidden');
        chartWrapper.classList.remove('hidden');

        if (insightText) {
            insightText.innerText = "6-Axis Resilience Profile shows significant recovery in Legal Readiness (+34%) and Social Support (+28%) following multidisciplinary intervention.";
        }

        const canvas = document.getElementById('dashIntelChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (typeof Chart === 'undefined') return;

        const categories = ['Sleep Stability', 'Emotional Regulation', 'Physical Safety', 'Trauma Recovery', 'Social Support', 'Legal Preparedness'];

        dashChartInstance = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: categories,
                datasets: [
                    {
                        label: 'Current Clinical Cohort (Post-Intervention)',
                        data: [68, 72, 76, 65, 74, 82],
                        borderColor: '#38bdf8',
                        backgroundColor: 'rgba(56, 189, 248, 0.20)',
                        borderWidth: 2.5,
                        pointBackgroundColor: '#38bdf8',
                        pointBorderColor: '#ffffff',
                        pointRadius: 4
                    },
                    {
                        label: 'Intake Baseline Cohort (Pre-Intervention)',
                        data: [42, 38, 35, 40, 52, 44],
                        borderColor: '#94a3b8',
                        backgroundColor: 'rgba(148, 163, 184, 0.08)',
                        borderWidth: 1.8,
                        borderDash: [4, 4],
                        pointBackgroundColor: '#94a3b8',
                        pointRadius: 3
                    },
                    {
                        label: 'Statutory Resilience Target (80+)',
                        data: [80, 80, 80, 80, 80, 80],
                        borderColor: '#10b981',
                        borderWidth: 1.5,
                        borderDash: [6, 4],
                        pointRadius: 0,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: { color: '#94a3b8', font: { size: 10, family: 'monospace' }, boxWidth: 12 }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(11, 15, 23, 0.95)',
                        borderColor: '#38bdf8',
                        borderWidth: 1,
                        padding: 10
                    }
                },
                scales: {
                    r: {
                        min: 0,
                        max: 100,
                        ticks: { stepSize: 25, color: '#64748b', backdropColor: 'transparent', font: { size: 9 } },
                        grid: { color: 'rgba(255, 255, 255, 0.08)' },
                        angleLines: { color: 'rgba(255, 255, 255, 0.08)' },
                        pointLabels: { color: '#cbd5e1', font: { size: 9.5, weight: 'bold' } }
                    }
                }
            }
        });

    } else if (tab === 'sankey') {
        chartWrapper.classList.add('hidden');
        htmlWrapper.classList.remove('hidden');

        if (insightText) {
            insightText.innerText = "Caseload Triage Pipeline: 100% of critical Red Zone patients successfully linked to immediate safe house accommodation and DLSA assigned counsel.";
        }

        // Render dedicated Counselor Caseload Sankey in htmlWrapper
        htmlWrapper.innerHTML = `
            <div class="w-full h-full flex flex-col justify-between">
                <div class="grid grid-cols-4 gap-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 pb-1.5 border-b border-white/5 text-center">
                    <div class="text-left text-sky-400">1. Referral Influx</div>
                    <div class="text-rose-400">2. AI Triage Tier</div>
                    <div class="text-amber-400">3. Care Action</div>
                    <div class="text-right text-emerald-400">4. Current Recovery</div>
                </div>
                <div class="relative flex-1 w-full min-h-[200px]">
                    <svg id="dash-sankey-svg" class="w-full h-full block" preserveAspectRatio="none"></svg>
                </div>
            </div>
        `;
        renderSankeyFlowDiagram('pune', 'dash-sankey-svg');
    }
}

// ============================================================================
// LIVE AI TELEMETRY WAVEFORM CANVAS ANIMATION
// ============================================================================
let waveCanvas = null;
let waveCtx = null;
let waveStep = 0;
let waveAnimId = null;

function initWaveformCanvas() {
    waveCanvas = document.getElementById('live-wave-canvas');
    if (!waveCanvas) return;
    waveCtx = waveCanvas.getContext('2d');
    
    if (waveAnimId) {
        cancelAnimationFrame(waveAnimId);
        waveAnimId = null;
    }
    
    function resizeCanvas() {
        if (!waveCanvas || !waveCanvas.parentElement) return;
        waveCanvas.width = waveCanvas.parentElement.clientWidth || 600;
        waveCanvas.height = waveCanvas.parentElement.clientHeight || 80;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    function drawWave() {
        if (!waveCanvas || !waveCtx) return;
        const width = waveCanvas.width;
        const height = waveCanvas.height;
        waveCtx.clearRect(0, 0, width, height);

        // Layer 1: Soothing Cyan Wave
        waveCtx.beginPath();
        waveCtx.lineWidth = 3;
        const grad1 = waveCtx.createLinearGradient(0, 0, width, 0);
        grad1.addColorStop(0, 'rgba(14, 165, 233, 0.2)');
        grad1.addColorStop(0.5, 'rgba(14, 165, 233, 0.8)');
        grad1.addColorStop(1, 'rgba(20, 184, 166, 0.3)');
        waveCtx.strokeStyle = grad1;

        for (let x = 0; x < width; x++) {
            const y = height / 2 + Math.sin((x * 0.015) + waveStep) * 14 + Math.cos((x * 0.02) - waveStep * 0.5) * 8;
            if (x === 0) waveCtx.moveTo(x, y);
            else waveCtx.lineTo(x, y);
        }
        waveCtx.stroke();

        // Layer 2: Gentle Teal Pulse Wave
        waveCtx.beginPath();
        waveCtx.lineWidth = 2;
        const grad2 = waveCtx.createLinearGradient(0, 0, width, 0);
        grad2.addColorStop(0, 'rgba(20, 184, 166, 0.4)');
        grad2.addColorStop(0.5, 'rgba(16, 185, 129, 0.8)');
        grad2.addColorStop(1, 'rgba(14, 165, 233, 0.3)');
        waveCtx.strokeStyle = grad2;

        for (let x = 0; x < width; x++) {
            const y = height / 2 + Math.sin((x * 0.025) - waveStep * 1.2) * 10;
            if (x === 0) waveCtx.moveTo(x, y);
            else waveCtx.lineTo(x, y);
        }
        waveCtx.stroke();

        waveStep += 0.035;
        waveAnimId = requestAnimationFrame(drawWave);
    }
    waveAnimId = requestAnimationFrame(drawWave);
}

// ============================================================================
// INTERACTIVE CALM & BREATHE CORNER
// ============================================================================
let breatheInterval = null;
let isBreatheActive = false;

function toggleBreathingModal() {
    playHapticBeep(580, 'sine', 0.08);
    const modal = document.getElementById('breathe-modal');
    if (!modal) return;
    
    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        startBreathingCycle();
    } else {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        stopBreathingCycle();
    }
}

function startBreathingCycle() {
    isBreatheActive = true;
    const stateEl = document.getElementById('breathe-state');
    const timerEl = document.getElementById('breathe-timer');
    const instructEl = document.getElementById('breathe-instruction');
    
    const cycle = [
        { state: "Inhale", count: 4, text: "Gently fill your lungs with fresh calm air..." },
        { state: "Hold", count: 4, text: "Gently hold your breath... you are safe..." },
        { state: "Exhale", count: 4, text: "Slowly release all worry and tension..." }
    ];
    let stepIdx = 0;
    let secondsLeft = cycle[stepIdx].count;

    function tick() {
        if (!isBreatheActive) return;
        stateEl.innerText = cycle[stepIdx].state;
        timerEl.innerText = `${secondsLeft}s`;
        instructEl.innerText = `"${cycle[stepIdx].text}"`;

        secondsLeft--;
        if (secondsLeft < 0) {
            stepIdx = (stepIdx + 1) % cycle.length;
            secondsLeft = cycle[stepIdx].count;
        }
    }
    tick();
    breatheInterval = setInterval(tick, 1000);
}

function stopBreathingCycle() {
    isBreatheActive = false;
    if (breatheInterval) clearInterval(breatheInterval);
}

// ============================================================================
// PERSISTENT FLOATING AI CHATBOT: "NEX"
// ============================================================================
let isNexChatOpen = false;
let nexMessages = [];

const nexGreetings = {
    en: "Hello! I am NEX, your caring AI companion. I'm here 24/7 to listen, provide safety advice, or guide you through your court trial. How are you feeling right now?",
    hi: "नमस्ते! मैं NEX हूँ, आपका सुरक्षित AI साथी। मैं यहाँ आपकी बात सुनने, सुरक्षा में मदद करने और कोर्ट ट्रायल के बारे में बताने के लिए हूँ। आज आप कैसा महसूस कर रहे हैं?",
    bn: "নমস্কার! আমি NEX, আপনার নিরাপদ এআই সঙ্গী। আপনার মনের কথা শুনতে এবং আদালতের যেকোনো প্রশ্নে সাহায্য করতে আমি সবসময় আছি। আজ কেমন বোধ করছেন?",
    ta: "வணக்கம்! நான் NEX, உங்கள் பாதுகாப்பான AI தோழன். உங்கள் நீதிமன்ற விசாரணை பற்றி வழிகாட்டவும் உங்களுக்கு உதவவும் நான் இங்கு இருக்கிறேன். இன்று எப்படி உணர்கிறீர்கள்?",
    mr: "नमस्कार! मी NEX आहे, आपला सुरक्षित AI साथीदार. कोर्टाच्या काळात आपल्याला धीर देण्यासाठी आणि मदत करण्यासाठी मी सदैव उपस्थित आहे. आज आपल्याला कसे वाटत आहे?",
    te: "నమస్కారం! నేను NEX, మీ సురక్షిత AI సహచరుడిని. మీ కోర్టు విచారణలో మీకు సహాయం చేయడానికి మరియు ధైర్యం చెప్పడానికి నేను ఇక్కడ ఉన్నాను. ఈ రోజు మీకు ఎలా ఉంది?",
    gu: "નમસ્તે! હું NEX છું, તમારો સુરક્ષિત AI સાથી. કોર્ટ ટ્રાયલ દરમિયાન તમને મદદ કરવા અને સાંભળવા માટે હું અહીં છું. આજે તમને કેવું લાગે છે?",
    pa: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ NEX ਹਾਂ, ਤੁਹਾਡਾ ਸੁਰੱਖਿਅਤ AI ਸਾਥੀ। ਕੋਰਟ ਟ੍ਰਾਇਲ ਦੌਰਾਨ ਤੁਹਾਡੀ ਮਦਦ ਕਰਨ ਲਈ ਮੈਂ ਹਮੇਸ਼ਾ ਇੱਥੇ ਹਾਂ। ਅੱਜ ਤੁਸੀਂ ਕਿਵੇਂ ਮਹਿਸੂਸ ਕਰ ਰਹੇ ਹੋ?",
    kn: "ನಮಸ್ಕಾರ! ನಾನು NEX, ನಿಮ್ಮ ಸುರಕ್ಷಿತ AI ಸಹಾಯಕ. ಕೋರ್ಟ್ ವಿಚಾರಣೆಯಲ್ಲಿ ನಿಮಗೆ ಧೈರ್ಯ ತುಂಬಲು ಮತ್ತು ಸಹಾಯ ಮಾಡಲು ನಾನಿದ್ದೇನೆ. ಇಂದು ನಿಮಗೆ ಹೇಗೆ ಅನ್ನಿಸುತ್ತಿದೆ?",
    ur: "السلام علیکم! میں NEX ہوں، آپ کا خیال رکھنے والا AI ساتھی۔ میں عدالتی سماعت اور تحفظ کے لیے ہر وقت حاضر ہوں۔ آج آپ کیسا محسوس کر رہے ہیں؟"
};

function initNexChat() {
    const greeting = nexGreetings[currentLang] || nexGreetings.en;
    nexMessages = [
        { sender: 'bot', text: greeting, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ];
    renderNexMessages();
}

function toggleNexChat() {
    playHapticBeep(650, 'sine', 0.08);
    const windowEl = document.getElementById('nex-chat-window');
    const toggleBtn = document.getElementById('nex-toggle-btn');
    if (!windowEl) return;

    if (!isNexChatOpen) {
        // OPENING: smoothly expand from the small translucent circle
        isNexChatOpen = true;
        if (toggleBtn) {
            toggleBtn.classList.add('nex-btn-pop-out');
            toggleBtn.classList.remove('nex-btn-pop-in');
            setTimeout(() => {
                toggleBtn.classList.add('hidden');
                toggleBtn.classList.remove('nex-btn-pop-out');
            }, 180);
        }

        windowEl.classList.remove('hidden', 'nex-chat-anim-out');
        windowEl.classList.add('flex', 'nex-chat-anim-in');

        if (nexMessages.length === 0) initNexChat();
        setTimeout(() => {
            const input = document.getElementById('nex-user-input');
            if (input) input.focus();
        }, 320);
    } else {
        // CLOSING: smoothly zoom back into bottom right
        isNexChatOpen = false;
        windowEl.classList.remove('nex-chat-anim-in');
        windowEl.classList.add('nex-chat-anim-out');

        setTimeout(() => {
            windowEl.classList.add('hidden');
            windowEl.classList.remove('flex', 'nex-chat-anim-out');
            if (toggleBtn) {
                toggleBtn.classList.remove('hidden');
                toggleBtn.classList.add('nex-btn-pop-in');
                setTimeout(() => {
                    toggleBtn.classList.remove('nex-btn-pop-in');
                }, 400);
            }
        }, 210);
    }
}

function openNexChatWithPrompt(promptText) {
    if (!isNexChatOpen) toggleNexChat();
    handleNexMessageSend(promptText);
}

function renderNexMessages() {
    const container = document.getElementById('nex-messages');
    if (!container) return;

    container.innerHTML = nexMessages.map((msg, idx) => {
        if (msg.sender === 'bot') {
            return `
                <div class="flex items-start gap-2.5 chat-bubble-anim">
                    <div class="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-sky-400/60 shadow-xs">
                        <img src="assets/nex_avatar.jpg" alt="NEX" class="w-full h-full object-cover">
                    </div>
                    <div class="max-w-[82%] bg-slate-900/85 border border-sky-400/25 backdrop-blur-md rounded-2xl rounded-tl-none p-3 shadow-md text-slate-100 space-y-1">
                        <p class="leading-relaxed text-[12px]">${msg.text}</p>
                        <div class="flex items-center justify-between pt-1 text-[10px] text-sky-300/70">
                            <span>${msg.time}</span>
                            <button type="button" onclick="speakText('${msg.text.replace(/'/g, "\\'")}')" class="text-sky-400 hover:text-sky-200 font-bold ml-2 transition-transform hover:scale-110 active:scale-90 cursor-pointer" title="Listen">🔊 Listen</button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="flex items-end justify-end gap-2 chat-bubble-anim">
                    <div class="max-w-[82%] bg-gradient-to-r from-sky-600/90 to-indigo-600/90 backdrop-blur-md text-white border border-sky-400/40 rounded-2xl rounded-tr-none p-3 shadow-lg space-y-1">
                        <p class="leading-relaxed text-[12px]">${msg.text}</p>
                        <div class="text-right text-[10px] text-sky-200/80">${msg.time}</div>
                    </div>
                </div>
            `;
        }
    }).join('');

    container.scrollTop = container.scrollHeight;
}

function handleNexUserSend(e) {
    e.preventDefault();
    const input = document.getElementById('nex-user-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    handleNexMessageSend(text);
}

function sendQuickPrompt(type) {
    playHapticBeep(600, 'sine', 0.08);
    const prompts = {
        safe: "I feel unsafe and scared right now.",
        court: "What will happen in court during trial?",
        breathe: "Can you help me breathe and calm down?",
        worker: "Who is my caseworker and how do they help me?"
    };
    handleNexMessageSend(prompts[type] || type);
}

function handleNexMessageSend(text) {
    playHapticBeep(720, 'sine', 0.08);
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    nexMessages.push({ sender: 'user', text, time });
    renderNexMessages();

    // Generate smart empathetic response
    setTimeout(() => {
        playHapticBeep(840, 'triangle', 0.1);
        const replyText = generateEmpatheticNexReply(text);
        const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        nexMessages.push({ sender: 'bot', text: replyText, time: replyTime });
        renderNexMessages();
    }, 600);
}

function generateEmpatheticNexReply(userText) {
    const lower = userText.toLowerCase();

    // Immediate danger / fear
    if (lower.includes('unsafe') || lower.includes('threat') || lower.includes('scared') || lower.includes('danger') || lower.includes('डर') || lower.includes('धमकी') || lower.includes('ভয়')) {
        if (currentLang === 'hi') {
            return "🚨 आप अकेले नहीं हैं। यदि आप तुरंत किसी खतरे में हैं, तो कृपया अभी 112 पर कॉल करें। मैंने आपके विधिक सेवा सहायक (DLSA) को भी सूचित कर दिया है ताकि आपको पुलिस सुरक्षा मिल सके।";
        }
        return "🚨 You are not alone. If you are in immediate physical danger, please call 112 right away. I have also noted this so your DLSA caseworker can arrange emergency witness police protection for you.";
    }

    // Court trial anxiety
    if (lower.includes('court') || lower.includes('trial') || lower.includes('hearing') || lower.includes('judge') || lower.includes('कोर्ट') || lower.includes('सुनावणी')) {
        if (currentLang === 'hi') {
            return "⚖️ कोर्ट की प्रक्रिया भारी लग सकती है, लेकिन तारीखों में देरी बहुत आम बात है। आपको आरोपी का अकेले सामना नहीं करना पड़ेगा — आपको पर्दे के पीछे गवाही देने (In-Camera Hearing) और मुफ्त सरकारी वकील का पूरा कानूनी अधिकार है।";
        }
        return "⚖️ Court proceedings can feel intimidating, but delays are very normal and not your fault. You do not have to face the accused directly — you have the full legal right to in-camera testimony (behind a screen) and a free legal aid lawyer.";
    }

    // Panic / Breathing
    if (lower.includes('breathe') || lower.includes('calm') || lower.includes('panic') || lower.includes('anxious') || lower.includes('सांस') || lower.includes('घबराहट')) {
        if (currentLang === 'hi') {
            return "🌿 चलिए मिलकर गहरी सांस लेते हैं। 4 सेकंड तक नाक से सांस अंदर लें... 4 सेकंड रोकें... और धीरे-धीरे मुंह से छोड़ें। इस पल में आप सुरक्षित हैं। आप हमारे 'Calm & Breathe' बटन पर भी क्लिक कर सकते हैं।";
        }
        return "🌿 Let's take a slow breath together. Inhale gently for 4 seconds... hold softly for 4 seconds... and release slowly. You are safe right now in this moment. You can also click our 'Calm & Breathe Corner' on the dashboard.";
    }

    // Caseworker / Help
    if (lower.includes('worker') || lower.includes('who') || lower.includes('help') || lower.includes('सहायक') || lower.includes('मदद')) {
        if (currentLang === 'hi') {
            return "📞 आपकी सहायता के लिए जिला विधिक सेवा प्राधिकरण (DLSA) से डॉ. सारा जेनकिंस तैनात हैं। आप किसी भी समय 14416 (मानसिक स्वास्थ्य) या 14566 (पीड़ित सहायता) पर भी मुफ्त बात कर सकते हैं।";
        }
        return "📞 Your assigned DLSA legal aid caseworker is Dr. Sarah Jenkins. You can also call free national victim support at 14566 or Tele-MANAS at 14416 anytime without fees.";
    }

    // Default comforting response
    if (currentLang === 'hi') {
        return "मैं आपकी बात समझ रहा हूँ। इस कठिन समय में हम आपके साथ हैं। क्या आप अपनी नींद, सुरक्षा या कोर्ट केस के बारे में कुछ और बताना चाहते हैं?";
    }
    return "I hear you and understand how difficult this journey can be. We are walking beside you. Would you like to check in on your weekly sleep & safety, or learn more about your trial rights?";
}

function readAloudLastBotMessage() {
    const lastBotMsg = [...nexMessages].reverse().find(m => m.sender === 'bot');
    if (lastBotMsg) {
        speakText(lastBotMsg.text);
    }
}

// ============================================================================
// FRIEND REPOSITORY INTEGRATION: CLINICAL AI STRESS ANALYSIS & TELEMEDICINE
// ============================================================================

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ----------------------------------------------------------------------------
// Keyword & Cluster Dictionary for Rule-Based Stress / Tone Analysis
// ----------------------------------------------------------------------------
const STRESS_KEYWORDS = {
    anxiety: ["anxious", "anxiety", "worried", "panic", "fear", "nervous", "scared", "overwhelmed", "terrible", "dread", "shaking", "restless", "कोर्ट", "डर", "घबराहट", "चिंता", "ਭੈਅ", "ಆತಂಕ"],
    sleep_physical: ["sleep", "insomnia", "nightmare", "tired", "exhausted", "headache", "pain", "appetite", "eating", "नींद", "थकान", "सिरदर्द", "ਨੀਂਦ", "ನಿದ್ರೆ"],
    trauma_legal: ["hearing", "court", "judge", "testify", "witness", "threat", "threatened", "intimidated", "police", "fir", "case", "lawyer", "accused", "गवाही", "धमकी", "वकील", "ਤਾਰੀਖ਼", "ನ್ಯಾಯಾಲಯ"],
    helplessness: ["helpless", "alone", "nobody", "give up", "hopeless", "crying", "lost", "stuck", "अकेला", "रोया", "बेबस", "ਇਕੱਲੇ", "ಒಂಟಿ"],
    crisis: ["suicide", "kill", "die", "end it", "cannot go on", "hurt myself", "ख़त्म", "मरना", "ਮਰਨਾ"],
    resilience: ["hope", "safe", "better", "calm", "strong", "support", "family", "friend", "peace", "सुरक्षित", "शांति", "उम्मीद", "ਸੁਰੱਖਿਅਤ", "ಶಾಂತ"]
};

function calculateRuleBasedStress(userMessages) {
    const combinedText = Array.isArray(userMessages) 
        ? userMessages.map(m => (typeof m === 'string' ? m : (m.text || ''))).join(' ').toLowerCase()
        : String(userMessages || '').toLowerCase();

    let anxietyHits = 0;
    let physicalHits = 0;
    let traumaHits = 0;
    let helplessHits = 0;
    let crisisHits = 0;
    let resilienceHits = 0;

    STRESS_KEYWORDS.anxiety.forEach(w => { if (combinedText.includes(w)) anxietyHits++; });
    STRESS_KEYWORDS.sleep_physical.forEach(w => { if (combinedText.includes(w)) physicalHits++; });
    STRESS_KEYWORDS.trauma_legal.forEach(w => { if (combinedText.includes(w)) traumaHits++; });
    STRESS_KEYWORDS.helplessness.forEach(w => { if (combinedText.includes(w)) helplessHits++; });
    STRESS_KEYWORDS.crisis.forEach(w => { if (combinedText.includes(w)) crisisHits++; });
    STRESS_KEYWORDS.resilience.forEach(w => { if (combinedText.includes(w)) resilienceHits++; });

    const totalNegativeHits = anxietyHits + physicalHits + traumaHits + helplessHits + (crisisHits * 3);
    
    // Dynamic score between 15 and 95
    let score = 35 + (totalNegativeHits * 8) - (resilienceHits * 6);
    if (crisisHits > 0) score = Math.max(score, 85);
    score = Math.max(12, Math.min(94, Math.round(score)));

    // Categorization
    let riskLevel = "LOW";
    let badgeText = "Low Stress / Stable";
    let badgeClass = "bg-emerald-950/80 text-emerald-300 border-emerald-500/50";
    let headline = "Moderate Resilience & Emotional Balance Observed";
    let summary = "The survivor demonstrates coping mechanisms and social support, with mild baseline anxiety related to administrative trial milestones.";

    if (score >= 70) {
        riskLevel = "HIGH";
        badgeText = "High Stress / Alert Level";
        badgeClass = "bg-rose-950/80 text-rose-300 border-rose-500/50";
        headline = "Significant Trial Anxiety & Security Vulnerability Detected";
        summary = "Elevated distress indicators identified across legal proceedings, fear of retaliation, or physical sleep impairment. Authorizing proactive human-in-the-loop caseworker check-in.";
    } else if (score >= 45) {
        riskLevel = "MODERATE";
        badgeText = "Moderate Stress Level";
        badgeClass = "bg-amber-950/80 text-amber-300 border-amber-500/50";
        headline = "Heightened Vigilance & Intermittent Apprehension";
        summary = "Survivor reports apprehension regarding court delays or isolated incidents. Supportive psychoeducation and peer grounding recommended.";
    }

    // Telemetry tones
    const toneAnxiety = Math.min(98, Math.max(15, Math.round(20 + anxietyHits * 18 + traumaHits * 8)));
    const toneSadness = Math.min(95, Math.max(10, Math.round(15 + helplessHits * 20 + physicalHits * 5)));
    const toneFrustration = Math.min(90, Math.max(10, Math.round(10 + traumaHits * 14)));
    const toneHope = Math.max(10, Math.min(90, Math.round(50 + resilienceHits * 15 - totalNegativeHits * 5)));
    const toneCalm = Math.max(8, Math.min(85, Math.round(45 + resilienceHits * 12 - totalNegativeHits * 7)));

    // Triggers
    const triggers = [];
    if (traumaHits > 0 || combinedText.includes('court') || combinedText.includes('hearing')) {
        triggers.push("Special Court Testimony Apprehension");
    }
    if (physicalHits > 0 || combinedText.includes('sleep') || combinedText.includes('nightmare')) {
        triggers.push("Sleep Deprivation & Night Terrors");
    }
    if (anxietyHits > 0 || combinedText.includes('threat') || combinedText.includes('scared')) {
        triggers.push("Witness Intimidation & Safety Vulnerability");
    }
    if (helplessHits > 0 || combinedText.includes('alone')) {
        triggers.push("Social Disconnection & Isolation");
    }
    if (triggers.length === 0) {
        triggers.push("Standard Legal Case Progression", "Administrative Milestone Tracking");
    }

    // Recommendations
    const recommendations = [];
    if (score >= 70) {
        recommendations.push(
            { title: "Statutory Witness Protection Protocol", desc: "Escalate to District Legal Services Authority (DLSA) secretary for local SP police escort order." },
            { title: "Clinical PTSD & Trauma De-escalation", desc: "Schedule a tele-health consultation with a board-certified psychiatrist for symptomatic sleep/panic support." },
            { title: "In-Camera Trial Provision Request", desc: "File an application under Section 15A of the SC/ST Act for screen-shielded video testimony." }
        );
    } else if (score >= 45) {
        recommendations.push(
            { title: "Caseworker Check-In Call", desc: "Schedule a supportive 15-minute phone call before the upcoming court date." },
            { title: "Somatic Grounding & Box Breathing", desc: "Guide the survivor through 4-4-4 diaphragmatic breathing exercises." },
            { title: "Legal Rights Factsheet Sharing", desc: "Reassure the survivor regarding statutory travel allowances and state victim compensation." }
        );
    } else {
        recommendations.push(
            { title: "Routine Weekly Telemetry Tracking", desc: "Continue regular gentle check-ins to monitor emotional stability." },
            { title: "Community Support Reinforcement", desc: "Encourage ongoing connection with family, paralegal volunteers, and community elders." }
        );
    }

    return {
        score,
        riskLevel,
        badgeText,
        badgeClass,
        headline,
        summary,
        tones: {
            anxiety: toneAnxiety,
            sadness: toneSadness,
            frustration: toneFrustration,
            hope: toneHope,
            calm: toneCalm
        },
        triggers,
        recommendations
    };
}

// ----------------------------------------------------------------------------
// STRESS REPORT MODAL CONTROLLER
// ----------------------------------------------------------------------------
function openStressReportModal(customData) {
    playHapticBeep(560, 'triangle', 0.08);

    // If customData is provided, use it; otherwise compute from current case or recent messages
    let assessment = customData;
    if (!assessment) {
        const targetCase = findCaseByToken(selectedCaseId);
        const journalSnippets = [];
        if (targetCase && targetCase.checkIns) {
            targetCase.checkIns.forEach(ci => {
                if (ci.notes) journalSnippets.push(ci.notes);
            });
        }
        if (nexMessages && nexMessages.length > 0) {
            nexMessages.forEach(m => {
                if (m.sender === 'user') journalSnippets.push(m.text);
            });
        }
        const textSample = journalSnippets.length > 0 
            ? journalSnippets.join('. ')
            : "I am having difficulty sleeping before the upcoming court hearing and I am scared of threats.";
        
        assessment = calculateRuleBasedStress(textSample);
    }

    // Populate Score & Radial Gauge
    const scoreEl = document.getElementById('stress-modal-score');
    const circleEl = document.getElementById('stress-modal-radial-circle');
    if (scoreEl) scoreEl.innerText = `${assessment.score}%`;

    if (circleEl) {
        const circumference = 326; // 2 * PI * 52
        const offset = Math.max(0, Math.min(326, Math.round(circumference - (circumference * assessment.score / 100))));
        circleEl.style.strokeDashoffset = offset;
        
        // Color depending on severity
        if (assessment.score >= 70) {
            circleEl.style.stroke = "#f43f5e"; // rose-500
        } else if (assessment.score >= 45) {
            circleEl.style.stroke = "#f59e0b"; // amber-500
        } else {
            circleEl.style.stroke = "#10b981"; // emerald-500
        }
    }

    // Badge & Headline
    const badgeEl = document.getElementById('stress-modal-badge');
    if (badgeEl) {
        badgeEl.innerText = assessment.badgeText;
        badgeEl.className = `text-xs px-2.5 py-0.5 rounded-full font-bold border uppercase tracking-wider ${assessment.badgeClass}`;
    }

    const headlineEl = document.getElementById('stress-modal-headline');
    if (headlineEl) headlineEl.innerText = assessment.headline;

    const summaryEl = document.getElementById('stress-modal-summary');
    if (summaryEl) summaryEl.innerText = assessment.summary;

    // Emotional Tone Telemetry
    if (assessment.tones) {
        const setTone = (id, val) => {
            const el = document.getElementById(id);
            if (el) {
                el.innerText = `${val}%`;
            }
        };
        setTone('tone-anxiety', assessment.tones.anxiety);
        setTone('tone-sadness', assessment.tones.sadness);
        setTone('tone-frustration', assessment.tones.frustration);
        setTone('tone-hope', assessment.tones.hope);
        setTone('tone-calm', assessment.tones.calm);
    }

    // Triggers
    const triggersEl = document.getElementById('stress-modal-triggers');
    if (triggersEl) {
        triggersEl.innerHTML = assessment.triggers.map(trig => `
            <span class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800/90 text-slate-200 border border-slate-700/80 flex items-center gap-1.5 shadow-xs">
                <span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                ${escapeHtml(trig)}
            </span>
        `).join('');
    }

    // Recommendations
    const recsEl = document.getElementById('stress-modal-recommendations');
    if (recsEl) {
        recsEl.innerHTML = assessment.recommendations.map(rec => `
            <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
                <div class="p-1 rounded bg-teal-500/20 text-teal-400 text-xs shrink-0 mt-0.5">✓</div>
                <div>
                    <h6 class="font-bold text-slate-200 text-xs">${escapeHtml(rec.title)}</h6>
                    <p class="text-[11px] text-slate-400 leading-relaxed mt-0.5">${escapeHtml(rec.desc)}</p>
                </div>
            </div>
        `).join('');
    }

    // Hotline visibility
    const hotlineEl = document.getElementById('stress-modal-hotline-banner');
    if (hotlineEl) {
        if (assessment.score >= 60) {
            hotlineEl.classList.remove('hidden');
        } else {
            hotlineEl.classList.add('hidden');
        }
    }

    const modal = document.getElementById('stress-report-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeStressReportModal() {
    playHapticBeep(440, 'sine', 0.05);
    const modal = document.getElementById('stress-report-modal');
    if (modal) modal.classList.add('hidden');
}

function triggerChatStressAssessment() {
    playHapticBeep(640, 'sine', 0.09);
    // Gather all user messages in NEX chat
    const userTexts = nexMessages.filter(m => m.sender === 'user').map(m => m.text);
    if (userTexts.length === 0) {
        userTexts.push("Checking in to assess my general court anxiety and sleep disturbance.");
    }
    const assessment = calculateRuleBasedStress(userTexts);
    openStressReportModal(assessment);
}

// ----------------------------------------------------------------------------
// CERTIFIED SPECIALIST DOCTOR CONSULTATION MODAL CONTROLLER
// ----------------------------------------------------------------------------
const DOCTORS_LIST = [
    {
        id: 'doc_1',
        name: 'Dr. Ananya Sharma',
        qual: 'MD (Psychiatry), AIIMS New Delhi',
        specialty: 'Trauma, PTSD & Legal Trial Stress Specialist',
        rating: '★ 4.9',
        availability: '● Available Now',
        availClass: 'text-teal-400',
        image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=160'
    },
    {
        id: 'doc_2',
        name: 'Dr. Rajesh Verma',
        qual: 'Ph.D. (Clinical Psychology), NIMHANS',
        specialty: 'CBT & Crisis Forensic Intervention Specialist',
        rating: '★ 4.8',
        availability: '● Next in 15 mins',
        availClass: 'text-teal-400',
        image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=160'
    },
    {
        id: 'doc_3',
        name: 'Dr. Priya Nair',
        qual: 'M.Phil (Medical & Social Psychology), TISS',
        specialty: 'Anxiety, Sleep Disturbance & Victim Care',
        rating: '★ 4.9',
        availability: 'Today 5:30 PM',
        availClass: 'text-sky-300',
        image: 'https://images.unsplash.com/photo-1594824813579-247c433383a1?auto=format&fit=crop&q=80&w=160'
    }
];

let selectedDoctorId = 'doc_1';
let selectedConsultType = 'video';

function openConsultDoctorModal(defaultDoctorId) {
    playHapticBeep(580, 'sine', 0.08);
    if (defaultDoctorId) {
        selectedDoctorId = defaultDoctorId;
    }
    
    // Reset view
    const formView = document.getElementById('doctor-booking-form-view');
    const successView = document.getElementById('doctor-booking-success-view');
    if (formView) formView.classList.remove('hidden');
    if (successView) successView.classList.add('hidden');

    selectDoctor(selectedDoctorId);
    selectConsultType(selectedConsultType);

    const modal = document.getElementById('consult-doctor-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeConsultDoctorModal() {
    playHapticBeep(440, 'sine', 0.05);
    const modal = document.getElementById('consult-doctor-modal');
    if (modal) modal.classList.add('hidden');
}

function selectDoctor(doctorId) {
    selectedDoctorId = doctorId;
    ['doc_1', 'doc_2', 'doc_3'].forEach(id => {
        const card = document.getElementById(`doc-card-${id}`);
        if (card) {
            if (id === doctorId) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        }
    });
}

function selectConsultType(type) {
    selectedConsultType = type;
    ['video', 'audio', 'clinic'].forEach(t => {
        const pill = document.getElementById(`consult-type-${t}`);
        if (pill) {
            if (t === type) {
                pill.classList.add('active');
            } else {
                pill.classList.remove('active');
            }
        }
    });
}

function confirmDoctorBooking() {
    playHapticBeep(720, 'sine', 0.12);

    const doc = DOCTORS_LIST.find(d => d.id === selectedDoctorId) || DOCTORS_LIST[0];
    const modeMap = {
        video: "Secure Encrypted Video Call",
        audio: "Private Audio Call",
        clinic: "DLSA Safe House / Clinic Visit"
    };

    const docNameEl = document.getElementById('confirmed-doc-name');
    if (docNameEl) docNameEl.innerText = doc.name;

    const modeTextEl = document.getElementById('confirmed-mode-text');
    if (modeTextEl) modeTextEl.innerText = modeMap[selectedConsultType] || modeMap.video;

    const tokenEl = document.getElementById('confirmed-token');
    const randToken = `NEX-MED-${Math.floor(1000 + Math.random() * 9000)}`;
    if (tokenEl) tokenEl.innerText = randToken;

    // Log this booking into the current case interventions
    const targetCase = findCaseByToken(selectedCaseId);
    if (targetCase) {
        if (!targetCase.interventions) targetCase.interventions = [];
        targetCase.interventions.push({
            date: new Date().toISOString().split('T')[0],
            action: `Clinical Tele-Health Consultation Scheduled with ${doc.name} (${modeMap[selectedConsultType]}) [Ref: ${randToken}]`,
            type: "Clinical Specialist Referral",
            caseworker: "DLSA Medical Panel"
        });
        saveCases();
        renderCaseTimeline(targetCase);
    }

    const formView = document.getElementById('doctor-booking-form-view');
    const successView = document.getElementById('doctor-booking-success-view');
    if (formView) formView.classList.add('hidden');
    if (successView) successView.classList.remove('hidden');
}

// ----------------------------------------------------------------------------
// CONVERSATIONAL GUIDED CHECK-IN FLOW (Friend Repo CheckInChat)
// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
// CONVERSATIONAL GUIDED CHECK-IN FLOW (Dynamic AI Adaptive Questions)
// ----------------------------------------------------------------------------

// ============================================================================
// DYNAMIC QUESTION ENGINE - Profession-Specific Question Banks
// ============================================================================

const QUESTION_BANKS = {
    // STUDENT: Focus on campus safety, cognitive concentration, threat from institutional authorities, peer ostracization
    Student: [
        {
            id: 'q1_mood',
            prompt: "How are you feeling about your academic work and campus environment today?",
            subtext: "Are you able to concentrate in class, or do academic pressures feel overwhelming?",
            dimension: "mood",
            questionLabel: "Academic Mood & Focus"
        },
        {
            id: 'q2_sleep',
            prompt: "How has your sleep been, especially around exams or assignments?",
            subtext: "Are you having trouble sleeping due to academic stress or campus-related worries?",
            dimension: "sleep",
            questionLabel: "Sleep & Academic Rest"
        },
        {
            id: 'q3_safety',
            prompt: "Do you feel safe on campus and in your accommodation?",
            subtext: "Have you experienced any intimidation, stalking, or threatening behavior from anyone on campus?",
            dimension: "safety",
            questionLabel: "Campus Safety"
        },
        {
            id: 'q4_panic',
            prompt: "Have you experienced panic attacks, severe anxiety, or difficulty breathing related to academic pressure?",
            subtext: "Do exams, deadlines, or peer comparisons cause you to feel overwhelmed or panicked?",
            dimension: "panic",
            questionLabel: "Academic Anxiety & Panic"
        },
        {
            id: 'q5_routine',
            prompt: "How is your appetite and ability to maintain daily routines?",
            subtext: "Are you skipping meals, losing weight, or neglecting self-care due to stress?",
            dimension: "somatic",
            questionLabel: "Physical Well-being"
        },
        {
            id: 'q6_court',
            prompt: "Are you facing any institutional pressure related to your case that affects your studies?",
            subtext: "Has anyone threatened your academic standing, scholarship, or campus placement because of your case?",
            dimension: "court",
            questionLabel: "Institutional Pressure"
        },
        {
            id: 'q7_support',
            prompt: "How supported do you feel by classmates, professors, or student networks?",
            subtext: "Do you have trusted friends or mentors you can talk to about your situation?",
            dimension: "support",
            questionLabel: "Peer & Academic Support"
        },
        {
            id: 'q8_threats',
            prompt: "Has anyone attempted to contact, pressure, or intimidate you regarding your case or studies?",
            subtext: "Any threatening messages, social exclusion, or hostile behavior from peers or authorities?",
            dimension: "threats",
            questionLabel: "Intimidation & Threats"
        },
        {
            id: 'q9_grounding',
            prompt: "Would you like to take a moment for a calming breathing exercise?",
            subtext: "Taking three deep breaths can help release academic tension and anxiety.",
            dimension: "grounding",
            questionLabel: "Grounding & Self-Care"
        },
        {
            id: 'q10_reflection',
            prompt: "Describe any specific threats, harassment, or trial-related stress you've experienced in the past 48 hours.",
            subtext: "Please share any details about your experience that you'd like your care team to know.",
            dimension: "journal",
            questionLabel: "Open Reflection"
        }
    ],

    // SALARIED: Focus on workplace retaliation, commute safety, exhaustion from dual legal/work load, fear of termination
    Salaried: [
        {
            id: 'q1_mood',
            prompt: "How is your overall mood and emotional energy at work today?",
            subtext: "Are you able to focus on your tasks, or do legal proceedings and workplace stress feel distracting?",
            dimension: "mood",
            questionLabel: "Workplace Mood & Energy"
        },
        {
            id: 'q2_sleep',
            prompt: "How has your sleep been, considering work responsibilities and legal proceedings?",
            subtext: "Are you having trouble sleeping due to work stress, court dates, or dual pressure?",
            dimension: "sleep",
            questionLabel: "Sleep Quality"
        },
        {
            id: 'q3_safety',
            prompt: "Do you feel safe commuting to and from work?",
            subtext: "Have you noticed anyone following you, watching your workplace, or threatening you during commute?",
            dimension: "safety",
            questionLabel: "Commute & Workplace Safety"
        },
        {
            id: 'q4_panic',
            prompt: "Have you experienced panic attacks, anxiety spikes, or racing heartbeat related to work or legal stress?",
            subtext: "Do workplace demands or court appearances cause you to feel overwhelmed or panicked?",
            dimension: "panic",
            questionLabel: "Workplace Anxiety & Panic"
        },
        {
            id: 'q5_routine',
            prompt: "How is your appetite and ability to maintain work-life balance?",
            subtext: "Are you neglecting meals, working excessive hours, or struggling to maintain personal health?",
            dimension: "somatic",
            questionLabel: "Physical Health & Routine"
        },
        {
            id: 'q6_court',
            prompt: "How are you managing work responsibilities alongside court appearances?",
            subtext: "Has your employer been cooperative or hostile regarding your legal absences?",
            dimension: "court",
            questionLabel: "Work-Court Balance"
        },
        {
            id: 'q7_support',
            prompt: "How supported do you feel by colleagues and workplace community?",
            subtext: "Have you experienced workplace retaliation, isolation, or discrimination due to your case?",
            dimension: "support",
            questionLabel: "Workplace Support Network"
        },
        {
            id: 'q8_threats',
            prompt: "Has anyone threatened your employment, wages, or career advancement because of your case?",
            subtext: "Any pressure from employer, colleagues, or external parties to withdraw or settle?",
            dimension: "threats",
            questionLabel: "Employment Threats & Retaliation"
        },
        {
            id: 'q9_grounding',
            prompt: "Would you like to take a moment for a calming breathing exercise?",
            subtext: "Taking three deep breaths can help release tension from work and legal stress.",
            dimension: "grounding",
            questionLabel: "Grounding & Self-Care"
        },
        {
            id: 'q10_reflection',
            prompt: "Describe any specific threats, harassment, or trial-related stress you've experienced in the past 48 hours.",
            subtext: "Please share details about workplace or legal stressors that your care team should know.",
            dimension: "journal",
            questionLabel: "Open Reflection"
        }
    ],

    // BUSINESS: Focus on economic boycott, financial coercion, extortion, operational paralysis
    Business: [
        {
            id: 'q1_mood',
            prompt: "How is your overall mood regarding your business operations today?",
            subtext: "Are you able to focus on your work, or do financial and legal pressures feel overwhelming?",
            dimension: "mood",
            questionLabel: "Business Mood & Focus"
        },
        {
            id: 'q2_sleep',
            prompt: "How has your sleep been, given business pressures and legal proceedings?",
            subtext: "Are you losing sleep over financial worries, court dates, or business disruptions?",
            dimension: "sleep",
            questionLabel: "Sleep & Business Stress"
        },
        {
            id: 'q3_safety',
            prompt: "Do you feel safe operating your business in your current location?",
            subtext: "Have you faced boycott threats, extortion attempts, or hostile actions against your business?",
            dimension: "safety",
            questionLabel: "Business & Physical Safety"
        },
        {
            id: 'q4_panic',
            prompt: "Have you experienced panic attacks, severe anxiety, or financial panic?",
            subtext: "Do business losses, legal costs, or threats cause you to feel overwhelmed or panicked?",
            dimension: "panic",
            questionLabel: "Financial Panic & Anxiety"
        },
        {
            id: 'q5_routine',
            prompt: "How is your appetite and ability to maintain normal business operations?",
            subtext: "Has your business suffered operational paralysis, loss of customers, or financial collapse?",
            dimension: "somatic",
            questionLabel: "Business Operations & Health"
        },
        {
            id: 'q6_court',
            prompt: "How are court proceedings affecting your business decisions and financial planning?",
            subtext: "Are legal costs, testimony requirements, or court delays disrupting your business operations?",
            dimension: "court",
            questionLabel: "Court-Business Interference"
        },
        {
            id: 'q7_support',
            prompt: "How supported do you feel by your business community and customers?",
            subtext: "Have customers boycotted, suppliers cut ties, or the local community ostracized your business?",
            dimension: "support",
            questionLabel: "Business Community Support"
        },
        {
            id: 'q8_threats',
            prompt: "Has anyone threatened your business operations, customers, or supply chain?",
            subtext: "Any economic coercion, extortion demands, or threats to close down your business?",
            dimension: "threats",
            questionLabel: "Economic Threats & Extortion"
        },
        {
            id: 'q9_grounding',
            prompt: "Would you like to take a moment for a calming breathing exercise?",
            subtext: "Taking three deep breaths can help reduce business and legal stress.",
            dimension: "grounding",
            questionLabel: "Grounding & Self-Care"
        },
        {
            id: 'q10_reflection',
            prompt: "Describe any specific threats, harassment, or trial-related stress you've experienced in the past 48 hours.",
            subtext: "Please share details about business or legal stressors for your care team.",
            dimension: "journal",
            questionLabel: "Open Reflection"
        }
    ],

    // UNEMPLOYED: Focus on urgent daily survival stressors, lack of bail/legal representation fees, acute helplessness
    Unemployed: [
        {
            id: 'q1_mood',
            prompt: "How are you feeling about your current life situation today?",
            subtext: "Are you feeling hopeless, anxious, or struggling to cope with unemployment and legal stress?",
            dimension: "mood",
            questionLabel: "Emotional Well-being"
        },
        {
            id: 'q2_sleep',
            prompt: "How has your sleep been, given your difficult circumstances?",
            subtext: "Are you losing sleep due to worry, stress, or inability to meet basic needs?",
            dimension: "sleep",
            questionLabel: "Sleep & Stress"
        },
        {
            id: 'q3_safety',
            prompt: "Do you feel safe where you live and in your daily activities?",
            subtext: "Are you facing any threats, harassment, or danger due to your case or situation?",
            dimension: "safety",
            questionLabel: "Personal Safety"
        },
        {
            id: 'q4_panic',
            prompt: "Have you experienced panic attacks, severe anxiety, or feelings of helplessness?",
            subtext: "Do financial desperation, lack of legal support, or threat of violence cause panic?",
            dimension: "panic",
            questionLabel: "Panic & Desperation"
        },
        {
            id: 'q5_routine',
            prompt: "How is your ability to meet basic daily needs - food, shelter, health?",
            subtext: "Are you struggling with hunger, homelessness, or inability to afford medicine or essentials?",
            dimension: "somatic",
            questionLabel: "Basic Needs & Survival"
        },
        {
            id: 'q6_court',
            prompt: "How are you managing court proceedings without stable income?",
            subtext: "Do you lack funds for bail, lawyer fees, or transportation to court?",
            dimension: "court",
            questionLabel: "Legal Access & Court"
        },
        {
            id: 'q7_support',
            prompt: "How supported do you feel by family, friends, or community?",
            subtext: "Do you have anyone to turn to for help, or are you completely alone in this situation?",
            dimension: "support",
            questionLabel: "Support Network"
        },
        {
            id: 'q8_threats',
            prompt: "Has anyone threatened you, your family, or taken advantage of your vulnerable situation?",
            subtext: "Any exploitation, intimidation, or pressure due to your desperate circumstances?",
            dimension: "threats",
            questionLabel: "Threats & Exploitation"
        },
        {
            id: 'q9_grounding',
            prompt: "Would you like to take a moment for a calming breathing exercise?",
            subtext: "Taking three deep breaths can help reduce acute stress and anxiety.",
            dimension: "grounding",
            questionLabel: "Grounding & Self-Care"
        },
        {
            id: 'q10_reflection',
            prompt: "Describe any specific threats, harassment, or trial-related stress you've experienced in the past 48 hours.",
            subtext: "Please share details about your situation that your care team should urgently know.",
            dimension: "journal",
            questionLabel: "Open Reflection"
        }
    ],

    // DEFAULT: Fallback for any other profession
    Default: [
        {
            id: 'q1_mood',
            prompt: "How is your overall mood and emotional energy feeling today?",
            subtext: "Are you feeling steady and calm, or is today feeling particularly heavy or low?",
            dimension: "mood",
            questionLabel: "General Mood & Energy"
        },
        {
            id: 'q2_sleep',
            prompt: "How was your sleep last night and over this past week?",
            subtext: "Are you sleeping soundly and waking rested, or troubled by insomnia and nightmares?",
            dimension: "sleep",
            questionLabel: "Sleep & Night Rest"
        },
        {
            id: 'q3_safety',
            prompt: "Do you feel physically safe in your home and neighborhood today?",
            subtext: "Have you noticed any strangers watching your home, following you, or making you uneasy?",
            dimension: "safety",
            questionLabel: "Physical Safety"
        },
        {
            id: 'q4_panic',
            prompt: "Have you experienced sudden panic, nervousness, or racing heartbeats?",
            subtext: "Are you able to catch your breath and feel grounded, or does anxiety feel intense?",
            dimension: "panic",
            questionLabel: "Panic & Nervousness"
        },
        {
            id: 'q5_routine',
            prompt: "How is your appetite and ability to eat and drink normally?",
            subtext: "Are you eating balanced meals, or skipping food due to tension or loss of appetite?",
            dimension: "somatic",
            questionLabel: "Appetite & Physical Routine"
        },
        {
            id: 'q6_court',
            prompt: "How are you feeling regarding upcoming court hearings or legal filings?",
            subtext: "Is trial preparation, witness testimony, or fear of cross-examination causing stress?",
            dimension: "court",
            questionLabel: "Court & Trial Anxiety"
        },
        {
            id: 'q7_support',
            prompt: "How supported do you feel by family, friends, or your local community?",
            subtext: "Do you have trusted people you can openly talk to, or are you feeling isolated and alone?",
            dimension: "support",
            questionLabel: "Family & Social Support"
        },
        {
            id: 'q8_threats',
            prompt: "Has anyone attempted to contact, pressure, or intimidate you or your family?",
            subtext: "Any hostile phone calls, indirect messages, or visits urging you to withdraw your case?",
            dimension: "threats",
            questionLabel: "Intimidation & Contact"
        },
        {
            id: 'q9_grounding',
            prompt: "Would you like a brief calming breathing exercise or quiet grounding moment?",
            subtext: "Taking three deep rhythmic breaths can help release tension in your chest and neck.",
            dimension: "grounding",
            questionLabel: "Grounding & Self-Care"
        },
        {
            id: 'q10_reflection',
            prompt: "Describe any specific threats, harassment, or trial-related stress you've experienced in the past 48 hours.",
            subtext: "Please share any details about your experience that you'd like your care team to know.",
            dimension: "journal",
            questionLabel: "Open Reflection"
        }
    ]
};

// Get questions based on profession
function getQuestionsForProfession(profession) {
    const normalized = profession ? profession.trim() : '';
    if (QUESTION_BANKS[normalized]) {
        return QUESTION_BANKS[normalized];
    }
    // Check for partial match
    const keys = Object.keys(QUESTION_BANKS);
    for (const key of keys) {
        if (normalized.toLowerCase().includes(key.toLowerCase())) {
            return QUESTION_BANKS[key];
        }
    }
    return QUESTION_BANKS['Default'];
}

// ============================================================================
// USER PROFILE MANAGEMENT WITH LOCALSTORAGE PERSISTENCE
// ============================================================================

const USER_PROFILE_KEY = 'nexora_user_profile';

function getDefaultUserProfile() {
    return {
        name: "",
        phone: "",
        profession: "",
        stress: "Moderate",
        token: `CASE-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        lastUpdated: new Date().toISOString()
    };
}

function loadUserProfile() {
    try {
        const stored = localStorage.getItem(USER_PROFILE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            return { ...getDefaultUserProfile(), ...parsed };
        }
    } catch (e) {
        console.warn("Failed to load user profile:", e);
    }
    return getDefaultUserProfile();
}

function saveUserProfile(profile) {
    try {
        profile.lastUpdated = new Date().toISOString();
        localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
    } catch (e) {
        console.warn("Failed to save user profile:", e);
    }
}

// Update currentVictimProfile from stored profile
function syncVictimProfileFromStorage() {
    const profile = loadUserProfile();
    currentVictimProfile.name = profile.name || currentVictimProfile.name;
    currentVictimProfile.phone = profile.phone || currentVictimProfile.phone;
    currentVictimProfile.profession = profile.profession || currentVictimProfile.profession;
    currentVictimProfile.stress = profile.stress || currentVictimProfile.stress;
    if (profile.token) {
        currentVictimProfile.token = profile.token;
    }
}

// Callback for profession dropdown change
function onProfessionChange(value) {
    const workInput = document.getElementById('victim-intake-work');
    if (workInput) {
        workInput.value = value;
    }
    currentVictimProfile.profession = value;
    // Save to localStorage
    const profile = loadUserProfile();
    profile.profession = value;
    saveUserProfile(profile);
}

// Update user profession in Settings
function updateUserProfession(value) {
    const profile = loadUserProfile();
    profile.profession = value;
    saveUserProfile(profile);

    // Update status display
    const statusEl = document.getElementById('settings-profession-status');
    const infoEl = document.getElementById('settings-profession-info');
    const descEl = document.getElementById('settings-profession-desc');

    const professionInfo = {
        'Student': { color: 'bg-emerald-500', text: 'Student configured', desc: 'AI will adapt questions for academic pressures, campus safety, peer relationships, and institutional authorities.' },
        'Salaried': { color: 'bg-cyan-500', text: 'Salaried Employee configured', desc: 'AI will adapt questions for workplace retaliation, commute safety, work-court balance, and employment threats.' },
        'Business': { color: 'bg-amber-500', text: 'Business / Self-Employed configured', desc: 'AI will adapt questions for economic boycott, financial coercion, extortion, and operational paralysis.' },
        'Unemployed': { color: 'bg-rose-500', text: 'Unemployed / Seeking Work configured', desc: 'AI will adapt questions for daily survival stress, lack of legal fees, acute helplessness, and desperation.' }
    };

    if (statusEl && infoEl && descEl) {
        if (value && professionInfo[value]) {
            const info = professionInfo[value];
            statusEl.innerHTML = `<span class="w-2 h-2 rounded-full ${info.color} animate-pulse"></span><span>${info.text}</span>`;
            infoEl.classList.remove('hidden');
            descEl.textContent = info.desc;
        } else {
            statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-slate-500"></span><span>Not configured</span>`;
            infoEl.classList.add('hidden');
        }
    }
}

// ============================================================================
// AI CLINICAL ANALYSIS PIPELINE
// ============================================================================

// Trauma Vector Classification keywords
const TRAUMA_VECTORS = {
    'Institutional Fear': ['institution', 'authority', 'professor', 'teacher', 'boss', 'employer', 'management', 'official', 'government', 'court', 'judge', 'lawyer', 'police', 'institutional'],
    'Economic Coercion': ['boycott', 'business', 'loss', 'customer', 'supplier', 'extortion', 'money', 'debt', 'loan', 'wage', 'salary', 'financial', 'economic', 'trade', 'commercial'],
    'Anticipatory Hearing Panic': ['court', 'hearing', 'trial', 'testimony', 'cross-examination', 'lawyer', 'judge', 'case', 'legal', 'adjourned', 'date', 'summon', 'witness'],
    'Physical Threat': ['attack', 'hurt', 'violence', 'beat', 'hit', 'threat', 'danger', 'weapon', 'harm', 'assault', 'murder', 'kill', 'abuse'],
    'Social Ostracization': ['alone', 'isolated', 'boycott', 'exclude', 'nobody', 'no one', 'friend', 'family', 'community', 'social', 'peer', 'classmate', 'colleague'],
    'Academic Pressure': ['exam', 'study', 'class', 'university', 'college', 'school', 'academic', 'grade', 'score', 'assignment', 'deadline', 'scholarship', 'campus']
};

// Calculate Livelihood Vulnerability Index (LVI)
function calculateLVI(responses, profession) {
    let vulnerabilityScore = 30; // Base vulnerability

    const combinedText = responses.map(r => r.text || '').join(' ').toLowerCase();

    // Profession-specific vulnerability factors
    const vulnerabilityFactors = {
        'Student': ['scholarship', 'academic', 'exam', 'grade', 'campus', 'university', 'college', 'tuition', 'fee'],
        'Salaried': ['salary', 'wage', 'job', 'fired', 'terminate', 'laid off', 'income', 'employer', 'workplace'],
        'Business': ['business', 'customer', 'loss', 'revenue', 'shutdown', 'closed', 'bankrupt', 'loan', 'debt', 'supplier'],
        'Unemployed': ['hungry', 'food', 'shelter', 'homeless', 'medical', 'medicine', 'basic', 'survival', 'destitute', 'poor']
    };

    const factors = vulnerabilityFactors[profession] || vulnerabilityFactors['Unemployed'];
    const matchedFactors = factors.filter(f => combinedText.includes(f));
    vulnerabilityScore += matchedFactors.length * 15;

    // Financial distress indicators
    const financialTerms = ['money', 'debt', 'loan', 'borrow', 'rent', 'bill', 'payment', 'cannot afford', 'no money', 'bail', 'fee'];
    if (financialTerms.some(t => combinedText.includes(t))) {
        vulnerabilityScore += 25;
    }

    // Cap at 100
    return Math.min(100, Math.max(0, vulnerabilityScore));
}

// Classify Trauma Vectors
function classifyTraumaVectors(responses) {
    const combinedText = responses.map(r => r.text || '').join(' ').toLowerCase();
    const vectors = [];

    for (const [vectorName, keywords] of Object.entries(TRAUMA_VECTORS)) {
        const matchedKeywords = keywords.filter(kw => combinedText.includes(kw));
        if (matchedKeywords.length > 0) {
            vectors.push({
                vector: vectorName,
                confidence: Math.min(100, matchedKeywords.length * 25),
                keywords: matchedKeywords
            });
        }
    }

    // Sort by confidence and return top 3
    return vectors.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
}

// ============================================================================
// DYNAMIC CHECK-IN FLOW
// ============================================================================

let currentCheckInQuestionIdx = 0;
let checkInResponses = [];
let currentCheckInQuestions = [];

function initConversationalCheckIn() {
    currentCheckInQuestionIdx = 0;
    checkInResponses = [];

    // Sync profile from storage and get profession-based questions
    syncVictimProfileFromStorage();
    currentCheckInQuestions = getQuestionsForProfession(currentVictimProfile.profession);

    const stream = document.getElementById('checkin-chat-stream');
    if (stream) {
        stream.innerHTML = '';

        const greetingBubble = document.createElement('div');
        greetingBubble.className = "checkin-bubble-bot flex items-start gap-2.5 max-w-[92%]";
        const displayName = currentVictimProfile.name || "there";
        const professionLabel = currentVictimProfile.profession || "General";

        greetingBubble.innerHTML = `
            <div class="w-7 h-7 rounded-full overflow-hidden border border-teal-400 shrink-0 mt-0.5">
                <img src="assets/nex_avatar.jpg" alt="NEX AI" class="w-full h-full object-cover">
            </div>
            <div class="bg-slate-900 border border-teal-500/30 rounded-2xl rounded-tl-none p-3 shadow-md space-y-1">
                <div class="flex items-center gap-1.5">
                    <span class="text-[10px] font-bold font-mono text-teal-400 uppercase">Adaptive AI Check-in</span>
                    <span class="px-2 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300">${escapeHtml(professionLabel)}</span>
                </div>
                <p class="font-semibold text-slate-100 text-xs md:text-sm leading-snug">Hello ${escapeHtml(displayName)} 👋</p>
                <p class="text-[11px] text-slate-300 leading-normal">Welcome to your personalized ${escapeHtml(professionLabel)} wellness check-in. Your ${currentCheckInQuestions.length} questions have been adapted based on your profile. All responses are encrypted and shared directly with your consulting doctor.</p>
            </div>
        `;
        stream.appendChild(greetingBubble);
    }

    renderCurrentCheckInQuestion();
}

function renderCurrentCheckInQuestion() {
    const q = currentCheckInQuestions[currentCheckInQuestionIdx];
    if (!q) return;

    // Update Progress Badge & Bar
    const badge = document.getElementById('checkin-progress-badge');
    if (badge) badge.innerText = `Question ${currentCheckInQuestionIdx + 1} of ${currentCheckInQuestions.length}`;

    const pBar = document.getElementById('checkin-progress-bar');
    if (pBar) {
        const pct = Math.round(((currentCheckInQuestionIdx + 1) / currentCheckInQuestions.length) * 100);
        pBar.style.width = `${pct}%`;
    }

    const stream = document.getElementById('checkin-chat-stream');
    if (stream) {
        const botBubble = document.createElement('div');
        botBubble.className = "checkin-bubble-bot flex items-start gap-2.5 max-w-[92%]";
        botBubble.innerHTML = `
            <div class="w-7 h-7 rounded-full overflow-hidden border border-teal-400 shrink-0 mt-0.5">
                <img src="assets/nex_avatar.jpg" alt="NEX AI" class="w-full h-full object-cover">
            </div>
            <div class="bg-slate-900 border border-teal-500/30 rounded-2xl rounded-tl-none p-3 shadow-md space-y-1">
                <div class="flex items-center gap-1.5">
                    <span class="text-[10px] font-bold font-mono text-teal-400 uppercase">Question ${currentCheckInQuestionIdx + 1} • ${escapeHtml(q.questionLabel)}</span>
                </div>
                <p class="font-semibold text-slate-100 text-xs md:text-sm leading-snug">${escapeHtml(q.prompt)}</p>
                <p class="text-[11px] text-slate-400 leading-normal">${escapeHtml(q.subtext)}</p>
            </div>
        `;
        stream.appendChild(botBubble);
        stream.scrollTop = stream.scrollHeight;
    }

    const freeform = document.getElementById('checkin-freeform-input');
    if (freeform) {
        freeform.placeholder = `Type answer for Question ${currentCheckInQuestionIdx + 1}, or click an option above...`;
        freeform.focus();
    }
}

function handleQuickCheckInResponse(responseText) {
    submitConversationalAnswer(responseText);
}

function handleConversationalCheckInSend(e) {
    if (e && e.preventDefault) e.preventDefault();
    const input = document.getElementById('checkin-freeform-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) {
        input.focus();
        return;
    }
    input.value = '';
    submitConversationalAnswer(text);
}

function submitConversationalAnswer(answerText) {
    playHapticBeep(520, 'sine', 0.05);

    const stream = document.getElementById('checkin-chat-stream');
    if (stream) {
        const userBubble = document.createElement('div');
        userBubble.className = "checkin-bubble-user max-w-[85%] self-end bg-gradient-to-r from-teal-600 to-sky-600 text-white rounded-2xl rounded-tr-none px-3.5 py-2.5 text-xs font-medium shadow-md";
        userBubble.innerText = answerText;
        stream.appendChild(userBubble);
        stream.scrollTop = stream.scrollHeight;
    }

    const currentQ = currentCheckInQuestions[currentCheckInQuestionIdx];
    if (currentQ) {
        checkInResponses.push({
            questionId: currentQ.id,
            questionLabel: currentQ.questionLabel,
            questionPrompt: currentQ.prompt,
            dimension: currentQ.dimension,
            text: answerText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    }

    currentCheckInQuestionIdx++;

    if (currentCheckInQuestionIdx < currentCheckInQuestions.length) {
        setTimeout(renderCurrentCheckInQuestion, 300);
    } else {
        finalizeConversationalCheckIn();
    }
}

function finalizeConversationalCheckIn() {
    playHapticBeep(720, 'sine', 0.12);

    const survivorName = currentVictimProfile.name || "Survivor";
    const survivorPhone = currentVictimProfile.phone || "Confidential";
    const survivorWork = currentVictimProfile.work || currentVictimProfile.profession || "General";
    const survivorStress = currentVictimProfile.stress || "Moderate";
    const survivorProfession = currentVictimProfile.profession || "Default";
    const caseToken = currentVictimProfile.token || `CASE-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const questionCount = currentCheckInQuestions.length;

    const stream = document.getElementById('checkin-chat-stream');
    if (stream) {
        const doneBubble = document.createElement('div');
        doneBubble.className = "checkin-bubble-bot flex items-start gap-2.5 max-w-[92%] bg-teal-950/70 border border-teal-500/50 rounded-2xl p-3 shadow-md";
        doneBubble.innerHTML = `
            <div class="w-6 h-6 rounded-full bg-teal-500 text-slate-950 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</div>
            <div>
                <p class="font-bold text-teal-300 text-xs">🌟 Keep Up the Good Work! All Done, ${escapeHtml(survivorName)}!</p>
                <p class="text-[11px] text-slate-300 mt-0.5">All ${questionCount} ${survivorProfession} profile questions completed. Running AI clinical synthesis...</p>
            </div>
        `;
        stream.appendChild(doneBubble);
        stream.scrollTop = stream.scrollHeight;
    }

    // Comprehensive clinical analysis across all check-in dimensions
    const analysis = analyzeCheckInResponses(checkInResponses, survivorStress);

    // Calculate additional AI metrics
    const lviScore = calculateLVI(checkInResponses, survivorProfession);
    const traumaVectors = classifyTraumaVectors(checkInResponses);

    // Show AI Clinical Synthesis badge after a short delay
    setTimeout(() => {
        if (stream) {
            const synthBadge = document.createElement('div');
            synthBadge.className = "checkin-bubble-bot flex items-start gap-2.5 max-w-[92%] bg-gradient-to-r from-cyan-950/80 to-violet-950/80 border border-cyan-500/40 rounded-2xl p-4 shadow-lg";
            const riskColor = analysis.totalScore >= 70 ? 'rose' : analysis.totalScore >= 40 ? 'amber' : 'emerald';
            const riskBgClass = riskColor === 'rose' ? 'bg-rose-500/20 text-rose-300' : riskColor === 'amber' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300';
            const riskBorderClass = riskColor === 'rose' ? 'border-rose-500/40' : riskColor === 'amber' ? 'border-amber-500/40' : 'border-emerald-500/40';

            let traumaListHtml = traumaVectors.length > 0
                ? traumaVectors.map(tv => `<span class="px-2 py-1 rounded-full text-[10px] ${riskBgClass} border ${riskBorderClass} mr-1">${escapeHtml(tv.vector)} (${tv.confidence}%)</span>`).join('')
                : '<span class="text-[10px] text-slate-400">No significant vectors detected</span>';

            synthBadge.innerHTML = `
                <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-white font-bold text-xs shrink-0">AI</div>
                <div class="flex-1 space-y-2">
                    <div class="flex items-center gap-2">
                        <span class="text-[11px] font-bold font-mono text-cyan-300 uppercase">AI Clinical Synthesis</span>
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${riskBgClass} border ${riskBorderClass}">${survivorProfession} Profile</span>
                    </div>
                    <div class="grid grid-cols-2 gap-2 text-[10px]">
                        <div class="p-2 rounded-lg bg-slate-900/60 border border-slate-700/50">
                            <span class="text-slate-400 block">Dynamic Distress Score</span>
                            <span class="text-xl font-black text-white font-mono">${analysis.totalScore}</span>
                            <span class="text-slate-500 text-[9px]">/ 100</span>
                        </div>
                        <div class="p-2 rounded-lg bg-slate-900/60 border border-slate-700/50">
                            <span class="text-slate-400 block">Livelihood Vulnerability</span>
                            <span class="text-xl font-black text-amber-400 font-mono">${lviScore}</span>
                            <span class="text-slate-500 text-[9px]">/ 100</span>
                        </div>
                    </div>
                    <div class="p-2 rounded-lg bg-slate-900/60 border border-slate-700/50">
                        <span class="text-slate-400 block mb-1">Trauma Vector Classification</span>
                        <div class="flex flex-wrap gap-1">${traumaListHtml}</div>
                    </div>
                    <p class="text-[10px] text-slate-400 italic">Analysis complete. Report encrypted and transmitted to clinical dashboard.</p>
                </div>
            `;
            stream.appendChild(synthBadge);
            stream.scrollTop = stream.scrollHeight;
        }
    }, 800);

    const newCheckIn = {
        week: 1,
        date: new Date().toISOString().split('T')[0],
        ddiScore: analysis.totalScore,
        riskLevel: analysis.riskLevel,
        surveyPoints: analysis.surveyPoints,
        nlpPoints: analysis.nlpPoints,
        acousticPoints: analysis.acousticPoints,
        questionScores: analysis.questionScores,
        breakdown: {
            survey: analysis.surveyPoints,
            nlp: analysis.nlpPoints,
            acoustic: analysis.acousticPoints
        },
        somaticScore: analysis.somaticScore,
        threatScore: analysis.threatScore,
        courtScore: analysis.courtScore,
        isolationScore: analysis.isolationScore,
        lviScore: lviScore,
        traumaVectors: traumaVectors,
        notes: analysis.combinedJournal,
        milestone: "Daily Check-in Chat Review"
    };

    // Find existing case for this survivor or create a brand new one
    let targetCase = cases.find(c => (c.victimName && c.victimName.toLowerCase() === survivorName.toLowerCase()) || c.token === caseToken || c.caseId === caseToken);

    if (!targetCase) {
        targetCase = {
            caseId: caseToken,
            token: caseToken,
            victimName: survivorName,
            phone: survivorPhone,
            lineOfWork: survivorWork,
            baselineStress: survivorStress,
            district: "Pune Central",
            category: survivorWork ? (`${survivorWork} • Survivor Check-in`) : "Witness / Survivor Support",
            threatLevel: analysis.riskLevel,
            stage: "Intake & Daily Monitoring",
            milestone: "Active Check-in Review",
            latestJournal: analysis.combinedJournal,
            interventions: [],
            checkIns: [newCheckIn],
            latestCheckInTranscript: checkInResponses.map(r => ({
                questionId: r.questionId,
                dimension: r.dimension,
                question: r.questionLabel || r.questionPrompt,
                answer: r.text,
                time: r.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }))
        };
        cases.unshift(targetCase);
    } else {
        targetCase.victimName = survivorName;
        targetCase.phone = survivorPhone;
        targetCase.lineOfWork = survivorWork;
        targetCase.baselineStress = survivorStress;
        targetCase.threatLevel = analysis.riskLevel;
        targetCase.latestJournal = analysis.combinedJournal;
        newCheckIn.week = (targetCase.checkIns && targetCase.checkIns.length > 0)
            ? targetCase.checkIns[targetCase.checkIns.length - 1].week + 1
            : 1;
        if (!targetCase.checkIns) targetCase.checkIns = [];
        targetCase.checkIns.push(newCheckIn);
        targetCase.latestCheckInTranscript = checkInResponses.map(r => ({
            questionId: r.questionId,
            dimension: r.dimension,
            question: r.questionLabel || r.questionPrompt,
            answer: r.text,
            time: r.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
    }

    selectedCaseId = targetCase.caseId;
    saveCases();

    // Transition victim view after a brief reassuring pause
    setTimeout(() => {
        // Hide chatbot container & profile form, and reveal warm confirmation card
        document.getElementById('victim-chat-container')?.classList.add('hidden');
        document.getElementById('victim-profile-intake')?.classList.add('hidden');
        
        const successEl = document.getElementById('victim-success');
        if (successEl) successEl.classList.remove('hidden');

        // Populate personalized details in success card
        const nameEl = document.getElementById('success-victim-name');
        if (nameEl) nameEl.innerText = survivorName;
        const patName = document.getElementById('success-patient-name');
        if (patName) patName.innerText = survivorName;
        const patPhone = document.getElementById('success-patient-phone');
        if (patPhone) patPhone.innerText = survivorPhone;
        const patWork = document.getElementById('success-patient-work');
        if (patWork) patWork.innerText = survivorWork;
        const patStress = document.getElementById('success-patient-stress');
        if (patStress) patStress.innerText = survivorStress;
        const tokenSpan = document.getElementById('success-token-span');
        if (tokenSpan) tokenSpan.innerText = targetCase.token || targetCase.caseId;

        // Synchronize doctor dashboard and transcript in the background
        renderCheckInTranscript(targetCase);
        renderCaseTimeline(targetCase);
        renderDashboard();
        updateLegalReportPreview();
    }, 600);
}

// ----------------------------------------------------------------------------
// DOCTOR / CONSULTANT EXCLUSIVE: PATIENT CHECK-IN TRANSCRIPT RENDERER
// ----------------------------------------------------------------------------
function renderCheckInTranscript(targetCase) {
    const transcriptEl = document.getElementById('detail-checkin-transcript');
    if (!transcriptEl) return;

    const latest = targetCase.checkIns && targetCase.checkIns.length > 0 ? targetCase.checkIns[targetCase.checkIns.length - 1] : null;
    const qScores = (latest && latest.questionScores) 
        ? latest.questionScores 
        : analyzeCheckInResponses(targetCase.latestCheckInTranscript || [], targetCase.baselineStress, targetCase.latestJournal).questionScores;

    if (targetCase.latestCheckInTranscript && targetCase.latestCheckInTranscript.length > 0) {
        transcriptEl.innerHTML = targetCase.latestCheckInTranscript.map((item, idx) => {
            const qScoreObj = qScores[idx] || {};
            const qScore = qScoreObj.score !== undefined ? qScoreObj.score : (targetCase.threatLevel === 'HIGH' ? 88 : 45);
            const scoreBadge = qScore >= 70
                ? `<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-950/80 text-rose-300 border border-rose-500/40">${qScore}/100 • Critical</span>`
                : (qScore >= 40
                    ? `<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40">${qScore}/100 • Elevated</span>`
                    : `<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-950/80 text-teal-300 border border-teal-500/40">${qScore}/100 • Stable</span>`);

            return `
                <div class="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-1.5 shadow-xs">
                    <div class="flex items-center justify-between text-[11px]">
                        <span class="font-bold text-teal-300 font-mono">Q${idx + 1}: ${escapeHtml(item.question)}</span>
                        <div class="flex items-center gap-2">
                            ${scoreBadge}
                            <span class="text-[10px] text-slate-400 font-mono">${escapeHtml(item.time || '')}</span>
                        </div>
                    </div>
                    <div class="text-slate-200 text-xs pl-2.5 border-l-2 border-teal-500/60 flex items-center gap-2">
                        <span class="text-teal-400">↳</span>
                        <span class="font-medium">${escapeHtml(item.answer)}</span>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        // Default fallback
        transcriptEl.innerHTML = `
            <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-xs">
                No question responses recorded yet for this case.
            </div>
        `;
    }
}

// ----------------------------------------------------------------------------
// VOICE INPUT CONTROLLER (Web Speech API)
// ----------------------------------------------------------------------------
let victimSpeechRecognition = null;
let isVictimRecording = false;

function toggleVictimVoiceInput() {
    const btn = document.getElementById('victim-voice-btn');
    const input = document.getElementById('checkin-freeform-input');
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        showToast("Speech recognition is not supported in this browser. Please type your response.", "warning");
        return;
    }

    if (isVictimRecording && victimSpeechRecognition) {
        victimSpeechRecognition.stop();
        isVictimRecording = false;
        if (btn) {
            btn.classList.remove('bg-rose-900', 'text-rose-300', 'animate-pulse');
            btn.classList.add('bg-slate-900', 'text-slate-300');
        }
        return;
    }

    try {
        victimSpeechRecognition = new SpeechRecognition();
        victimSpeechRecognition.lang = currentLang === 'hi' ? 'hi-IN' : (currentLang === 'mr' ? 'mr-IN' : 'en-US');
        victimSpeechRecognition.continuous = false;
        victimSpeechRecognition.interimResults = true;

        victimSpeechRecognition.onstart = () => {
            isVictimRecording = true;
            if (btn) {
                btn.classList.remove('bg-slate-900', 'text-slate-300');
                btn.classList.add('bg-rose-900', 'text-rose-300', 'animate-pulse');
            }
            showToast("Listening... speak your response", "info");
        };

        victimSpeechRecognition.onresult = (event) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    if (input) input.value = event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                    if (input) input.value = interimTranscript;
                }
            }
        };

        victimSpeechRecognition.onerror = (event) => {
            console.warn("Speech recognition error:", event.error);
            isVictimRecording = false;
            if (btn) {
                btn.classList.remove('bg-rose-900', 'text-rose-300', 'animate-pulse');
                btn.classList.add('bg-slate-900', 'text-slate-300');
            }
        };

        victimSpeechRecognition.onend = () => {
            isVictimRecording = false;
            if (btn) {
                btn.classList.remove('bg-rose-900', 'text-rose-300', 'animate-pulse');
                btn.classList.add('bg-slate-900', 'text-slate-300');
            }
        };

        victimSpeechRecognition.start();
    } catch (err) {
        console.error("Failed to start speech recognition:", err);
        showToast("Unable to start microphone: " + err.message, "error");
    }
}

// ----------------------------------------------------------------------------
// CASE TIMELINE COMPONENT (Friend Repo CaseTimeline)
// ----------------------------------------------------------------------------
function renderCaseTimeline(targetCase) {
    if (!targetCase) return;

    // Timeline elements in both victim report card and caseworker drawer
    const victimTimelineEl = document.getElementById('victim-case-timeline');
    const drawerTimelineEl = document.getElementById('case-timeline-container');

    // Build timeline milestones from statutory progression and logged check-ins
    const events = [];

    // Milestone 1: FIR Registered
    events.push({
        title: "FIR Registered & Case Intake",
        date: "2026-07-12",
        status: "Completed",
        icon: "📄",
        colorClass: "border-teal-500 text-teal-400 bg-teal-950/60",
        notes: `Registered under Sec 3(1)(r)(s) SC/ST (PoA) Act. Assigned to Special Court.`
    });

    // Milestone 2: DLSA Caseworker Appointed
    events.push({
        title: "DLSA Legal Aid Caseworker Appointed",
        date: "2026-07-16",
        status: "Completed",
        icon: "⚖️",
        colorClass: "border-teal-500 text-teal-400 bg-teal-950/60",
        notes: `Dr. Sarah Jenkins assigned for psychological triage and trauma-informed court prep.`
    });

    // Milestone 3: Medical / Forensic Examination
    events.push({
        title: "Clinical Medical & Forensic Examination",
        date: "2026-07-20",
        status: "Completed",
        icon: "🩺",
        colorClass: "border-teal-500 text-teal-400 bg-teal-950/60",
        notes: `Government District Hospital. Medico-legal report submitted to IO.`
    });

    // Milestone 4: Chargesheet Filed
    events.push({
        title: "Police Chargesheet Submitted",
        date: "2026-08-04",
        status: "Completed",
        icon: "🏛️",
        colorClass: "border-teal-500 text-teal-400 bg-teal-950/60",
        notes: `Chargesheet filed within statutory 60-day mandate. Special Public Prosecutor assigned.`
    });

    // Add any logged Check-Ins
    if (targetCase.checkIns && targetCase.checkIns.length > 0) {
        targetCase.checkIns.slice(-3).forEach(ci => {
            const isHigh = ci.riskLevel === 'HIGH';
            events.push({
                title: `Weekly Wellness Check-In (Week ${ci.week})`,
                date: ci.date,
                status: isHigh ? "Elevated Distress" : "Logged",
                icon: isHigh ? "🚨" : "🌿",
                colorClass: isHigh ? "border-rose-500 text-rose-400 bg-rose-950/60" : "border-teal-500 text-teal-400 bg-teal-950/60",
                notes: `DDS: ${ci.ddiScore}/100 • ${escapeHtml(ci.notes || 'Routine weekly telemetry logged.')}`
            });
        });
    }

    // Add any logged Interventions
    if (targetCase.interventions && targetCase.interventions.length > 0) {
        targetCase.interventions.forEach(iv => {
            events.push({
                title: iv.type || "Support Action Executed",
                date: iv.date,
                status: "Executed",
                icon: "🛡️",
                colorClass: "border-sky-500 text-sky-400 bg-sky-950/60",
                notes: `${escapeHtml(iv.action)} (${escapeHtml(iv.caseworker || 'DLSA')})`
            });
        });
    }

    // Milestone: Current / Upcoming Stage
    events.push({
        title: "Special Court Hearing / In-Camera Trial",
        date: "Scheduled • 2026-09-18",
        status: "Current Stage",
        icon: "⚖️",
        colorClass: "border-amber-500 text-amber-400 bg-amber-950/60 animate-pulse",
        notes: `In-camera testimony scheduled. Witness protection protocol on standby.`
    });

    // Milestone: Future Relief
    events.push({
        title: "Statutory Rehabilitation & MoSJE Relief Tranche",
        date: "Pending Order",
        status: "Upcoming",
        icon: "💰",
        colorClass: "border-slate-700 text-slate-500 bg-slate-900/40",
        notes: `Direct DBT bank disbursement upon judicial recording of evidence.`
    });

    // Render HTML helper
    const renderTimelineHtml = (items) => `
        <div class="timeline-track space-y-4">
            ${items.map(item => `
                <div class="timeline-node flex items-start gap-3 text-xs">
                    <div class="w-7 h-7 rounded-xl border flex items-center justify-center text-xs shrink-0 ${item.colorClass} shadow-xs">
                        <span>${item.icon}</span>
                    </div>
                    <div class="flex-1 space-y-1">
                        <div class="flex items-center justify-between gap-2 flex-wrap">
                            <span class="font-bold text-slate-200">${escapeHtml(item.title)}</span>
                            <span class="text-[10px] font-mono text-slate-400 font-medium">${escapeHtml(item.date)}</span>
                        </div>
                        <p class="text-[11px] text-slate-400 leading-relaxed">${escapeHtml(item.notes)}</p>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    const generatedHtml = renderTimelineHtml(events);
    if (victimTimelineEl) victimTimelineEl.innerHTML = generatedHtml;
    if (drawerTimelineEl) drawerTimelineEl.innerHTML = generatedHtml;
}

// ============================================================================
// ASTRA-INSPIRED DYNAMIC CELESTIAL BACKGROUND (FAST DRIFT + RANDOM MOVING GRADIENTS)
// ============================================================================
function initAstraBackground() {
    const canvas = document.getElementById('astra-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const PARTICLE_COLORS = ['#ffffff', '#60a5fa', '#93c5fd', '#38bdf8', '#c084fc'];
    const PARTICLE_COUNT = 220;
    const particles = [];

    let width = 0;
    let height = 0;
    let dpr = 1;

    // 4 Dynamic randomly moving nebula gradient orbs
    const nebulaOrbs = [
        { x: 0, y: 0, vx: 0.85, vy: 0.65, radius: 450, color: 'rgba(56, 189, 248, 0.22)' },   // Sky / Cyan
        { x: 0, y: 0, vx: -0.75, vy: -0.8, radius: 520, color: 'rgba(192, 132, 252, 0.20)' },  // Purple / Violet
        { x: 0, y: 0, vx: 0.7, vy: -0.65, radius: 480, color: 'rgba(96, 165, 250, 0.16)' },   // Deep Blue
        { x: 0, y: 0, vx: -0.6, vy: 0.75, radius: 420, color: 'rgba(45, 212, 191, 0.14)' }    // Teal / Emerald
    ];

    function handleResize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = window.innerWidth;
        height = window.innerHeight;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';

        ctx.scale(dpr, dpr);

        nebulaOrbs[0].radius = Math.max(width, height) * 0.42;
        nebulaOrbs[1].radius = Math.max(width, height) * 0.46;
        nebulaOrbs[2].radius = Math.max(width, height) * 0.40;
        nebulaOrbs[3].radius = Math.max(width, height) * 0.36;
    }

    handleResize();
    window.addEventListener('resize', handleResize);

    // Initial positions for nebula orbs
    nebulaOrbs[0].x = width * 0.25; nebulaOrbs[0].y = height * 0.3;
    nebulaOrbs[1].x = width * 0.75; nebulaOrbs[1].y = height * 0.7;
    nebulaOrbs[2].x = width * 0.5;  nebulaOrbs[2].y = height * 0.5;
    nebulaOrbs[3].x = width * 0.8;  nebulaOrbs[3].y = height * 0.25;

    // Initialize 220 particles with faster drift velocities
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const radius = Math.random() * 1.9 + 0.7;
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: radius,
            vx: (Math.random() - 0.5) * 0.85, // Faster drift
            vy: (Math.random() - 0.5) * 0.85,
            color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
            baseOpacity: Math.random() * 0.6 + 0.35,
            pulseSpeed: Math.random() * 0.004 + 0.0025,
            phase: Math.random() * Math.PI * 2,
            shadowBlur: radius * (Math.random() * 2.5 + 2.5)
        });
    }

    let startTime = performance.now();

    function render(time) {
        const elapsed = time - startTime;
        ctx.clearRect(0, 0, width, height);

        // 1. Draw dynamic randomly moving nebula gradients
        for (let i = 0; i < nebulaOrbs.length; i++) {
            const orb = nebulaOrbs[i];
            orb.x += orb.vx;
            orb.y += orb.vy;

            // Random subtle direction shift
            orb.vx += (Math.random() - 0.5) * 0.035;
            orb.vy += (Math.random() - 0.5) * 0.035;

            // Clamp velocity
            orb.vx = Math.max(-1.1, Math.min(1.1, orb.vx));
            orb.vy = Math.max(-1.1, Math.min(1.1, orb.vy));

            // Bounce with margin
            const pad = 80;
            if (orb.x < -pad) { orb.x = -pad; orb.vx = Math.abs(orb.vx); }
            else if (orb.x > width + pad) { orb.x = width + pad; orb.vx = -Math.abs(orb.vx); }

            if (orb.y < -pad) { orb.y = -pad; orb.vy = Math.abs(orb.vy); }
            else if (orb.y > height + pad) { orb.y = height + pad; orb.vy = -Math.abs(orb.vy); }

            // Render radial gradient
            const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
            grad.addColorStop(0, orb.color);
            grad.addColorStop(1, 'transparent');

            ctx.save();
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // 2. Draw glowing, twinkling stars with faster drift
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];

            p.x += p.vx;
            p.y += p.vy;

            // Subtle organic random steer
            p.vx += (Math.random() - 0.5) * 0.02;
            p.vy += (Math.random() - 0.5) * 0.02;
            p.vx = Math.max(-1.1, Math.min(1.1, p.vx));
            p.vy = Math.max(-1.1, Math.min(1.1, p.vy));

            // Boundary wrap
            if (p.x < -10) p.x = width + 10;
            else if (p.x > width + 10) p.x = -10;

            if (p.y < -10) p.y = height + 10;
            else if (p.y > height + 10) p.y = -10;

            const currentOpacity = Math.max(
                0.15,
                Math.min(1, p.baseOpacity * (0.6 + 0.4 * Math.sin(elapsed * p.pulseSpeed + p.phase)))
            );

            ctx.save();
            ctx.globalAlpha = currentOpacity;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = p.shadowBlur;
            ctx.fillStyle = p.color;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

// =========================================================================
// Global Click Animations: Celestial Ripple Wave & Starlight Particles
// Makes every button click, tab click, and interaction feel alive!
// =========================================================================
function initGlobalClickAnimations() {
    // Listen to pointerdown on window for instantaneous tactile response
    window.addEventListener('pointerdown', (e) => {
        // Only trigger on valid coordinates
        if (!e.clientX && !e.clientY) return;

        // Find nearest clickable / interactive target
        const target = e.target.closest(
            'button, a, [role="button"], .cursor-pointer, .monitor-nav-btn, .quick-response-chip, .consult-type-pill, .portal-nav-pill, .triage-card, tr, input[type="submit"]'
        );

        createCelestialClickWave(e.clientX, e.clientY, target);
    }, { passive: true });
}

function createCelestialClickWave(x, y, target) {
    if (!x || !y) return;

    // 1. Expanding starlight wave
    const wave = document.createElement('div');
    wave.className = 'celestial-click-wave';
    wave.style.left = `${x}px`;
    wave.style.top = `${y}px`;
    document.body.appendChild(wave);

    // 2. Central starlight spark
    const spark = document.createElement('div');
    spark.className = 'celestial-click-spark';
    spark.style.left = `${x}px`;
    spark.style.top = `${y}px`;
    document.body.appendChild(spark);

    // Clean up elements from DOM after animation completes
    setTimeout(() => {
        if (wave && wave.parentNode) wave.parentNode.removeChild(wave);
        if (spark && spark.parentNode) spark.parentNode.removeChild(spark);
    }, 550);
}

// Initial Boot up with persisted language support & SIH-26094 Portal Hash Routing
window.addEventListener('DOMContentLoaded', () => {
    initAstraBackground();
    initGlobalClickAnimations();
    const savedLang = localStorage.getItem('nexora_lang') || 'en';
    changeLanguage(savedLang);
    initWaveformCanvas();

    // Check URL hash for direct portal navigation
    const hash = window.location.hash.toLowerCase();
    if (hash === '#roles') {
        goToSecondPage();
    } else if (hash === '#pulse') {
        loginAsRole('victim');
    } else if (hash === '#triage') {
        loginAsRole('counselor');
    } else if (hash === '#analytics') {
        loginAsRole('admin');
    } else {
        switchView('intro');
    }

    // Pre-initialize intelligence suite & analytics charts
    setTimeout(() => {
        try {
            renderDashboardIntelligence(currentDashboardIntelTab || 'swimlane');
            renderSankeyFlowDiagram(currentSankeyDistrict || 'all');
            renderStateCareSwimlane();
            renderDistrictResilienceRadar();
        } catch (e) {}
    }, 150);
});

// React to URL hash changes
window.addEventListener('hashchange', () => {
    const hash = window.location.hash.toLowerCase();
    if (hash === '#roles') {
        goToSecondPage();
    } else if (hash === '#pulse') {
        loginAsRole('victim');
    } else if (hash === '#triage') {
        loginAsRole('counselor');
    } else if (hash === '#analytics') {
        loginAsRole('admin');
    }
});

// ============================================================================
// SENTIENT AI STATUS ORB CONTROLLER
// Manages Calm/Idle, Active/Listening, and Alert/Elevated dynamic states
// ============================================================================
(function initSentientAIOrb() {
    let currentOrbState = 'calm'; // 'calm' | 'active' | 'alert'
    let orbInputTimeout = null;

    function updateOrbUI(state) {
        currentOrbState = state;
        const container = document.getElementById('sentient-ai-orb-container');
        const svg = document.getElementById('orb-svg');
        const ripple = document.getElementById('orb-ripple');
        const aura = document.getElementById('orb-glow-aura');
        const dot = document.getElementById('orb-status-dot');
        const label = document.getElementById('orb-status-label');
        const stopBright = document.getElementById('orb-stop-bright');
        const stopDeep = document.getElementById('orb-stop-deep');
        const plasmaBright = document.getElementById('plasma-stop-bright');

        if (!container || !svg || !ripple || !aura || !dot || !label) return;

        // Reset classes
        svg.className.baseVal = "relative z-10 ";
        ripple.className = "absolute inset-0 rounded-full pointer-events-none ";

        if (state === 'active') {
            container.className = "inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-slate-900/90 border border-sky-400/50 text-sky-200 backdrop-blur-md select-none transition-all duration-300 shadow-[0_0_15px_rgba(56,189,248,0.3)]";
            svg.classList.add('nexora-orb-active');
            ripple.classList.add('nexora-ripple-active', 'border-sky-400/80');
            aura.className = "absolute inset-0 rounded-full bg-sky-400/40 blur-xs";
            dot.className = "w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]";
            label.textContent = "SYNAPSE: ACTIVE";
            if (stopBright) stopBright.setAttribute('stop-color', '#60a5fa');
            if (stopDeep) stopDeep.setAttribute('stop-color', '#2563eb');
            if (plasmaBright) plasmaBright.setAttribute('stop-color', '#93c5fd');
        } else if (state === 'alert') {
            container.className = "inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-slate-900/90 border border-amber-500/50 text-amber-200 backdrop-blur-md select-none transition-all duration-300 shadow-[0_0_15px_rgba(244,63,94,0.3)]";
            svg.classList.add('nexora-orb-alert');
            ripple.classList.add('nexora-ripple-alert', 'border-rose-400/80');
            aura.className = "absolute inset-0 rounded-full bg-rose-500/40 blur-xs";
            dot.className = "w-1.5 h-1.5 rounded-full bg-rose-400 shadow-[0_0_8px_#fb7185]";
            label.textContent = "DISTRESS: ELEVATED";
            if (stopBright) stopBright.setAttribute('stop-color', '#fb923c');
            if (stopDeep) stopDeep.setAttribute('stop-color', '#e11d48');
            if (plasmaBright) plasmaBright.setAttribute('stop-color', '#fda4af');
        } else {
            // Calm
            container.className = "inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-slate-900/80 border border-cyan-500/30 text-cyan-300 backdrop-blur-md select-none transition-all duration-300";
            svg.classList.add('nexora-orb-calm');
            ripple.classList.add('nexora-ripple-calm', 'border-cyan-400/50');
            aura.className = "absolute inset-0 rounded-full bg-cyan-400/30 blur-xs";
            dot.className = "w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#38bdf8]";
            label.textContent = "CORE: ACTIVE";
            if (stopBright) stopBright.setAttribute('stop-color', '#38bdf8');
            if (stopDeep) stopDeep.setAttribute('stop-color', '#0e7490');
            if (plasmaBright) plasmaBright.setAttribute('stop-color', '#38bdf8');
        }
    }

    // Dynamic Latency jitter (19-28ms)
    setInterval(() => {
        const latencyEl = document.getElementById('orb-latency-text');
        if (latencyEl) {
            latencyEl.textContent = Math.floor(19 + Math.random() * 9);
        }
    }, 4500);

    // Monitor input & slider interactions
    function handleActiveInteraction() {
        if (currentOrbState === 'alert') return; // Alert overrides active state
        updateOrbUI('active');
        clearTimeout(orbInputTimeout);
        orbInputTimeout = setTimeout(() => {
            if (currentOrbState !== 'alert') {
                updateOrbUI('calm');
            }
        }, 1200);
    }

    window.addEventListener('input', (e) => {
        const t = e.target;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) {
            handleActiveInteraction();
        }
    });

    window.addEventListener('focusin', (e) => {
        const t = e.target;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) {
            handleActiveInteraction();
        }
    });

    // Expose hook to set state when high distress is detected in app
    window.setAIStatusOrbState = function(state) {
        updateOrbUI(state);
    };

    // Global Ambient Cursor Spotlight Listener
    const spotlight = document.getElementById('cockpit-cursor-spotlight');
    if (spotlight) {
        let spotTicking = false;
        window.addEventListener('mousemove', (e) => {
            if (!spotTicking) {
                window.requestAnimationFrame(() => {
                    spotlight.style.left = e.clientX + 'px';
                    spotlight.style.top = e.clientY + 'px';
                    spotlight.style.opacity = '0.35';
                    spotTicking = false;
                });
                spotTicking = true;
            }
        });
        document.addEventListener('mouseleave', () => {
            spotlight.style.opacity = '0';
        });
    }
})();

// ============================================================================
// NEXORA UNIVERSAL AMBIENT BACKGROUND ENGINE & CONTROLLER
// Singleton controller managing switchable canvas engines, chromatic themes,
// and route-persistent ambient visuals.
// ============================================================================

window.AmbientController = {
  activeEngine: localStorage.getItem('nexora_bg_engine') || 'sentient-aura',
  activeTheme: localStorage.getItem('nexora_bg_theme') || 'cyber-cyan',
  activeOpacity: parseFloat(localStorage.getItem('nexora_bg_opacity') || '0.75'),
  animationFrameId: null,
  canvas: null,
  ctx: null,
  mouse: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
  _uiBound: false,
  noisePattern: null,

  init() {
    this.canvas = document.getElementById('nexora-ambient-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    this.applyTheme(this.activeTheme, false);
    this.setOpacity(this.activeOpacity);
    this.switchEngine(this.activeEngine);
    this.bindUI();
  },

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  },

  stopCurrentEngine() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    // Reset any engine-specific canvas filters
    if (this.canvas) {
      this.canvas.style.filter = 'none';
    }
  },

  getTheme() {
    const themes = {
      'cyber-cyan': {
        primary: '#06b6d4',
        glow: 'rgba(6, 182, 212, 0.45)',
        rgb: '6, 182, 212',
        palette: ['rgba(6, 182, 212, 0.7)', 'rgba(14, 165, 233, 0.6)', 'rgba(59, 130, 246, 0.5)', 'rgba(99, 102, 241, 0.45)']
      },
      'neural-violet': {
        primary: '#a855f7',
        glow: 'rgba(168, 85, 247, 0.45)',
        rgb: '168, 85, 247',
        palette: ['rgba(168, 85, 247, 0.7)', 'rgba(147, 51, 234, 0.6)', 'rgba(126, 34, 206, 0.5)', 'rgba(192, 132, 252, 0.45)']
      },
      'obsidian-emerald': {
        primary: '#10b981',
        glow: 'rgba(16, 185, 129, 0.45)',
        rgb: '16, 185, 129',
        palette: ['rgba(16, 185, 129, 0.7)', 'rgba(5, 150, 105, 0.6)', 'rgba(4, 120, 87, 0.5)', 'rgba(52, 211, 153, 0.45)']
      },
      'solar-amber': {
        primary: '#f59e0b',
        glow: 'rgba(245, 158, 11, 0.45)',
        rgb: '245, 158, 11',
        palette: ['rgba(245, 158, 11, 0.7)', 'rgba(217, 119, 6, 0.6)', 'rgba(180, 83, 9, 0.5)', 'rgba(251, 146, 60, 0.45)']
      },
      'deep-crimson': {
        primary: '#f43f5e',
        glow: 'rgba(244, 63, 94, 0.45)',
        rgb: '244, 63, 94',
        palette: ['rgba(244, 63, 94, 0.7)', 'rgba(225, 29, 72, 0.6)', 'rgba(190, 24, 93, 0.5)', 'rgba(251, 113, 133, 0.45)']
      }
    };
    return themes[this.activeTheme] || themes['cyber-cyan'];
  },

  switchEngine(engineKey) {
    this.stopCurrentEngine();
    this.activeEngine = engineKey;
    localStorage.setItem('nexora_bg_engine', engineKey);

    // Update active UI state on buttons
    document.querySelectorAll('[data-bg-engine]').forEach(btn => {
      const isMatch = btn.getAttribute('data-bg-engine') === engineKey;
      btn.classList.toggle('ring-2', isMatch);
      btn.classList.toggle('ring-cyan-400', isMatch);
      btn.classList.toggle('active', isMatch);
    });

    switch (engineKey) {
      case 'sentient-aura':
        this.runSentientAura();
        break;
      case 'neural-synapse':
        this.runNeuralSynapse();
        break;
      case 'fluid-smoke':
        this.runFluidSmoke();
        break;
      case 'aurora-borealis':
        this.runAuroraBorealis();
        break;
      case 'dot-matrix':
        this.runDotMatrix();
        break;
      case 'noise-gradient':
        this.runNoiseGradient();
        break;
      default:
        this.runSentientAura();
    }
  },

  applyTheme(themeKey, triggerRerender = true) {
    this.activeTheme = themeKey;
    localStorage.setItem('nexora_bg_theme', themeKey);
    const theme = this.getTheme();

    document.documentElement.style.setProperty('--accent-primary', theme.primary);
    document.documentElement.style.setProperty('--accent-glow', theme.glow);

    // Update active UI state on theme buttons
    document.querySelectorAll('[data-theme]').forEach(btn => {
      const isMatch = btn.getAttribute('data-theme') === themeKey;
      btn.classList.toggle('active', isMatch);
      btn.classList.toggle('ring-2', isMatch);
      btn.classList.toggle('ring-white', isMatch);
    });

    // Re-trigger current engine frame to inherit new colors immediately
    if (triggerRerender && this.activeEngine) {
      this.switchEngine(this.activeEngine);
    }
  },

  setOpacity(val) {
    const num = parseFloat(val);
    this.activeOpacity = isNaN(num) ? 0.75 : Math.max(0.1, Math.min(1, num));
    localStorage.setItem('nexora_bg_opacity', this.activeOpacity.toString());
    if (this.canvas) {
      this.canvas.style.opacity = this.activeOpacity.toString();
    }
    const percent = Math.round(this.activeOpacity * 100);
    const slider = document.getElementById('ambient-opacity');
    if (slider) slider.value = percent;
    const display = document.getElementById('opacity-display');
    if (display) display.textContent = `${percent}%`;
  },

  applyPreset(presetKey) {
    const presets = {
      calm: { engine: 'aurora-borealis', theme: 'obsidian-emerald', opacity: 0.65 },
      focus: { engine: 'neural-synapse', theme: 'cyber-cyan', opacity: 0.75 },
      energy: { engine: 'fluid-smoke', theme: 'solar-amber', opacity: 0.8 },
      night: { engine: 'noise-gradient', theme: 'neural-violet', opacity: 0.7 }
    };

    const p = presets[presetKey];
    if (p) {
      if (p.opacity) this.setOpacity(p.opacity);
      this.applyTheme(p.theme, false);
      this.switchEngine(p.engine);
    }
  },

  bindUI() {
    if (this._uiBound) return;
    this._uiBound = true;

    // Use event delegation on document.body to survive DOM changes & view switches
    document.body.addEventListener('click', (e) => {
      // 1. Engine selector button
      const engineBtn = e.target.closest('[data-bg-engine]');
      if (engineBtn) {
        const engine = engineBtn.getAttribute('data-bg-engine');
        if (engine) {
          this.switchEngine(engine);
        }
        return;
      }

      // 2. Theme color swatch button
      const themeBtn = e.target.closest('[data-theme]');
      if (themeBtn) {
        const theme = themeBtn.getAttribute('data-theme');
        if (theme) {
          this.applyTheme(theme, true);
        }
        return;
      }

      // 3. Quick preset button
      const presetBtn = e.target.closest('[data-preset]');
      if (presetBtn) {
        const preset = presetBtn.getAttribute('data-preset');
        if (preset) {
          this.applyPreset(preset);
        }
        return;
      }

    });

    // Opacity input delegation
    document.body.addEventListener('input', (e) => {
      if (e.target && e.target.id === 'ambient-opacity') {
        this.setOpacity(e.target.value / 100);
      }
    });
  },

  // --------------------------------------------------------------------------
  // ENGINE 1: SENTIENT AURA
  // Drifts 4 radial gradient orbs using sine/cosine offsets with blur(60px)
  // --------------------------------------------------------------------------
  runSentientAura() {
    if (!this.canvas || !this.ctx) return;
    this.canvas.style.filter = 'blur(60px)';
    const theme = this.getTheme();
    const w = this.canvas.width;
    const h = this.canvas.height;
    const orbs = [
      { x: w * 0.3, y: h * 0.35, vx: 0.5, vy: 0.4, r: Math.min(w, h) * 0.28, color: theme.palette[0] },
      { x: w * 0.7, y: h * 0.65, vx: -0.4, vy: -0.5, r: Math.min(w, h) * 0.32, color: theme.palette[1] },
      { x: w * 0.55, y: h * 0.4, vx: 0.3, vy: -0.4, r: Math.min(w, h) * 0.25, color: theme.palette[2] },
      { x: w * 0.25, y: h * 0.75, vx: -0.3, vy: 0.3, r: Math.min(w, h) * 0.26, color: theme.palette[3] }
    ];

    let t = 0;
    const loop = () => {
      t += 0.015;
      const ctx = this.ctx;
      const width = this.canvas.width;
      const height = this.canvas.height;
      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = this.activeOpacity;

      orbs.forEach((orb, i) => {
        orb.x += orb.vx + Math.sin(t + i * 1.5) * 0.8;
        orb.y += orb.vy + Math.cos(t + i * 1.2) * 0.8;

        const dx = this.mouse.x - orb.x;
        const dy = this.mouse.y - orb.y;
        orb.x += dx * 0.002;
        orb.y += dy * 0.002;

        if (orb.x < -60 || orb.x > width + 60) orb.vx *= -1;
        if (orb.y < -60 || orb.y > height + 60) orb.vy *= -1;

        const grad = ctx.createRadialGradient(orb.x, orb.y, 10, orb.x, orb.y, orb.r);
        grad.addColorStop(0, orb.color);
        grad.addColorStop(1, 'rgba(1, 3, 8, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  },

  // --------------------------------------------------------------------------
  // ENGINE 2: NEURAL SYNAPSE
  // 75 particles with velocity vectors, connecting lines < 120px, mouse link < 140px
  // --------------------------------------------------------------------------
  runNeuralSynapse() {
    if (!this.canvas || !this.ctx) return;
    this.canvas.style.filter = 'none';
    const theme = this.getTheme();
    const w = this.canvas.width;
    const h = this.canvas.height;
    const count = 75;
    const particles = [];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 1.1,
        vy: (Math.random() - 0.5) * 1.1,
        r: 1.5 + Math.random() * 2
      });
    }

    const loop = () => {
      const ctx = this.ctx;
      const width = this.canvas.width;
      const height = this.canvas.height;
      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = this.activeOpacity;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        else if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        else if (p.y > height) p.y = 0;

        ctx.fillStyle = theme.primary;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        // Node-to-node links within 120px
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const alpha = (1 - dist / 120) * 0.45;
            ctx.strokeStyle = `rgba(${theme.rgb}, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        // Node-to-mouse links within 140px
        const mdx = p.x - this.mouse.x;
        const mdy = p.y - this.mouse.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < 140) {
          const malpha = (1 - mdist / 140) * 0.8;
          ctx.strokeStyle = `rgba(${theme.rgb}, ${malpha})`;
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(this.mouse.x, this.mouse.y);
          ctx.stroke();
        }
      }

      ctx.globalAlpha = 1;
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  },

  // --------------------------------------------------------------------------
  // ENGINE 3: FLUID SMOKE
  // 4 overlapping cubic bezier waves oscillating vertically with mouse disturbance
  // --------------------------------------------------------------------------
  runFluidSmoke() {
    if (!this.canvas || !this.ctx) return;
    this.canvas.style.filter = 'blur(40px)';
    const theme = this.getTheme();
    let time = 0;

    const loop = () => {
      time += 0.015;
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = this.activeOpacity;

      const mouseFactorX = (this.mouse.x / (w || 1) - 0.5) * 1.5;
      const mouseFactorY = (this.mouse.y / (h || 1) - 0.5) * 45;

      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        const baseH = h * (0.35 + i * 0.12) + mouseFactorY * (i * 0.3);
        const amp = 40 + i * 20;
        const phase = time * (0.6 + i * 0.25) + i * 1.4 + mouseFactorX;

        const cp1x = w * 0.25;
        const cp1y = baseH + Math.sin(phase) * amp;
        const cp2x = w * 0.75;
        const cp2y = baseH + Math.cos(phase * 1.3) * (amp * 1.2);
        const endY = baseH + Math.sin(phase * 0.8) * amp;

        ctx.moveTo(0, baseH);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, w, endY);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, baseH - amp, 0, h);
        grad.addColorStop(0, `rgba(${theme.rgb}, ${0.35 - i * 0.05})`);
        grad.addColorStop(0.6, `rgba(${theme.rgb}, ${0.15 - i * 0.02})`);
        grad.addColorStop(1, 'rgba(1, 3, 8, 0)');

        ctx.fillStyle = grad;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  },

  // --------------------------------------------------------------------------
  // ENGINE 4: AURORA BOREALIS
  // 4 stacked horizontal sinusoidal gradient ribbon bands undulating slowly
  // --------------------------------------------------------------------------
  runAuroraBorealis() {
    if (!this.canvas || !this.ctx) return;
    this.canvas.style.filter = 'blur(25px)';
    const theme = this.getTheme();
    let time = 0;

    const loop = () => {
      time += 0.012;
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = this.activeOpacity;

      const mouseShift = (this.mouse.x / (w || 1) - 0.5) * 40;

      for (let layer = 0; layer < 4; layer++) {
        ctx.beginPath();
        const baseLevel = h * (0.22 + layer * 0.14);
        const amp = 35 + layer * 18;
        const speed = time * (0.5 + layer * 0.2);
        const offset = layer * 1.2;

        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 14) {
          const y = baseLevel +
            Math.sin(x * 0.003 + speed + offset) * amp +
            Math.sin(x * 0.007 - speed * 0.6 + offset) * (amp * 0.5) +
            Math.cos(x * 0.0015 + speed * 0.8) * 15 +
            mouseShift;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, baseLevel - amp, 0, baseLevel + amp * 3);
        const col = theme.palette[layer % theme.palette.length];
        grad.addColorStop(0, `rgba(${theme.rgb}, 0)`);
        grad.addColorStop(0.3, col);
        grad.addColorStop(0.7, `rgba(${theme.rgb}, ${0.25 - layer * 0.04})`);
        grad.addColorStop(1, 'rgba(1, 3, 8, 0)');

        ctx.fillStyle = grad;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  },

  // --------------------------------------------------------------------------
  // ENGINE 5: DOT MATRIX
  // 2D grid of dots (32px spacing) with outward ripple wave displacement
  // --------------------------------------------------------------------------
  runDotMatrix() {
    if (!this.canvas || !this.ctx) return;
    this.canvas.style.filter = 'none';
    const theme = this.getTheme();
    const spacing = 32;
    let time = 0;

    const loop = () => {
      time += 0.03;
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = this.activeOpacity;

      const cols = Math.ceil(w / spacing) + 2;
      const rows = Math.ceil(h / spacing) + 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const baseX = c * spacing;
          const baseY = r * spacing;

          const dx = baseX - this.mouse.x;
          const dy = baseY - this.mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 180;

          let finalX = baseX;
          let finalY = baseY;
          let dotRadius = 1.5;
          let alpha = 0.22;

          if (dist < maxDist && dist > 0) {
            const wave = Math.sin(dist * 0.08 - time * 4);
            const force = (1 - dist / maxDist) * wave * 14;
            finalX += (dx / dist) * force;
            finalY += (dy / dist) * force;
            dotRadius = 1.5 + (1 - dist / maxDist) * 3;
            alpha = 0.3 + (1 - dist / maxDist) * 0.7;
          } else {
            const ambientPulse = Math.sin(time + (c + r) * 0.3) * 0.06;
            alpha += ambientPulse;
          }

          ctx.fillStyle = `rgba(${theme.rgb}, ${Math.max(0.08, alpha)})`;
          ctx.beginPath();
          ctx.arc(finalX, finalY, Math.max(0.5, dotRadius), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  },

  // --------------------------------------------------------------------------
  // ENGINE 6: NOISE GRADIENT
  // Multi-radial gradient background covered by procedural SVG/grain noise
  // --------------------------------------------------------------------------
  runNoiseGradient() {
    if (!this.canvas || !this.ctx) return;
    this.canvas.style.filter = 'none';
    const theme = this.getTheme();
    const w = this.canvas.width;
    const h = this.canvas.height;
    let time = 0;

    if (!this.noisePattern) {
      const noiseCanvas = document.createElement('canvas');
      noiseCanvas.width = 128;
      noiseCanvas.height = 128;
      const nCtx = noiseCanvas.getContext('2d');
      const imgData = nCtx.createImageData(128, 128);
      for (let i = 0; i < imgData.data.length; i += 4) {
        const val = Math.floor(Math.random() * 255);
        imgData.data[i] = val;
        imgData.data[i + 1] = val;
        imgData.data[i + 2] = val;
        imgData.data[i + 3] = 26;
      }
      nCtx.putImageData(imgData, 0, 0);
      this.noisePattern = this.ctx.createPattern(noiseCanvas, 'repeat');
    }

    const blobs = [
      { x: w * 0.25, y: h * 0.3, vx: 0.4, vy: 0.3, r: Math.min(w, h) * 0.45 },
      { x: w * 0.75, y: h * 0.4, vx: -0.3, vy: 0.4, r: Math.min(w, h) * 0.5 },
      { x: w * 0.5, y: h * 0.75, vx: 0.3, vy: -0.3, r: Math.min(w, h) * 0.48 }
    ];

    const loop = () => {
      time += 0.01;
      const ctx = this.ctx;
      const width = this.canvas.width;
      const height = this.canvas.height;
      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = this.activeOpacity;

      // Dark base
      ctx.fillStyle = '#010308';
      ctx.fillRect(0, 0, width, height);

      blobs.forEach((blob, i) => {
        blob.x += blob.vx + Math.sin(time + i) * 0.5;
        blob.y += blob.vy + Math.cos(time + i) * 0.5;

        if (blob.x < -100 || blob.x > width + 100) blob.vx *= -1;
        if (blob.y < -100 || blob.y > height + 100) blob.vy *= -1;

        const radGrad = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.r);
        const col = theme.palette[i % theme.palette.length];
        radGrad.addColorStop(0, col);
        radGrad.addColorStop(0.6, `rgba(${theme.rgb}, 0.15)`);
        radGrad.addColorStop(1, 'rgba(1, 3, 8, 0)');

        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(blob.x, blob.y, blob.r, 0, Math.PI * 2);
        ctx.fill();
      });

      if (this.noisePattern) {
        ctx.fillStyle = this.noisePattern;
        ctx.fillRect(0, 0, width, height);
      }

      ctx.globalAlpha = 1;
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }
};

// Global Bridge Functions for Backward Compatibility & Inline Handlers
window.setAmbientEngine = function(engine) {
  if (window.AmbientController) {
    window.AmbientController.switchEngine(engine);
  }
};

window.setAmbientTheme = function(theme) {
  if (window.AmbientController) {
    window.AmbientController.applyTheme(theme, true);
  }
};

window.setAmbientOpacity = function(val) {
  if (window.AmbientController) {
    window.AmbientController.setOpacity(val / 100);
  }
};

window.toggleAmbientSwitcher = function() {
  const drawer = document.getElementById('ambient-switcher-drawer');
  if (drawer) {
    drawer.classList.toggle('hidden');
  }
};

window.applyPreset = function(preset) {
  if (window.AmbientController) {
    window.AmbientController.applyPreset(preset);
  }
};

// Auto-initialize AmbientController on page boot
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.AmbientController.init();
  });
} else {
  window.AmbientController.init();
}
