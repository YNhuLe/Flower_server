# 🌼 Flower_Server🌿

Welcome to **Flower_Server** – the roots beneath the greenhouse! 🌱⚙️  
This is where all the magic happens: quizzes get answered, plants get matched, and data flows like water through well‑drained soil. 💧🌳

## 💡 What is Flower_Server?

**Flower_Server** is the powerhouse behind the **flower_love** app.  
It’s built with:

- 🚀 **Express** (fast, lightweight server for handling requests)  
- 🗄️ **PostgreSQL** (our plant inventory database – structured, reliable, and fertile ground for data)  
- 🌐 **Axios** (to fetch and send data across APIs like a busy bee 🐝)  
- 🤖 **Gemini API** (AI brain that takes quiz input and recommends plants tailored to user interests)  
- **Anthropic API** ( AI plantmate that guides and helps plant love understand the plant better and how to help it thrive. )
- 🧪 **Postman** (for testing endpoints and making sure everything blooms correctly)  
- ☁️ **Cloudinary** (image storage so our app stays light and responsive, while plant pics remain crisp 🌸)

This backend lets you:

- 🌿 **Process plant quizzes** and match users with plants from the inventory powered by AI (Gemini)
- 🌱 **Serve recommendations** powered by Anthropic API 
- 🖼️ **Store and deliver plant images** without weighing down the frontend  
- 🔗 **Provide RESTful APIs** for the frontend to consume

---

## 🚀 How to Run It

1. Clone the repo (dig up the backend soil):

   ```bash
   git clone https://github.com/YNhuLe/Flower_server.git
   ```

2. Navigate to the backend directory:

   ```bash
   cd Flower_Server
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Set up the environment variables in a `.env` file:

   ```bash
   PORT=3000
   DATABASE_URL=your_postgres_connection_string
   GEMINI_API_KEY=your_gemini_api_key
   CLOUDINARY_URL=your_cloudinary_url
   ```

5. Start the server:

   ```bash
   npm run dev
   ```

## 🌍 Who is this for?

- 🧑‍💻 **Developers** who love plants and APIs

- 🌿 **Hackathon** warriors needing a reliable backend

- 🤖 **AI enthusiasts** curious about plant recommendations

- ☁️ **Anyone** who wants scalable image storage with Cloudinary

---

# 📦 Features (aka planting seeds):

- [🔐 **Authentication Feature** — Powered by Auth0](#authentication-feature)
- [🔍 **Hybrid Search Feature**](#hybrid-search-feature)
- [🪴 **Advanced AI recommendations**](#advanced-ai-recommendations)
- [🌼 **Analytics dashboard for plant trends**](#analytics-dashboard-for-plant-trends)

---

<a id="authentication-feature"></a>

## 🔐 1. Authentication Feature — Powered by Auth0

Sign up, log in, and stay secure — without us ever touching a single password. 🙌

### 📑 Table of Contents
- [Overview](#-overview)
- [Sign-Up Options](#-sign-up-options)
- [Where Do Users Actually Live?](#-where-do-users-actually-live)
- [The JWT](#-the-jwt--your-digital-id-badge)
- [Why We Chose Auth0](#-why-we-chose-auth0)
- [Quick Setup Checklist](#-quick-setup-checklist)
- [Things to Keep an Eye On](#-things-to-keep-an-eye-on)
- [Changelog](#-changelog)

---

### 🌟 Overview

This app uses **Auth0** to handle all things authentication. Instead of building (and stressing over) our own login system, we hand the hard parts — password storage, social logins, token security — to a service built for exactly that.

```
            🧑 User
              │
     ┌────────┴────────┐
     │                 │
📧 Email/Password   🟢 Sign up with Google
     │                 │
     └────────┬────────┘
              │
        🔐 Auth0 Universal Login
              │
        🪪  JWT issued
              │
        🚀 Logged into the app!
