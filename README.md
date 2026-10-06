# Yoga to Transform

A light, supportive coaching companion hosted on Cloudflare Pages. The home page shows today’s date and a gentle overview of the client’s Journey. Participation is optional; the app is open-ended and has no missed-day or failure states.

## What it includes

- An open-ended My Journey with optional sets of three daily challenges. A challenge day counts after at least two of the three are tried.
- “I get to / I want to” wording, a dice option for choosing challenges, and a record of positive challenge history.
- A Pause & Choose section for noticing food-related urges without judgement.
- Move and Meal window support, including the existing safety guidance and the 12, 13 and 14-hour options.
- An optional Meals tab: a daily recipe idea and search from TheMealDB (via a server-side Pages Function), favourites, a four-recipe week plan with shopping and prep days, a batch-cook or fresh-cook choice, a master shopping list, and person-managed ingredient exclusions. Nothing here is required and nothing resets.
- A client-owned Playbook for patterns, reframes, and session learnings the client chooses to write down in their own words.
- A private Journey link that a client can share with their coach. Anyone holding the link can view and update that Journey.

Recipe discovery uses TheMealDB behind `functions/api/recipes/[action].js` (search, random, lookup and by-ingredient only, with input validation and a 502 fallback message). The API key is read from `THEMEALDB_API_KEY` in the local `.env` or the Pages environment; never embed it in client code. Weight and body measurements, and progress photos, are outside this app’s scope. The root overview shows Journey activity, not calories, body measurements or meal completion.

## Architecture

### Cloudflare Pages

`pages_build_output_dir = "."` in `wrangler.toml` serves the repository root. `index.html` is the date and progress overview; `journey.html` contains the Journey experience. Brand assets used by the app live in `assets/brand/` so deployment does not depend on gitignored reference files in `docs/`.

### Pages Function and KV

`functions/api/state.js` exposes `GET` and `POST /api/state`. A request with a valid `journey` UUID uses a per-person KV key named `y2t:<uuid>`. That UUID is a bearer link: anyone who has it can read and update the record. Keep it private. The app does not identify whether a write came from the client or coach.

Requests without a Journey token still address the legacy `tracker` key for compatibility. The current pages use only the per-Journey key and do not write to the legacy key.

Journey state is saved as one JSON blob under the `y2t` property. Changes sync after a 600 ms debounce. The first Journey load can migrate `localStorage['y2t-journey-v1']` into KV when there is no existing `y2t` state for that private link. Existing challenge history is retained when a client changes their choices.

### Local development

```bash
npx wrangler pages dev . --kv KV_BINDING
```

The local KV data is stored under `.wrangler/state` and does not write to the production namespace.

### Deploy

Prerequisites: Node.js 18+, a Cloudflare account, and Wrangler v4+.

```bash
npx wrangler login
```

For a first deployment, create the Pages project once:

```bash
npx wrangler pages project create yoga-to-transform
```

Then deploy:

```bash
npx wrangler pages deploy .
```

Keep the KV binding in `wrangler.toml` and do not add private link tokens or credentials to source control.