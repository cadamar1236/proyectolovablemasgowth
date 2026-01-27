-- Migration: Update email templates with detailed daily prompts
-- Includes examples for better responses

-- ============================================
-- 🟡 MONDAY — IDEAS DAY
-- ============================================

-- Monday Morning (8:00 AM) - Context
UPDATE astar_message_templates SET
    subject = '🟡 Monday — Ideas Day 💡',
    body_template = 'Good morning {{name}}, it''s Monday — **Ideas Day** 💡

Today, your objective is to **define the hypotheses** you want to test this week.

Remember: we won''t give you ideas — you''re the founder.

Tonight, at 8:00 PM, we''ll ask for an update so you can share which hypotheses you''re validating and where you''ll focus.

💡 **Throughout the day, define:** Which hypotheses will you validate this week?

—ASTAR*',
    category = 'hypothesis',
    expects_response = 0,
    response_prompt = NULL
WHERE id = 1;

-- Monday Evening (8:00 PM) - INPUT
UPDATE astar_message_templates SET
    subject = '📝 Monday Update — Ideas Day',
    body_template = 'Good evening {{name}}, time to report your progress for Ideas Day!

📝 **Monday Update**

1️⃣ What is the **#1 hypothesis** you will test this week?

2️⃣ What **user behavior** do you expect to see if that hypothesis is correct?

3️⃣ How will you know the hypothesis is **validated**? (specific signal)

{{dashboard_link}}

---

✅ **Example of Good Answers:**

**1. Hypothesis:**
_"If new users can complete onboarding in under 2 minutes, more of them will reach the first aha moment."_

**2. Expected user behavior:**
- At least 50% of new users complete onboarding
- Users interact with the core feature within their first session

**3. Validation signal:**
_"6 out of 10 new users complete onboarding and trigger the core action within 24 hours."_',
    category = 'hypothesis',
    expects_response = 1,
    response_prompt = 'What is your #1 hypothesis for this week?'
WHERE id = 2;

-- ============================================
-- 🟠 TUESDAY — BUILD DAY
-- ============================================

-- Tuesday Morning (8:00 AM) - Context
UPDATE astar_message_templates SET
    subject = '🟠 Tuesday — Build Day 🛠️',
    body_template = 'Good morning {{name}}, it''s Tuesday — **Build Day** 🛠️

Today, your objective is to **move your MVP forward** so you can test your hypotheses.

Focus on progress, not perfection — simplify and execute.

Tonight, at 8:00 PM, we''ll ask for an update on what you built and how it enables real user testing.

🛠️ **Throughout the day, focus on:** What part of your product must exist to validate your hypotheses?

—ASTAR*',
    category = 'build',
    expects_response = 0,
    response_prompt = NULL
WHERE id = 3;

-- Tuesday Evening (8:00 PM) - INPUT
UPDATE astar_message_templates SET
    subject = '🛠️ Tuesday Update — Build Day',
    body_template = 'Good evening {{name}}, time to report your progress for Build Day.

🛠️ **Tuesday Update**

1️⃣ **What did you build today?**
_(Feature, flow, or experiment — be specific)_

2️⃣ **What tech stack or tools did you use?**
_(Frameworks, no-code tools, APIs, AI models, etc.)_

3️⃣ **How long did it take you to build this?**
_(Approximate hours)_

4️⃣ **Which hypothesis is this build testing?**
_(Link it directly to the hypothesis you defined on Monday)_

{{dashboard_link}}

---

✅ **Example of Good Answers:**

**1. What did you build today?**
_"Built a basic onboarding flow that lets users create their first project."_

**2. Tech stack:**
_Frontend: Next.js + Tailwind | Backend: Firebase | AI: OpenAI API_

**3. Time spent:**
_~3.5 hours_

**4. Hypothesis being tested:**
_"If users can generate a useful output in their first session, activation will increase."_',
    category = 'build',
    expects_response = 1,
    response_prompt = 'What did you build today and which hypothesis does it test?'
WHERE id = 4;

-- ============================================
-- 🔵 WEDNESDAY — USER LEARNING DAY
-- ============================================

-- Wednesday Morning (8:00 AM) - Context
UPDATE astar_message_templates SET
    subject = '🔵 Wednesday — User Learning Day 💬',
    body_template = 'Good morning {{name}}, it''s Wednesday — **User Learning Day** 💬