```

---

### ✨ Sign-Up Options

| Method | What happens | User ID format |
|---|---|---|
| 📧 **Email/Password** | Auth0 hashes & stores the password securely (we never see it!) | `auth0\|abc123...` |
| 🟢 **Sign up with Google** | Auth0 handles the OAuth dance with Google and pulls in name/email/avatar automatically | `google-oauth2\|108234...` |

Both paths land the user in the same place — one happy, logged-in session. 🎉

---

### 🗄️ Where Do Users Actually Live?

Plot twist: **not in our database!** 😱 Users are stored in **Auth0's own user store**. We link them to our app by saving their Auth0 `user_id` as a foreign key.

<details>
<summary>📜 Click to see the linking table SQL</summary>

```sql
CREATE TABLE app_users (
  id SERIAL PRIMARY KEY,
  auth0_user_id TEXT UNIQUE NOT NULL,   -- 🪪 e.g. "google-oauth2|108234982734098234"
  email TEXT,
  created_at TIMESTAMP DEFAULT now()
);
```

First time we see a new user's `sub` claim → we create their row. Easy. ✅

</details>

---

### 🪪 The JWT — Your Digital ID Badge

After login, Auth0 hands out tokens shaped like this:

```
eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJnb29nbGUtb2F1dGgyfDEwOCJ9.signature_here
   👆 header              👆 payload (claims)          👆 signature
```

| Piece | What's inside | Emoji TL;DR |
|---|---|---|
| **Header** | Signing algorithm (`RS256` 🔏) | "How I'm locked" |
| **Payload** | `sub` (user id), `iss` (Auth0 domain), `aud` (our API), `exp` (expiry ⏰) | "Who I am, who made me, when I expire" |
| **Signature** | Cryptographic proof it's legit | "Don't mess with me" 🛡️ |

### 🤔 Two tokens, two jobs

- 🪪 **ID Token** → "Here's who the user is" → goes to the **frontend**
- 🎫 **Access Token** → "Here's proof you can call the API" → goes to the **backend**

### 🚀 Why this is awesome

Because the JWT is signed with `RS256`, our Express server can verify it **locally** using Auth0's public key — no network call to Auth0 needed on every request. ⚡ Stateless. Fast. No "is Auth0 down?" anxiety on every API call.

<details>
<summary>💻 Click to see the Express middleware</summary>

```js
const { auth } = require('express-oauth2-jwt-bearer');

const checkJwt = auth({
  audience: 'https://your-api-identifier',
  issuerBaseURL: 'https://YOUR_DOMAIN.auth0.com/'
});

app.get('/api/orders', checkJwt, (req, res) => {
  const userId = req.auth.payload.sub; // ✅ verified, trustworthy
  // ...
});
```

</details>

---

### 💎 Why We Chose Auth0

| Benefit | Why it's 🔥 |
|---|---|
| 🔒 Never store passwords | Zero risk of *us* leaking hashed passwords |
| 🌍 Social login, made easy | No wrestling with Google's OAuth docs ourselves |
| 📜 Standards-based (OAuth2/OIDC) | Plays nice with literally any frontend/backend |
| 🛡️ Built-in security | Brute-force protection, breach detection, MFA — flip a switch, done |
| 📊 Dashboard for user management | No custom admin panel needed |
| ⏱️ Speed | Working login + social sign-up in hours, not weeks |

---

### ⚙️ Quick Setup Checklist

- [ ] ☑️ Create Auth0 application (Single Page App type for React)
- [ ] ☑️ Enable Database Connection (email/password)
- [ ] ☑️ Enable Google social connection
- [ ] ☑️ Set up API identifier for our Express backend
- [ ] ☑️ Add `express-oauth2-jwt-bearer` middleware to protected routes
- [ ] ☑️ Create `app_users` table to link `auth0_user_id` → our data

---

### ⚠️ Things to Keep an Eye On

- 💸 Free-tier MAU (monthly active user) limits — check Auth0's current pricing as the user base grows
- 🌐 Dependent on Auth0's uptime for login flows (though already-issued JWTs verify locally, so existing sessions stay fine even if Auth0 has a hiccup)
- 🔄 No password reset flow customization beyond what Auth0's hosted pages allow (unless we go fully custom)

---

### 📝 Changelog

| Date | Change | Notes |
|---|---|---|
| 2026-06-20 | 🎉 Initial Auth0 integration | Email/password + Google sign-up, JWT-protected API routes, `app_users` linking table |
| 2026-06-20 | 📂 Reorganized with collapsible sections | SQL/code moved into `<details>` dropdowns for a shorter, scannable page |

---

<a id="hybrid-search-feature"></a>

## 🔍 2. Hybrid Search Feature

### 📑 Table of Contents
- [Overview](#overview)
- [Database Schema](#database-schema)
- [Embedding Generation](#embedding-generation)
- [API](#api)
- [Ranking Algorithm: RRF](#ranking-algorithm-reciprocal-rank-fusion-rrf)
- [Setup](#setup)
- [Known Limitations / Future Improvements](#known-limitations--future-improvements)
- [Changelog](#changelog)

---

### Overview

This feature lets users search the plant catalog using natural language instead of exact keyword matches. For example, a search for `"plant that doesn't need much water"` correctly surfaces succulents and cacti even though none of those words appear in the listing text.

It works by combining two independent search methods and merging their results:

1. **Keyword search** — exact/lexical matching via PostgreSQL full-text search
2. **Vector search** — semantic/meaning-based matching via `pgvector` embeddings

The two result sets are merged using **Reciprocal Rank Fusion (RRF)**, which favors items that rank well in *both* searches over items that only one method liked.

```
User query
    │
    ├──► Keyword search (GIN index)   ──┐
    │                                   ├──► RRF merge ──► Ranked results
    └──► Vector search (HNSW index)   ──┘
