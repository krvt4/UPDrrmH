import React, { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Minus, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * DRRM-H Rule-based Chatbot + Selection-first UX + AI fallback in Chat Mode
 */

// -----------------------------
// Knowledge Base (site-derived)
// -----------------------------
const KB = {
  program: {
    about:
      "DRRM-H stands for Disaster Risk Reduction and Management in Health. The UP Manila DRRM-H Program provides simulation-based disaster preparedness training, supports research, and offers consultancy/public service to strengthen emergency response capacity and resilience.",
    offer:
      "We offer DRRM-H training programs such as BERTST, MCI & Triage Training, and SFATBLS. DRRM-H also focuses on Trainings, Research, and Consultancy.",
    history:
      "The UP Manila DRRM-H Center was officially launched on June 8, 2022 to conduct state-of-the-art disaster simulation trainings and evidence-based research, helping prevent mistakes during actual catastrophic situations.",
    location:
      "The UP Manila DRRM-H Center is located on the 2nd floor of Joaquin Gonzales Hall in UP Manila.",
    vision:
      "Vision: The academe’s center for world-class capacity building, research, and public services in DRRM-H related issues in the Philippines by 2030.",
    mission:
      "Mission (UPDRRMH): UPlift DRRM-H as a lead resource; Develop competence to minimize disaster-related injuries, diseases, and deaths through capacity building, research, and public service; Revitalize stakeholder linkages for collaboration; Reinforce research agendas for evidence-based policies and resilient communities; Motivate internal stakeholders toward sustainability; Harness technological advancement to promote innovative programs and improve quality of life.",
    values:
      "Core Values (HEALTH): Honor, Excellence, Accountability, Leadership, Transformation, Harmony.",
  },
  website: {
    register:
      "To create an account for this website:\n\n1. Click **Login**.\n2. Switch to **Register**.\n3. Fill in your first name, middle initial (optional), last name, gender, address, region, role, email, and password.\n4. Accept the Privacy Policy.\n5. Click **Register**.\n6. Check your email inbox (and spam folder) for the verification link and click it.\n7. After verification, wait for **admin approval** of your account.\n8. Once approved, you can log in using your email and password.\n\nThat’s it 🎉",
    login:
      "To log in to this website, click the Login button, enter your email and password, then sign in. Make sure your email has already been verified and your account has been approved by the admin.",
    forgotPassword:
      "If you forgot your password, click the Forgot Password link in the login form, enter your email address, and check your inbox for the password reset email.",
    approval:
      "After creating an account, you must first verify your email and then wait for admin approval before you can fully log in and use your account.",
  },
  trainings: {
    bertst: {
      name: "BERTST (Basic Emergency Response Team Simulation Training)",
      what:
        "BERTST enhances participants’ skills in command, communication, and collaboration during emergency situations.",
      do: [
        "Simulation exercises (hands-on emergency response drills)",
        "Command/leadership training in crisis situations",
        "Communication drills to improve coordination",
        "Collaboration workshops to enhance teamwork",
      ],
      fee: "Php 5,500 per participant",
      scheduleNote:
        "Training dates are listed on the BERTST page. For the most updated schedule, please check the training page or News section.",
      join:
        "To join BERTST, open the BERTST training page and click “JOIN NOW!” or use the QR/registration form there.",
    },
    mci: {
      name: "MCI & Triage Training (Mass Casualty Incident and Triage)",
      what:
        "This training familiarizes participants with MCI concepts and different triage system algorithms through simulation exercises, helping them apply disaster triage correctly and assign victims to appropriate categories.",
      definition:
        "MCI (Mass Casualty Incident) refers to an emergency where the number of victims exceeds available medical resources, requiring an organized response to prioritize care.",
      do: [
        "Understanding MCI and triage concepts",
        "Learning triage systems and algorithms",
        "Practical hands-on training",
        "Case-scenario simulations",
        "Team-based exercises",
        "Decision-making and critical thinking",
      ],
      fee: "PHP 5,500 (Early), PHP 6,000 (Regular), PHP 6,500 (Late)",
      scheduleNote:
        "Training dates are listed on the MCI page. For the most updated schedule, please check the training page or News section.",
      join:
        "To join MCI training, open the MCI training page and click “JOIN NOW!” or use the QR/registration form there.",
    },
    sfatbls: {
      name: "SFATBLS (Standard First Aid and Basic Life Support)",
      what:
        "SFATBLS equips participants with essential life-saving skills such as CPR, wound care, and emergency simulations.",
      do: [
        "CPR and rescue breathing drills",
        "Bleeding control and bandaging",
        "Shock and fracture management",
        "Scene safety and patient transport",
      ],
      fee: "Php 7,000 per participant",
      scheduleNote:
        "SFATBLS schedule updates will be announced soon—please check the SFATBLS page/News or contact the team for the latest.",
      join:
        "To join SFATBLS, open the SFATBLS training page and click “JOIN NOW!” or use the QR/registration form there.",
    },
  },
  news: {
    general:
      "For the latest announcements (trainings, registrations, and events), please visit the News section of the website. If you tell me the topic (BERTST / MCI / SFATBLS / events), I can guide you.",
    interns:
      "DRRM-H congratulates interns/OJT trainees who contributed to disaster preparedness, health risk management, and community resilience initiatives.",
    planning:
      "DRRM-H held its 2025 Strategic Planning Session (April 2–4, 2025) in Los Baños, Laguna—reflecting on milestones and shaping strategic directions for the year ahead.",
  },
  contact: {
    how:
      "You can contact the DRRM-H Program through the Contact section of the website and leave a message. For registration questions, you can also use the JOIN NOW links/QR codes on each training page.",
    categories:
      "Contact categories include: General Inquiry, Training/Registration, Technical Support, Partnership/Collaboration, and Feedback.",
  },
};

// -----------------------------
// Language utilities
// -----------------------------
const REWRITE_RULES = [
  [/\br\s*u\b/g, "are you"],
  [/\bru\b/g, "are you"],
  [/\bare\s*u\b/g, "are you"],
  [/\bu\b/g, "you"],
  [/\br\b/g, "are"],
  [/\bpls\b|\bplz\b/g, "please"],
  [/\bthx\b/g, "thanks"],
  [/\bty\b/g, "thank you"],
  [/\bwhats\b|\bwhat's\b/g, "what is"],
  [/\bim\b/g, "i'm"],
  [/\bsignup\b/g, "sign up"],
  [/\blogin\b/g, "log in"],
];

function normalize(s) {
  let t = String(s || "").toLowerCase().trim();
  t = t.replace(/\s+/g, " ");
  for (const [re, rep] of REWRITE_RULES) t = t.replace(re, rep);
  t = t.replace(/[!?.,;:()[\]{}"']/g, "");
  t = t.replace(/\s+/g, " ").trim();
  return t;
}

function canonicalizeUserText(s) {
  const t = normalize(s);

  if (t === "training" || t === "train" || t === "trainings")
    return "trainings";

  if (
    t === "fee schedule" ||
    t === "fees schedule" ||
    t === "fees and schedule"
  )
    return "fees & schedule";

  if (
    t === "create account" ||
    t === "create an account" ||
    t === "register account" ||
    t === "register an account" ||
    t === "make an account" ||
    t === "make account" ||
    t === "sign up" ||
    t === "sign up account"
  )
    return "create account";

  if (t === "about" || t === "about drrmh" || t === "about drrm h")
    return "about drrm-h";

  if (t === "news" || t === "updates") return "news & updates";

  if (t === "general inquiry" || t === "other" || t === "others")
    return "general inquiry";

  return t;
}

function pickVariant(variants, seed) {
  const idx = Math.abs(hashString(seed)) % variants.length;
  return variants[idx];
}

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h;
}

const GREETINGS = [
  "hi",
  "hello",
  "hey",
  "hi there",
  "hello there",
  "good morning",
  "good afternoon",
  "good evening",
];
const GOODBYES = ["bye", "goodbye", "see you", "see ya", "thanks bye"];
const THANKS = [
  "thanks",
  "thank you",
  "ty",
  "thanks a lot",
  "thank you so much",
];
const CONFIRMATIONS = [
  "ok",
  "okay",
  "got it",
  "alright",
  "sure",
  "noted",
  "okay got it",
];
const SAFE_SHORT_REPLIES = [
  "yes",
  "yeah",
  "yep",
  "no",
  "nope",
  "ok",
  "okay",
  "sure",
  "please",
  "go on",
  "continue",
  "more",
  "i see",
  "oh",
  "oh okay",
  "oh ok",
  "alright",
  "noted",
  "hmm",
  "huh",
  "aha",
  "thanks",
  "thank you",
];

function isSmallTalk(raw) {
  const t = normalize(raw);
  if (!t) return true;
  if (SAFE_SHORT_REPLIES.includes(t)) return true;
  if (GREETINGS.some((g) => t === g || t.startsWith(g))) return true;
  if (THANKS.some((w) => t.includes(w))) return true;
  if (GOODBYES.some((g) => t.includes(g))) return true;
  if (CONFIRMATIONS.includes(t)) return true;
  return false;
}

function isQuestion(t) {
  return (
    String(t || "").includes("?") ||
    t.startsWith("what") ||
    t.startsWith("how") ||
    t.startsWith("when") ||
    t.startsWith("where") ||
    t.startsWith("why") ||
    t.startsWith("can you") ||
    t.startsWith("could you") ||
    t.startsWith("do you") ||
    t.startsWith("tell me")
  );
}

const SCOPE_KEYWORDS = [
  "drrm",
  "drrm-h",
  "drrmh",
  "up manila",
  "joaquin gonzales",
  "bertst",
  "mci",
  "triage",
  "sfatbls",
  "first aid",
  "basic life support",
  "cpr",
  "training",
  "trainings",
  "schedule",
  "date",
  "dates",
  "fee",
  "fees",
  "registration",
  "register",
  "join",
  "news",
  "updates",
  "announcement",
  "events",
  "contact",
  "email",
  "message",
  "inquiry",
  "e-learning",
  "elearning",
  "manual",
  "shop",
  "cart",
  "checkout",
  "order",
  "profile",
  "website",
  "page",
  "site",
  "account",
  "login",
  "log in",
  "sign in",
  "sign up",
  "password",
  "forgot password",
  "reset password",
  "link",
  "create account",
];

function isInScope(raw) {
  const t = normalize(raw);
  if (!t) return true;
  if (isSmallTalk(raw)) return true;
  return SCOPE_KEYWORDS.some((k) => t.includes(k));
}

function isBotIdentityQuestion(raw) {
  const t = normalize(raw);
  if (
    t.includes("are you a bot") ||
    t.includes("are you bot") ||
    t.includes("are you an ai") ||
    t.includes("are you ai") ||
    t.includes("are you human") ||
    t.includes("are you real") ||
    t.includes("real person") ||
    t.includes("what are you") ||
    t.includes("who are you") ||
    t.includes("chatgpt") ||
    t.includes("openai")
  ) {
    return true;
  }

  return (
    /\b(are you|you)\b.*\b(bot|ai)\b/.test(t) ||
    /\b(bot|ai)\b.*\b(are you|you)\b/.test(t)
  );
}

function isUserCorrection(raw) {
  const t = normalize(raw);
  return (
    t === "wrong" ||
    t.includes("thats wrong") ||
    t.includes("thats incorrect") ||
    t.includes("that's wrong") ||
    t.includes("incorrect") ||
    t.includes("not true") ||
    t.includes("you are wrong") ||
    t.includes("nope") ||
    t.includes("not really")
  );
}

function isUserPersistent(raw) {
  const t = normalize(raw);
  return (
    t.includes("answer me") ||
    t.includes("just tell me") ||
    t.includes("stop dodging") ||
    t.includes("be honest") ||
    t.includes("why wont you answer") ||
    t.includes("why won't you answer") ||
    t.includes("tell me the truth") ||
    t.includes("are you sure")
  );
}

function isToneOnlyShortReply(raw) {
  const t = normalize(raw);
  if (!t) return true;
  if (SAFE_SHORT_REPLIES.includes(t)) return true;
  const words = t.split(/\s+/).filter(Boolean);
  return words.length <= 2 && !isQuestion(t);
}

// -----------------------------
// Intent helpers
// -----------------------------
function looksLikeCreateAccountIntent(raw) {
  const t = normalize(raw);

  const accountWords = [
    "account",
    "website",
    "site",
    "page",
    "portal",
    "login",
    "log in",
    "sign in",
    "here",
    "this",
  ];

  const creationPhrases = [
    "create account",
    "create an account",
    "make an account",
    "make account",
    "open an account",
    "open account",
    "register",
    "register account",
    "register an account",
    "sign up",
    "sign me up",
    "how do i register",
    "how can i register",
    "how to register",
    "how do i sign up",
    "how can i sign up",
    "how to sign up",
    "how do i create an account",
    "how can i create an account",
    "how to create an account",
  ];

  if (creationPhrases.some((p) => t.includes(p))) return true;

  if (
    (t.includes("register") || t.includes("sign up") || t.includes("create")) &&
    accountWords.some((w) => t.includes(w))
  ) {
    return true;
  }

  return false;
}

function looksLikeLoginIntent(raw) {
  const t = normalize(raw);
  return (
    (t.includes("login") ||
      t.includes("log in") ||
      t.includes("sign in") ||
      t.includes("log me in")) &&
    (t.includes("account") ||
      t.includes("website") ||
      t.includes("site") ||
      t.includes("page") ||
      t.includes("here") ||
      t.includes("this") ||
      t === "login" ||
      t === "log in" ||
      t === "sign in")
  );
}

function looksLikeForgotPasswordIntent(raw) {
  const t = normalize(raw);
  return (
    t.includes("forgot password") ||
    t.includes("reset password") ||
    (t.includes("password") &&
      (t.includes("forgot") || t.includes("reset") || t.includes("change")))
  );
}

function looksLikeApprovalIntent(raw) {
  const t = normalize(raw);
  return (
    (t.includes("approval") ||
      t.includes("approved") ||
      t.includes("admin approval") ||
      t.includes("pending")) &&
    (t.includes("account") ||
      t.includes("register") ||
      t.includes("registration") ||
      t.includes("login") ||
      t.includes("website"))
  );
}

// -----------------------------
// Quick replies
// -----------------------------
const ROOT_QUICK_REPLIES = [
  "Trainings",
  "Fees & Schedule",
  "Create Account",
  "About DRRM-H",
  "News & Updates",
  "Contact",
  "General Inquiry",
];

const SUB_REPLIES = {
  trainings: [
    "BERTST",
    "MCI & Triage",
    "SFATBLS",
    "How do I join a training?",
    "General Inquiry",
    "Back to categories",
  ],
  fees: [
    "BERTST fee",
    "MCI fee",
    "SFATBLS fee",
    "General Inquiry",
    "Back to categories",
  ],
  schedule: [
    "BERTST schedule",
    "MCI schedule",
    "SFATBLS schedule",
    "General Inquiry",
    "Back to categories",
  ],
  about: [
    "History",
    "Mission",
    "Vision",
    "Core Values",
    "Location",
    "General Inquiry",
    "Back to categories",
  ],
  news: [
    "Training announcements",
    "Recent events",
    "Internship/OJT",
    "General Inquiry",
    "Back to categories",
  ],
  contact: [
    "How can I contact DRRM-H?",
    "Contact categories",
    "General Inquiry",
    "Back to categories",
  ],
};

// -----------------------------
// Intent table
// -----------------------------
const INTENTS = [
  {
    id: "identity",
    priority: 100,
    match: (t) => isBotIdentityQuestion(t),
    respond: ({ t, identityAskCount }) => {
      if (identityAskCount < 2 && !isUserPersistent(t)) {
        return pickVariant(
          [
            "I’m here to help with DRRM-H website questions 😊 You can ask about trainings, fees, schedules, registration, news, contact, or website account access.",
            "I’m your DRRM-H website assistant 😊 Ask me about trainings, fees, schedules, registration, news, contact, or website account access.",
          ],
          t
        );
      }

      return "I’m a chatbot assistant (not a human). I can help only with DRRM-H and this website (trainings, fees, schedules, registration, news, contact, login, and account registration).";
    },
  },
];

// -----------------------------
// Brain (rule-based)
// -----------------------------
function findAnswer(text, context = {}) {
  const t = normalize(text);
  const identityAskCount = context.identityAskCount || 0;

  if (!isInScope(t) && isQuestion(t) && !isBotIdentityQuestion(t)) {
    return "I can only answer DRRM-H + this website questions (trainings, fees, schedules, registration, news, contact, login, and account concerns). Please ask within that scope.";
  }

  if (["yes", "yeah", "yep", "sure", "ok", "okay"].includes(t)) {
    if (context.lastTopic === "bertst") {
      return `${KB.trainings.bertst.name}: ${KB.trainings.bertst.what}\n\nWhat we do:\n- ${KB.trainings.bertst.do.join(
        "\n- "
      )}\n\nFee: ${
        KB.trainings.bertst.fee
      }. Would you like the schedule or how to register?`;
    }

    if (context.lastTopic === "mci") {
      return `${KB.trainings.mci.name}: ${KB.trainings.mci.what}\n\nWhat we do:\n- ${KB.trainings.mci.do.join(
        "\n- "
      )}\n\nFees: ${
        KB.trainings.mci.fee
      }. Would you like the schedule or how to register?`;
    }

    if (context.lastTopic === "sfatbls") {
      return `${KB.trainings.sfatbls.name}: ${KB.trainings.sfatbls.what}\n\nWhat we do:\n- ${KB.trainings.sfatbls.do.join(
        "\n- "
      )}\n\nFee: ${
        KB.trainings.sfatbls.fee
      }. Would you like the schedule or how to register?`;
    }

    return "Got it 👍 Which training would you like details on: BERTST, MCI & Triage, or SFATBLS?";
  }

  const matched = INTENTS.slice()
    .sort((a, b) => b.priority - a.priority)
    .find((it) => it.match(t));

  if (matched) return matched.respond({ t, identityAskCount });

  if (GREETINGS.some((g) => t === g || t.startsWith(g))) {
    return "Hi! 👋 How can I help you today with DRRM-H?";
  }

  if (GOODBYES.some((g) => t.includes(g))) {
    return pickVariant(
      [
        "Thanks for chatting! 👋 If you need DRRM-H website help again, just open DRRM-H Help.",
        "Goodbye! 👋 Come back anytime for DRRM-H website info.",
      ],
      t
    );
  }

  if (THANKS.some((w) => t.includes(w))) {
    return pickVariant(
      [
        "You’re welcome! 😊 What would you like to check next—trainings, fees, schedules, website registration, or contact?",
      ],
      t
    );
  }

  if (CONFIRMATIONS.includes(t)) {
    return pickVariant(
      [
        "Okay 😊 What would you like to do next—trainings, fees, schedules, website registration, news, or contact?",
      ],
      t
    );
  }

  const asksFee = ["fee", "fees", "how much", "price", "cost"].some((k) =>
    t.includes(k)
  );

  const asksSchedule = ["schedule", "date", "dates", "when", "calendar"].some(
    (k) => t.includes(k)
  );

  const asksJoin = ["join", "register", "registration", "sign up", "enroll"].some(
    (k) => t.includes(k)
  );

  const asksContact = [
    "contact",
    "email",
    "phone",
    "reach",
    "inquiry",
    "message",
  ].some((k) => t.includes(k));

  const asksNews = [
    "news",
    "updates",
    "announcement",
    "announcements",
    "recent",
    "whats new",
    "what is new",
  ].some((k) => t.includes(k));

  const asksWebsiteRegister = looksLikeCreateAccountIntent(t);
  const asksWebsiteLogin = looksLikeLoginIntent(t);
  const asksForgotWebsitePassword = looksLikeForgotPasswordIntent(t);
  const asksWebsiteApproval = looksLikeApprovalIntent(t);

  const isBertst = ["bertst", "berts", "bert"].some((k) => t.includes(k));
  const isMci = ["mci", "mass casualty", "triage"].some((k) => t.includes(k));
  const isSfatbls = ["sfatbls", "first aid", "basic life support", "cpr"].some(
    (k) => t.includes(k)
  );

  if (
    t.includes("what do you offer") ||
    t.includes("programs") ||
    t.includes("services") ||
    t === "trainings"
  ) {
    return `${KB.program.offer} Which one would you like to know more about: BERTST, MCI & Triage, or SFATBLS?`;
  }

  if (
    t.includes("what is drrm") ||
    t.includes("drrmh") ||
    t.includes("drrm h") ||
    t.includes("about drrm")
  ) {
    return KB.program.about;
  }

  if (t === "history" || t.includes("launched") || t.includes("established")) {
    return KB.program.history;
  }

  if (t === "location" || t.includes("where is")) {
    return KB.program.location;
  }

  if (t === "vision") return KB.program.vision;
  if (t === "mission") return KB.program.mission;
  if (t === "core values" || t === "values") return KB.program.values;

  if (asksNews || t === "news updates" || t === "news & updates") {
    return `${KB.news.general} Want updates about trainings, events, or internship/OJT?`;
  }

  if (t.includes("intern") || t.includes("ojt") || t.includes("internship")) {
    return KB.news.interns;
  }

  if (
    t.includes("strategic planning") ||
    t.includes("planning session") ||
    t.includes("events")
  ) {
    return KB.news.planning;
  }

  if (asksContact || t === "contact") {
    return `${KB.contact.how} ${KB.contact.categories}`;
  }

  if (t.includes("contact categories")) {
    return KB.contact.categories;
  }

  // -----------------------------
  // Website / account registration logic
  // -----------------------------
  if (asksWebsiteRegister) return KB.website.register;
  if (asksWebsiteLogin) return KB.website.login;
  if (asksForgotWebsitePassword) return KB.website.forgotPassword;
  if (asksWebsiteApproval) return KB.website.approval;

  // -----------------------------
  // Generic training registration
  // -----------------------------
  if (asksJoin && !isBertst && !isMci && !isSfatbls) {
    return "To join a training program, open the training page (BERTST / MCI / SFATBLS) and click “JOIN NOW!” or use the QR/registration form provided there. Which training are you interested in?";
  }

  if (isBertst || t === "bertst") {
    if (asksFee) return `BERTST fee: ${KB.trainings.bertst.fee}.`;
    if (asksSchedule)
      return `BERTST schedule: ${KB.trainings.bertst.scheduleNote}`;
    if (asksJoin) return KB.trainings.bertst.join;

    return `${KB.trainings.bertst.name}: ${KB.trainings.bertst.what}\n\nWhat we do:\n- ${KB.trainings.bertst.do.join(
      "\n- "
    )}\n\nFee: ${
      KB.trainings.bertst.fee
    }. Would you like the schedule or how to register?`;
  }

  if (isMci || t === "mci triage" || t === "mci & triage" || t === "mci") {
    if (t.includes("what is mci") || t.includes("define mci"))
      return KB.trainings.mci.definition;
    if (asksFee) return `MCI training fees: ${KB.trainings.mci.fee}.`;
    if (asksSchedule) return `MCI schedule: ${KB.trainings.mci.scheduleNote}`;
    if (asksJoin) return KB.trainings.mci.join;

    return `${KB.trainings.mci.name}: ${KB.trainings.mci.what}\n\nWhat we do:\n- ${KB.trainings.mci.do.join(
      "\n- "
    )}\n\nFees: ${
      KB.trainings.mci.fee
    }. Would you like the schedule or how to register?`;
  }

  if (isSfatbls || t === "sfatbls") {
    if (asksFee) return `SFATBLS fee: ${KB.trainings.sfatbls.fee}.`;
    if (asksSchedule)
      return `SFATBLS schedule: ${KB.trainings.sfatbls.scheduleNote}`;
    if (asksJoin) return KB.trainings.sfatbls.join;

    return `${KB.trainings.sfatbls.name}: ${KB.trainings.sfatbls.what}\n\nWhat we do:\n- ${KB.trainings.sfatbls.do.join(
      "\n- "
    )}\n\nFee: ${
      KB.trainings.sfatbls.fee
    }. Would you like the schedule or how to register?`;
  }

  if (asksFee && !isBertst && !isMci && !isSfatbls) {
    return "Which training fee would you like to check: BERTST (Php 5,500), MCI (Php 5,500/6,000/6,500), or SFATBLS (Php 7,000)?";
  }

  if (asksSchedule && !isBertst && !isMci && !isSfatbls) {
    return "Which training schedule would you like to check: BERTST, MCI, or SFATBLS?";
  }

  if (isQuestion(t)) {
    return "Please choose a DRRM-H website topic using the buttons below. If it’s different but still DRRM-H/website-related, tap General Inquiry and type it.";
  }

  return pickVariant(
    [
      "Please choose a topic using the buttons below. If you need something else related to DRRM-H/this website, tap General Inquiry.",
      "I can help best when you select a topic below. If your question is DRRM-H/website-related, tap General Inquiry.",
    ],
    t
  );
}

async function askAI({ userText, messages, lastTopic, quickMode }) {
  const res = await fetch("http://127.0.0.1:8000/api/drrmh-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "intent",
      userText,
      recent: messages.slice(-8),
      context: { lastTopic, quickMode },
      kb: KB,
      intentOptions: [
        "website_register",
        "website_login",
        "website_forgot_password",
        "website_account_approval",
        "training_register",
        "bertst_info",
        "mci_info",
        "sfatbls_info",
        "fees",
        "schedule",
        "contact",
        "news",
        "program_about",
        "program_location",
        "program_history",
        "program_mission",
        "program_vision",
        "program_values",
        "unknown",
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("AI error response:", res.status, errText);
    throw new Error(`AI request failed: ${res.status} ${errText}`);
  }

  const data = await res.json();

  return {
    intent: data.intent || "unknown",
    reply: data.reply || "",
  };
}

function getReplyFromIntent(intent, userTextRaw = "") {
  const t = normalize(userTextRaw);

  switch (intent) {
    case "website_register":
      return KB.website.register;

    case "website_login":
      return KB.website.login;

    case "website_forgot_password":
      return KB.website.forgotPassword;

    case "website_account_approval":
      return KB.website.approval;

    case "training_register":
      if (t.includes("bertst")) return KB.trainings.bertst.join;
      if (t.includes("mci") || t.includes("triage")) return KB.trainings.mci.join;
      if (
        t.includes("sfatbls") ||
        t.includes("first aid") ||
        t.includes("basic life support")
      ) {
        return KB.trainings.sfatbls.join;
      }
      return "To join a training program, open the training page (BERTST / MCI / SFATBLS) and click “JOIN NOW!” or use the QR/registration form provided there. Which training are you interested in?";

    case "bertst_info":
      return `${KB.trainings.bertst.name}: ${KB.trainings.bertst.what}\n\nWhat we do:\n- ${KB.trainings.bertst.do.join(
        "\n- "
      )}\n\nFee: ${KB.trainings.bertst.fee}. Would you like the schedule or how to register?`;

    case "mci_info":
      return `${KB.trainings.mci.name}: ${KB.trainings.mci.what}\n\nWhat we do:\n- ${KB.trainings.mci.do.join(
        "\n- "
      )}\n\nFees: ${KB.trainings.mci.fee}. Would you like the schedule or how to register?`;

    case "sfatbls_info":
      return `${KB.trainings.sfatbls.name}: ${KB.trainings.sfatbls.what}\n\nWhat we do:\n- ${KB.trainings.sfatbls.do.join(
        "\n- "
      )}\n\nFee: ${KB.trainings.sfatbls.fee}. Would you like the schedule or how to register?`;

    case "fees":
      if (t.includes("bertst")) return `BERTST fee: ${KB.trainings.bertst.fee}.`;
      if (t.includes("mci") || t.includes("triage"))
        return `MCI training fees: ${KB.trainings.mci.fee}.`;
      if (
        t.includes("sfatbls") ||
        t.includes("first aid") ||
        t.includes("basic life support")
      ) {
        return `SFATBLS fee: ${KB.trainings.sfatbls.fee}.`;
      }
      return "Which training fee would you like to check: BERTST (Php 5,500), MCI (Php 5,500/6,000/6,500), or SFATBLS (Php 7,000)?";

    case "schedule":
      if (t.includes("bertst"))
        return `BERTST schedule: ${KB.trainings.bertst.scheduleNote}`;
      if (t.includes("mci") || t.includes("triage"))
        return `MCI schedule: ${KB.trainings.mci.scheduleNote}`;
      if (
        t.includes("sfatbls") ||
        t.includes("first aid") ||
        t.includes("basic life support")
      ) {
        return `SFATBLS schedule: ${KB.trainings.sfatbls.scheduleNote}`;
      }
      return "Which training schedule would you like to check: BERTST, MCI, or SFATBLS?";

    case "contact":
      return `${KB.contact.how} ${KB.contact.categories}`;

    case "news":
      return `${KB.news.general} Want updates about trainings, events, or internship/OJT?`;

    case "program_about":
      return KB.program.about;

    case "program_location":
      return KB.program.location;

    case "program_history":
      return KB.program.history;

    case "program_mission":
      return KB.program.mission;

    case "program_vision":
      return KB.program.vision;

    case "program_values":
      return KB.program.values;

    default:
      return "";
  }
}

// -----------------------------
// Component
// -----------------------------
const INITIAL_MESSAGES = [
  { role: "bot", text: "Hi! 👋 Please choose a topic below to get started." },
];

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const [mode, setMode] = useState("select"); // select | chat
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [quickMode, setQuickMode] = useState("root");
  const [lastTopic, setLastTopic] = useState("");
  const [identityAskCount, setIdentityAskCount] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);

  const lastSentRef = useRef({ text: "", at: 0 });
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const canSend = useMemo(() => input.trim().length > 0, [input]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, aiLoading]);

  const pushBot = (text) =>
    setMessages((m) => [...m, { role: "bot", text }]);

  const enableChat = (opts = { announce: true }) => {
    setMode("chat");
    if (opts?.announce) {
      pushBot("You can now type your DRRM-H related question below.");
    }
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const send = async (textOverride) => {
    const userTextRaw = (textOverride ?? input).trim();
    if (!userTextRaw || aiLoading) return;

    if (mode === "select" && !textOverride) {
      pushBot(
        "Please use the buttons below. If your concern is not listed but still DRRM-H/website-related, tap General Inquiry to type (or click the textbox)."
      );
      return;
    }

    const now = Date.now();
    if (
      lastSentRef.current.text === userTextRaw &&
      now - lastSentRef.current.at < 400
    ) {
      return;
    }
    lastSentRef.current = { text: userTextRaw, at: now };

    const lt = canonicalizeUserText(userTextRaw);

    if (lt === "back to categories") {
      setQuickMode("root");
      setLastTopic("");
      setInput("");
      return;
    }

    setMessages((m) => [...m, { role: "user", text: userTextRaw }]);
    setInput("");

    if (lt === "general inquiry") {
      enableChat({ announce: true });
      return;
    }

    if (isUserCorrection(lt)) {
      pushBot(
        "Sorry about that — thanks for correcting me. 🙏 What part should I fix (fees, schedule, registration, trainings, program info)?"
      );
      return;
    }

    if (isBotIdentityQuestion(lt)) setIdentityAskCount((c) => c + 1);
    else setIdentityAskCount(0);

    // -----------------------
    // SELECTION MODE (NO AI)
    // -----------------------
    if (mode === "select") {
      if (lt === "trainings") {
        setQuickMode("trainings");
        setLastTopic("trainings");
        setTimeout(
          () =>
            pushBot(
              "Sure! Which training would you like: BERTST, MCI & Triage, or SFATBLS?"
            ),
          150
        );
        return;
      }

      if (lt === "fees & schedule") {
        setQuickMode("fees");
        setLastTopic("fees");
        setTimeout(
          () =>
            pushBot(
              "Got it—do you want to check fees or schedules? You can pick a training below."
            ),
          150
        );
        return;
      }

      if (lt === "create account") {
        setLastTopic("website_register");
        setTimeout(() => pushBot(KB.website.register), 150);
        return;
      }

      if (lt === "about drrm-h") {
        setQuickMode("about");
        setLastTopic("about");
        setTimeout(
          () =>
            pushBot(
              "What would you like to know about DRRM-H: History, Mission, Vision, Core Values, or Location?"
            ),
          150
        );
        return;
      }

      if (lt === "news & updates") {
        setQuickMode("news");
        setLastTopic("news");
        setTimeout(
          () =>
            pushBot(
              "What kind of updates are you looking for: training announcements, recent events, or internship/OJT?"
            ),
          150
        );
        return;
      }

      if (lt === "contact") {
        setQuickMode("contact");
        setLastTopic("contact");
        setTimeout(
          () =>
            pushBot(
              "How can we help—general inquiry, training/registration, technical support, partnership/collaboration, or feedback?"
            ),
          150
        );
        return;
      }

      if (lt.includes("schedule")) setQuickMode("schedule");
      if (lt.includes("fee")) setQuickMode("fees");

      if (lt.includes("bertst")) setLastTopic("bertst");
      if (lt.includes("mci")) setLastTopic("mci");
      if (lt.includes("sfatbls")) setLastTopic("sfatbls");

      const reply = findAnswer(userTextRaw, { lastTopic, identityAskCount });
      setTimeout(() => pushBot(reply), 150);
      return;
    }

    // -----------------------
    // CHAT MODE (AI intent + KB answer)
    // -----------------------
    if (lt.includes("schedule")) setQuickMode("schedule");
    if (lt.includes("fee")) setQuickMode("fees");

    if (lt.includes("bertst")) setLastTopic("bertst");
    if (lt.includes("mci")) setLastTopic("mci");
    if (lt.includes("sfatbls")) setLastTopic("sfatbls");
    if (looksLikeCreateAccountIntent(lt)) setLastTopic("website_register");

    const normalized = normalize(userTextRaw);
    const isIdentity = isBotIdentityQuestion(userTextRaw);
    const isSmall = isSmallTalk(userTextRaw);
    const looksLikeQuestion = isQuestion(normalized);

    if (!isInScope(userTextRaw) && looksLikeQuestion && !isIdentity && !isSmall) {
      pushBot(
        "I can only answer DRRM-H related questions (trainings, fees, schedules, registration, news, contact, login, and account concerns). Please ask within that scope."
      );
      return;
    }

    try {
      setAiLoading(true);

      const snapshot = [...messages, { role: "user", text: userTextRaw }];
      const aiResult = await askAI({
        userText: userTextRaw,
        messages: snapshot,
        lastTopic,
        quickMode,
      });

      const mappedReply = getReplyFromIntent(aiResult.intent, userTextRaw);

      // stronger fallback for create-account intent even if AI says unknown
      if (!mappedReply && looksLikeCreateAccountIntent(userTextRaw)) {
        pushBot(KB.website.register);
      } else if (mappedReply) {
        pushBot(mappedReply);
      } else if (aiResult.reply && aiResult.reply.trim()) {
        pushBot(aiResult.reply);
      } else {
        const ruleReply = findAnswer(userTextRaw, { lastTopic, identityAskCount });
        pushBot(
          ruleReply ||
            "I didn’t get a usable reply. Please rephrase your DRRM-H website question."
        );
      }
    } catch (e) {
      const ruleReply = findAnswer(userTextRaw, { lastTopic, identityAskCount });

      if (ruleReply) {
        pushBot(ruleReply);
      } else {
        pushBot(
          "AI is temporarily unavailable. You can still use the buttons below, or try again in a moment."
        );
      }

      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  const handleMinimize = () => {
    setOpen(false);
    setConfirmExit(false);
  };

  const handleExit = () => setConfirmExit(true);

  const confirmExitYes = () => {
    setMessages(INITIAL_MESSAGES);
    setInput("");
    setConfirmExit(false);
    setOpen(false);
    setQuickMode("root");
    setLastTopic("");
    setIdentityAskCount(0);
    setMode("select");
    setAiLoading(false);
  };

  const activeReplies =
    quickMode === "root"
      ? ROOT_QUICK_REPLIES
      : SUB_REPLIES[quickMode] || ROOT_QUICK_REPLIES;

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-[#7b1113] text-white px-4 py-3 shadow-lg hover:bg-[#3b0000] active:scale-[0.98] transition"
        aria-label="Open help chat"
        type="button"
      >
        <MessageCircle size={18} />
        <span className="font-semibold">Help</span>
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-[320px] sm:w-[360px] rounded-2xl shadow-2xl border border-zinc-200 bg-white overflow-hidden">
          <div className="bg-[#7b1113] text-white px-4 py-3 font-semibold flex items-center justify-between">
            <span>DRRM-H HelpDesk</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleMinimize}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                title="Minimize"
                type="button"
              >
                <Minus size={16} />
              </button>
              <button
                onClick={handleExit}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                title="Close"
                type="button"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="px-3 py-2 border-b border-zinc-200 text-[11px] text-zinc-600">
            Mode:{" "}
            <span className="font-semibold">
              {mode === "select"
                ? "Selection (buttons only)"
                : "Chat (typing enabled)"}
            </span>
            {aiLoading && (
              <span className="ml-2 text-[#7b1113] font-semibold">
                • AI is replying…
              </span>
            )}
          </div>

          <div className="h-[300px] p-3 overflow-y-auto space-y-2">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-5 ${
                    m.role === "user"
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-900"
                  }`}
                >
                  {m.role === "bot" ? (
                    <div className="text-sm leading-5">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => (
                            <p className="m-0 whitespace-pre-wrap text-sm leading-5">
                              {children}
                            </p>
                          ),
                          ul: ({ children }) => (
                            <ul className="m-0 mt-2 list-disc pl-5 text-sm leading-5">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="m-0 mt-2 list-decimal pl-5 text-sm leading-5">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="m-0 text-sm leading-5">{children}</li>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-semibold text-sm leading-5">
                              {children}
                            </strong>
                          ),
                          a: ({ children, ...props }) => (
                            <a
                              {...props}
                              className="text-[#7b1113] underline text-sm leading-5"
                              target="_blank"
                              rel="noreferrer"
                            >
                              {children}
                            </a>
                          ),
                        }}
                      >
                        {m.text}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <span className="whitespace-pre-line text-sm leading-5">
                      {m.text}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {aiLoading && (
              <div className="flex justify-start">
                <div className="bg-zinc-100 text-zinc-700 rounded-2xl px-3 py-2 text-sm leading-5">
                  <span className="inline-flex gap-1 items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="px-3 pb-2">
            <div className="flex flex-wrap gap-2">
              {activeReplies.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-[11px] px-2 py-1 rounded-full border border-zinc-300 bg-white hover:bg-zinc-100"
                  type="button"
                  disabled={aiLoading}
                >
                  {q}
                </button>
              ))}
            </div>

            {quickMode === "fees" && (
              <div className="mt-2">
                <button
                  onClick={() => setQuickMode("schedule")}
                  className="text-[11px] px-2 py-1 rounded-full border border-zinc-300 bg-white hover:bg-zinc-100"
                  type="button"
                  disabled={aiLoading}
                >
                  Switch to schedules →
                </button>
              </div>
            )}

            {quickMode === "schedule" && (
              <div className="mt-2">
                <button
                  onClick={() => setQuickMode("fees")}
                  className="text-[11px] px-2 py-1 rounded-full border border-zinc-300 bg-white hover:bg-zinc-100"
                  type="button"
                  disabled={aiLoading}
                >
                  Switch to fees →
                </button>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-zinc-200 flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => {
                if (mode === "select" && !aiLoading) enableChat({ announce: false });
              }}
              onClick={() => {
                if (mode === "select" && !aiLoading) enableChat({ announce: false });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              placeholder={
                mode === "select"
                  ? "Click here to type (or use the buttons below)."
                  : "Type a DRRM-H website question..."
              }
              disabled={aiLoading}
              readOnly={mode === "select"}
              className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-200 disabled:bg-zinc-100 disabled:cursor-not-allowed"
            />

            <button
              onClick={() => send()}
              disabled={!canSend || mode === "select" || aiLoading}
              className="bg-[#7b1113] text-white px-4 py-2 rounded-lg disabled:opacity-50 hover:bg-[#3b0000]"
              type="button"
            >
              Send
            </button>
          </div>

          {confirmExit && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-[320px] rounded-xl shadow-lg border border-zinc-200 p-4">
                <div className="font-semibold text-zinc-900">Leave chat?</div>
                <div className="text-sm text-zinc-600 mt-1">
                  Are you sure you want to leave? If you exit, you will start a new
                  conversation next time.
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => setConfirmExit(false)}
                    className="px-3 py-2 rounded-lg border border-zinc-300 hover:bg-zinc-50 text-sm"
                    type="button"
                    disabled={aiLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmExitYes}
                    className="px-3 py-2 rounded-lg bg-[#7b1113] hover:bg-[#3b0000] text-white text-sm"
                    type="button"
                    disabled={aiLoading}
                  >
                    Exit
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}