Today, your objective is to **talk to users and learn as fast as possible**.

Progress today is measured by conversations and insights, not code.

Tonight, at 8:00 PM, we''ll ask for an update on who you spoke to, what they did, and what you learned.

💬 **Throughout the day, focus on:** What did users actually do when they used your product?

—ASTAR*',
    category = 'user_learning',
    expects_response = 0,
    response_prompt = NULL
WHERE id = 5;

-- Wednesday Evening (8:00 PM) - INPUT
UPDATE astar_message_templates SET
    subject = '💬 Wednesday Update — User Learning Day',
    body_template = 'Good evening {{name}}, time to report your progress for User Learning Day.

💬 **Wednesday Update**

1️⃣ **How many users did you speak with today?**
_(Conversations, interviews, or live feedback sessions)_

2️⃣ **How many of them actually used the product?**
_(Touched the product, not just gave opinions)_

3️⃣ **What was the single most important thing you learned today?**
_(One sentence only)_

{{dashboard_link}}

---

✅ **Example of Good Answers:**

**1. Users spoken:**
_"6 users (4 live calls, 2 async chats)"_

**2. Users who used product:**
_"4 users completed the core flow, 2 dropped off during onboarding"_

**3. Key learning:**
_"Users understand the value only after seeing a real example, not from the landing page."_',
    category = 'user_learning',
    expects_response = 1,
    response_prompt = 'How many users did you speak with and what did you learn?'
WHERE id = 6;

-- ============================================
-- 🟣 THURSDAY — MEASUREMENT & INSIGHTS DAY
-- ============================================

-- Thursday Morning (8:00 AM) - Context
UPDATE astar_message_templates SET
    subject = '🟣 Thursday — Measurement & Insights Day 📊',
    body_template = 'Good morning {{name}}, it''s Thursday — **Measurement & Insights Day** 📊

Today, your objective is to **observe user behavior and extract patterns**.

Progress today is measured by what users repeat, where they struggle, and what surprises you — not by new features.

Tonight, at 8:00 PM, we''ll ask for an update on what you observed and what it tells you.

📊 **Throughout the day, focus on:** What user behaviors are repeating — and what do they reveal about your product?

—ASTAR*',
    category = 'insight',
    expects_response = 0,
    response_prompt = NULL
WHERE id = 7;

-- Thursday Evening (8:00 PM) - INPUT
UPDATE astar_message_templates SET
    subject = '📊 Thursday Update — Measurement & Insights',
    body_template = 'Good evening {{name}}, time to report your progress for Measurement & Insights Day.

📊 **Thursday Update**

1️⃣ **How many users interacted with your product today?**
_(Any meaningful usage)_

2️⃣ **What actions did users repeat most often?**
_(Core behaviors, not edge cases)_

3️⃣ **Where did users get stuck, drop off, or ask for help?**

4️⃣ **What insight does this reveal about your product?**
_(One sentence only)_

{{dashboard_link}}

---

✅ **Example of Good Answers:**

**1. Users interacted:**
_"9 users total"_

**2. Repeated actions:**
_"6 users generated a second output within the same session, 3 users returned later the same day"_

**3. Drop-off points:**
_"Most users hesitated on the pricing screen, 2 users didn''t understand what to do after the first result"_

**4. Key insight:**
_"The core feature is valuable, but the next step is unclear after first success."_',
    category = 'insight',
    expects_response = 1,
    response_prompt = 'What user behaviors did you observe and what insight does it reveal?'
WHERE id = 8;

-- ============================================
-- 🟢 FRIDAY — METRICS & TRACTION DAY
-- ============================================

-- Friday Morning (8:00 AM) - Context
UPDATE astar_message_templates SET
    subject = '🟢 Friday — Metrics & Traction Day 📈',
    body_template = 'Good morning {{name}}, it''s Friday — **Metrics & Traction Day** 📈

Today, your objective is to **consolidate the real numbers from this week**.

This is the final data point before we close the weekly leaderboard.

This afternoon, at 5:00 PM, we''ll ask for an update on revenue, user acquisition, and usage.

📈 **Throughout the day, focus on:** What real traction did you generate this week?

—ASTAR*',
    category = 'traction',
    expects_response = 0,
    response_prompt = NULL