```

---

### Database Schema

#### Columns

| Column | Type | Purpose |
|---|---|---|
| `search_text` | `TSVECTOR` (generated) | Tokenized text for keyword search |
| `search_embedding` | `VECTOR(1536)` | Semantic embedding for vector search |

> **Note:** `search_embedding` is dedicated to search, separate from the existing `plant_embedding`, `light_embedding`, `humidity_embedding`, and `temperature_embedding` columns used by the recommendation engine — keeping search decoupled from recommendations.

#### Indexes

| Index | Type | Why |
|---|---|---|
| `idx_plants_search_text` | GIN | Maps words → matching rows, so keyword lookups don't scan the whole table |
| `idx_plants_search_embedding` | HNSW | Approximate nearest-neighbor graph, so similarity search stays fast as the catalog grows |

**Tradeoffs accepted:** both indexes add write overhead and storage, and HNSW returns *approximate* nearest neighbors rather than guaranteed-exact ones. Both tradeoffs are acceptable for product search at our scale.

<details>
<summary>📜 Click to see the SQL</summary>

```sql
ALTER TABLE plants ADD COLUMN search_embedding VECTOR(1536);

ALTER TABLE plants ADD COLUMN search_text TSVECTOR
  GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(name, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(benefits, '') || ' ' ||
      coalesce(common_problems, '') || ' ' ||
      coalesce(growth_habit, '')
    )
  ) STORED;

-- Keyword search index
CREATE INDEX idx_plants_search_text ON plants USING GIN (search_text);

-- Vector search index (cosine distance)
CREATE INDEX idx_plants_search_embedding ON plants USING hnsw (search_embedding vector_cosine_ops);
```

</details>

---

### Embedding Generation

`search_embedding` is generated once per product (and regenerated when product text changes) by a standalone script — **not** computed on every request.

<details>
<summary>💻 Click to see the embedding generation script</summary>

```js
// scripts/generate-search-embeddings.js
const textForEmbedding = [
  plant.name,
  plant.description,
  plant.scientific_name,
  plant.growth_habit,
  plant.benefits,
  plant.common_problems,
  plant.bloom_info
].filter(Boolean).join(' ');

const embedding = await getEmbedding(textForEmbedding); // calls embedding API
await db.query(
  'UPDATE plants SET search_embedding = $1 WHERE id = $2',
  [embedding, plant.id]
);
```

Run this script whenever a product is created or its text fields are edited.

</details>

---

### API

#### `GET /api/search`

| Param | Type | Required | Description |
|---|---|---|---|
| `q` | string | yes | The user's search query |
| `limit` | integer | no | Max results to return (default: 20) |

**Example request:**

```bash
curl "http://localhost:3000/api/search?q=low+light+indoor+plant"
```

**Example response:**

```json
{
  "query": "low light indoor plant",
  "results": [
    { "id": 14, "name": "Snake Plant", "score": 0.0325 },
    { "id": 7,  "name": "ZZ Plant",    "score": 0.0317 }
  ]
}
```

<details>
<summary>💻 Click to see the Express implementation</summary>

```js
app.get('/api/search', async (req, res) => {
  const { q, limit = 20 } = req.query;

  const [keywordResults, vectorResults] = await Promise.all([
    keywordSearch(q),   // returns ordered array of ids
    vectorSearch(q)     // returns ordered array of ids
  ]);

  const merged = rrfMerge(keywordResults, vectorResults, 60, limit);
  res.json({ query: q, results: merged });
});
```

</details>

---

### Ranking Algorithm: Reciprocal Rank Fusion (RRF)

RRF combines two ranked lists using rank position rather than raw scores, because BM25/`ts_rank` scores and cosine-similarity scores aren't on comparable scales.

```
RRF_score(item) = 1 / (k + rank_in_keyword_list) + 1 / (k + rank_in_vector_list)
```

`k = 60` is the standard default — it dampens the gap between rank 1 and rank 2 so one method can't completely dominate the other.

<details>
<summary>💻 Click to see the RRF merge function</summary>

```js
function rrfMerge(keywordResults, vectorResults, k = 60, topN = 20) {
  const scores = {};
  keywordResults.forEach((id, i) => {
    scores[id] = (scores[id] || 0) + 1 / (k + i + 1);
  });
  vectorResults.forEach((id, i) => {
    scores[id] = (scores[id] || 0) + 1 / (k + i + 1);
  });
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([id]) => Number(id));
}
```

</details>

---

### Setup

1. Enable the `pgvector` extension: `CREATE EXTENSION IF NOT EXISTS vector;`
2. Run the migration to add `search_embedding` and `search_text` columns
3. Create the GIN and HNSW indexes (see above)
4. Run `scripts/generate-search-embeddings.js` to backfill embeddings for existing products
5. Start the Express server — the `/api/search` route is ready to use

---

### Known Limitations / Future Improvements

- `ts_rank()` is TF-IDF-style, not true BM25 — could migrate to `pg_search` (ParadeDB) for proper BM25 scoring
- No re-ranking model yet — currently pure RRF; could add a learned re-ranker once click/purchase data exists
- No filters (price, stock, category) applied yet — planned as a post-RRF step
- Embeddings are not regenerated automatically on product edits — needs a hook or background job

---

### Changelog

| Date | Change | Notes |
|---|---|---|
| 2026-06-20 | Initial hybrid search implementation | Added `search_text`, `search_embedding` columns + GIN/HNSW indexes, RRF merge logic, `/api/search` endpoint |
| 2026-06-20 | Reorganized with collapsible sections | Code blocks moved into `<details>` dropdowns for a shorter, scannable page |

---


## 🪴 3. Advanced AI Recommendations — Meet Your Plantmate 🌿

Quiz in, perfect plants out — then a chat buddy to help them thrive. 🌱💬

### 📑 Table of Contents
- [The Big Picture](#-the-big-picture)
- [Step 1: Quiz Scoring (Vector Search + LLM Re-Rank)](#-step-1-quiz-scoring-vector-search--llm-re-rank)
- [Recommendation Score: Measuring Quiz Match Quality](#-recommendation-score-measuring-quiz-match-quality)
- [Step 2: Meet Plantmate (Tool-Calling Agent)](#-step-2-meet-plantmate-tool-calling-agent)
- [API](#-api-1)
- [Chat Score: Measuring Chat Quality](#-chat-score-measuring-chat-quality)
- [Why Different Tools for Different Jobs?](#-why-different-tools-for-different-jobs)
- [Setup Checklist](#-setup-checklist)
- [Known Limitations](#-known-limitations)
- [Changelog](#-changelog-2)

---

### 🌟 The Big Picture

```
🧑 User finishes quiz
        │
        ▼
🧮 Vector search → top 5 candidate plants
        │
        ▼
🤖 Gemini re-ranks → final top 3 + reasoning
        │
        ▼
👍👎 User rates each recommendation
        │
        ▼
💬 Chat with Plantmate about the picks (Claude + tools)
        │
        ▼
👍👎 User rates each chat reply
```

Two separate feedback loops here — one on the **recommendations**, one on the **chat** — because they're rating different things and need different fixes when something's off. 🔀

---

### 🧮 Step 1: Quiz Scoring (Vector Search + LLM Re-Rank)

This is a **retrieve, then re-rank** pattern — vector search casts a wide net, and an LLM makes the final, explainable call.

1. **Summarize the quiz** — `builtQuizSummary()` turns the raw answers (sunlight, temperature, humidity, care level, plant type, things to avoid) into a single natural-language paragraph.
2. **Embed it once** — that whole summary becomes one embedding vector, not three separate attribute comparisons.
3. **Vector search for a shortlist** — compared against each plant's `plant_embedding` using `<->` (Euclidean distance), pulling the **top 5 closest candidates**. This is a shortlist, not the final answer.
4. **Gemini picks the final 3** — the 5 candidates get handed to Gemini, which selects the best 3, and writes a `benefit` line, a `scoreMatch`, and 3 short `reasoning` bullets for each — in the user's language, not just a number.
5. **Merge & save** — the picks get merged with full plant rows + size options, then saved to `quiz_sessions.top3_plant_ids` for later use in the chat flow.

<details>
<summary>📜 Click to see the vector search query</summary>

```js
const quizSummary = builtQuizSummary(answers);
const quizEmbedding = await embed(quizSummary);