WHERE id = 9;

-- Friday Evening (5:00 PM) - INPUT (cambiar hora en el cron)
UPDATE astar_message_templates SET
    subject = '📈 Friday Update — Weekly Traction Metrics',
    body_template = 'Good evening {{name}}, time to report your weekly traction metrics.

📈 **Friday Traction Update**

_(Approximate numbers are fine)_

1️⃣ **How much revenue did you generate this week?** (€)
_(Cash collected or committed)_

2️⃣ **How many new users did you acquire this week?**

3️⃣ **How many users were active this week?**
_(Used the product at least once)_

4️⃣ **How many users churned this week?**
_(Stopped using the product or explicitly dropped off)_

5️⃣ **What was the strongest traction signal this week?**
_(One sentence only)_

{{dashboard_link}}

---

✅ **Example of Good Answers:**

**1. Revenue:**
_"€420 (7 users × €60)"_

**2. New users:**
_"18 new users"_

**3. Active users:**
_"12 users used the product at least once"_

**4. Churned users:**
_"3 users stopped using the product"_

**5. Strongest signal:**
_"Two users upgraded without being prompted after their first successful use"_',
    category = 'traction',
    expects_response = 1,
    response_prompt = 'Share your weekly traction metrics: revenue, users, churn.'
WHERE id = 10;

-- ============================================
-- 🟤 SATURDAY — REST & REFLECT
-- ============================================

-- Saturday Morning - Light context
UPDATE astar_message_templates SET
    subject = '🟤 Saturday — Rest & Reflect 🧘',
    body_template = 'Good morning {{name}}, it''s Saturday.

Take a moment to rest and reflect on the week.

No pressure today — but if you want to share any final thoughts or close any loops, you can.

🧘 Recharge for next week!

—ASTAR*',
    category = 'reflect',
    expects_response = 0,
    response_prompt = NULL
WHERE id = 11;

-- Saturday Evening - Optional
UPDATE astar_message_templates SET
    subject = '🧠 Saturday — Optional Reflection',
    body_template = 'Good evening {{name}},

If you have any final thoughts from the week, feel free to share:

🧠 **Optional Reflection**

1️⃣ What feedback did you close today?

2️⃣ What signal leaves you most confident (or worried)?

{{dashboard_link}}

_(This is optional — feel free to skip and rest!)_',
    category = 'reflect',
    expects_response = 1,
    response_prompt = 'Any final reflections from the week?'
WHERE id = 12;

-- ============================================
-- ⚫ SUNDAY — WEEKLY REVIEW
-- ============================================

-- Sunday Morning - Reflection
UPDATE astar_message_templates SET
    subject = '⚫ Sunday — Weekly Review 🏁',
    body_template = 'Good morning {{name}}, it''s Sunday — **Weekly Review Day** 🏁

Take a moment to reflect on the whole week:

- What worked?
- What didn''t work?
- What will you do differently?

🧘 Rest, but don''t lose focus.

Tonight we''ll share the **Weekly Leaderboard** with everyone''s progress.

—ASTAR*',
    category = 'reflect',
    expects_response = 0,
    response_prompt = NULL
WHERE id = 13;

-- Sunday Evening - Weekly Summary & Leaderboard
UPDATE astar_message_templates SET
    subject = '🏁 Sunday — Weekly Summary & Leaderboard',
    body_template = 'Good evening {{name}},

🏁 **Weekly Summary**

Time to see how the week went:

**Your Week in Numbers:**
- 💡 Hypotheses defined: Monday
- 🛠️ Build progress: Tuesday
- 💬 Users spoken: Wednesday
- 📊 Insights gathered: Thursday
- 📈 Traction reported: Friday

{{#rankings}}
---

🏆 **WEEKLY LEADERBOARD**

🥇 #1 - {{first_place.name}} - Score: {{first_place.score}}
🥈 #2 - {{second_place.name}} - Score: {{second_place.score}}
🥉 #3 - {{third_place.name}} - Score: {{third_place.score}}

📈 **Your position:** #{{user_rank}}
{{/rankings}}

{{dashboard_link}}

See you next Monday for a new week of building! 🚀',
    category = 'reflect',
    expects_response = 0,
    response_prompt = NULL
WHERE id = 14;