const vectorMatches = await knex.raw(
  `SELECT *, (plant_embedding <-> (?::vector)) AS distance
   FROM plants
   ORDER BY distance ASC
   LIMIT 5`,
  [toPgVector(quizEmbedding)]
);
```

> Note: this uses `<->` (Euclidean/L2 distance) rather than `<=>` (cosine distance). Both work fine for ranking purposes here, but cosine is generally the more common choice for text embeddings since it ignores vector magnitude.

</details>

<details>
<summary>💻 Click to see the Gemini re-ranking prompt</summary>

```js
const prompt = `
You are a plant recommendation engine.

User preferences:
${JSON.stringify(answers, null, 2)}

Candidate plants (already pre-filtered and sorted by vector similarity):
${JSON.stringify(vectorMatches.rows, null, 2)}

From the candidate list, select the top 3 plants that best match the user's
preferences. Return valid JSON array only — plant, benefit, scoreMatch (0-1),
and 3 short reasoning bullets per plant.
`;

const recommendations = await generateRecommendation(prompt);
```

</details>

---

### 📊 Recommendation Score: Measuring Quiz Match Quality

Each of the 3 recommended plants gets its own 👍/👎 — someone might love pick #1 and dislike pick #3, so feedback is **per-plant**, not one rating for the whole batch.

**Schema:**

```sql
CREATE TABLE recommendation_feedback (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES quiz_sessions(id),
  plant_id INTEGER REFERENCES plants(id),
  feedback SMALLINT,  -- 1 = 👍, -1 = 👎
  created_at TIMESTAMP DEFAULT now()
);
```

<details>
<summary>💻 Click to see the feedback endpoint</summary>

```js
const postRecommendationFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { session_id, plant_id, feedback } = req.body;
    await knex("recommendation_feedback").insert({ session_id, plant_id, feedback });
    res.status(200).json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to save recommendation feedback" });
  }
};
```

</details>

**Why this matters long-term:** this data lets you eventually check whether vector-search-shortlisted plants that Gemini picked actually land well with users — and if a pattern shows up (e.g. plants matched mainly on `temperature` consistently get 👎), that's a concrete signal about where the embedding or prompt needs tuning, instead of guessing. 📈

---

### 💬 Step 2: Meet Plantmate (Tool-Calling Agent)

Once a user has their top 3, they can chat with **Plantmate** — an agent that calls tools on demand rather than carrying a full plant profile in every prompt.

| Tool | What it fetches | When Claude calls it |
|---|---|---|
| `get_care_guide` | Watering, light, soil, humidity, temperature, fertilizer info | Care/maintenance questions |
| `check_pet_safety` | `is_pet_friendly`, `toxicity_notes` | Questions mentioning pets, cats, or dogs |
| `get_plant_page` | `page_url`, `common_name` | Wrapping up with a product link |

<details>
<summary>💻 Click to see the agent loop</summary>

```js
let response = await callClaude(systemPrompt, messages, tools);

while (response.stop_reason === "tool_use") {
  const toolCalls = response.content.filter((c: any) => c.type === "tool_use");
  const toolResults = await Promise.all(toolCalls.map(executeTool));

  messages.push({ role: "assistant", content: response.content });
  messages.push({ role: "user", content: toolResults });

  response = await callClaude(systemPrompt, messages, tools);
}
```

</details>

---

### 🔌 API

| Endpoint | What it does |
|---|---|
| `POST /api/quiz/recommend` | Embeds quiz answers, vector-searches top 5, Gemini re-ranks to top 3, saves session |
| `POST /api/recommendation/feedback` | Records 👍/👎 on a specific recommended plant |
| `POST /api/chat` | Runs the Plantmate agent loop, returns a reply |
| `GET /chat/:user_id/history` | Returns chat history for a user's most recent session |
| `POST /api/chat/:id/feedback` | Records 👍/👎 on a specific chat reply |

---

### 📊 Chat Score: Measuring Chat Quality

Separate from recommendation feedback — this rates Plantmate's chat replies, tracked with the same 👍/👎 pattern.

**Schema:**

```sql
ALTER TABLE chat_history ADD COLUMN feedback SMALLINT;  -- 1 = 👍, -1 = 👎
ALTER TABLE chat_history ADD COLUMN tool_calls TEXT;     -- JSON array of tools used per reply
```

`tool_calls` is logged on every reply so usage patterns and tool-accuracy checks can be built later without re-instrumenting anything.

<details>
<summary>📜 Click to see the satisfaction-rate query</summary>

```sql
SELECT
  COUNT(*) FILTER (WHERE feedback = 1) AS thumbs_up,
  COUNT(*) FILTER (WHERE feedback = -1) AS thumbs_down,
  ROUND(100.0 * COUNT(*) FILTER (WHERE feedback = 1)
    / NULLIF(COUNT(*) FILTER (WHERE feedback IS NOT NULL), 0), 1) AS satisfaction_rate
FROM chat_history
WHERE role = 'assistant';
```

</details>

---

### 🤔 Why Different Tools for Different Jobs?

| Task | Best tool | Why |
|---|---|---|
| 🔍 Shortlisting candidates from the whole catalog | Vector search (`plant_embedding`) | Fast, cheap, scales to thousands of plants |
| 🏆 Picking the best 3 + explaining why | Gemini | Needs judgment and natural-language reasoning a similarity score can't produce |
| 💬 Answering open-ended care questions | Claude (Anthropic API) + tools | Needs fresh data lookups and flexible conversation, not a one-shot ranking |

---

### ⚙️ Setup Checklist

- [ ] ☑️ Build the quiz UI in React, capturing sunlight/temperature/humidity/care preferences
- [ ] ☑️ Embed the quiz summary, vector-search top 5, Gemini re-rank to top 3
- [ ] ☑️ Add `recommendation_feedback` table + endpoint, 👍/👎 buttons on each result card
- [ ] ☑️ Add `ANTHROPIC_API_KEY` to `.env`
- [ ] ☑️ Wire up `get_care_guide`, `check_pet_safety`, `get_plant_page` tools
- [ ] ☑️ Add `feedback` + `tool_calls` columns to `chat_history`, plus 👍/👎 under each Plantmate reply

---

### ⚠️ Known Limitations

- 🐛 If Gemini returns a plant name that doesn't exactly match a candidate, that pick is silently dropped — `top3_plant_ids` could end up with fewer than 3 plants
- 🔢 Error responses currently return `400` for what are really server-side failures (DB/Gemini/JSON-parse errors) — should be `500`
- 💭 No long-term memory across chat sessions — each new session starts fresh
- ⏳ No streaming chat responses yet — the full reply comes back at once
- 👍👎 Both feedback signals are binary — they tell you *that* something missed, not *why*

---

### 📝 Changelog

| Date | Change | Notes |
|---|---|---|
| 2026-06-20 | 🎉 Initial Plantmate feature documented | Quiz-to-score-to-top-3 pipeline + Anthropic-powered chat |
| 2026-06-20 | 🔧 Updated chat section to reflect real tool-calling agent | Replaced speculative static-context design with the actual `get_care_guide` / `check_pet_safety` / `get_plant_page` tool loop |
| 2026-06-20 | 📊 Added chat score (👍/👎 feedback) | New `feedback` + `tool_calls` columns, feedback endpoint, satisfaction-rate query |
| 2026-06-20 | 🔧 Corrected quiz scoring to reflect real vector search + Gemini re-rank flow | Replaced incorrect 3-attribute weighted scoring with the actual single `plant_embedding` + Gemini re-rank pipeline |
| 2026-06-20 | 📊 Added recommendation score (👍/👎 per quiz pick) | New `recommendation_feedback` table + endpoint, separate from chat feedback |

---

<a id="analytics-dashboard-for-plant-trends"></a>

## 🌼 4. Analytics Dashboard for Plant Trends

🚧 *Documentation coming soon — this section will cover the trends dashboard for plant popularity and engagement.*

---

## 📸 Screenshots
Coming soon: Postman tests, API responses, and maybe a diagram of our blooming architechture 🌷

## 🐛 Found a Bug?

If you find a bug (not the kind crawling on your monstera), please open an issue on GitHub. We’ll prune it out quickly! 🐞✂️

## 🙏 Contributing
We welcome contributions! Fork the repo, branch out, and submit a pull request. Let’s make flower_love_backend grow even stronger. 🌼

## Build with love by 👩‍💻
[JennyLe]