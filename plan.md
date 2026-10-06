# Yoga to Transform: Development Plan

## Product direction

Yoga to Transform is a gentle coaching and accountability companion. The Today view should feel useful without implying that a person has tasks to complete. Challenges remain optional, history is kept without streak-loss or failed-day language, and meal planning must also feel flexible rather than prescriptive.

The app currently has no recipe data to populate meal ideas. The chosen direction is to use TheMealDB as an external recipe source instead of building and maintaining a recipe catalogue from scratch.

## Current baseline

- Static HTML app deployed on Cloudflare Pages.
- Journey state is stored under one `y2t` object in Cloudflare KV, associated with a private UUID link.
- A local TheMealDB development key has been added to `.env`; `.env` is ignored by Git.
- TheMealDB integration is implemented: `functions/api/recipes/[action].js` proxies search, random, lookup and by-ingredient queries; the Meals tab in `journey.html` provides an optional daily idea, search, recipe detail, favourites, a four-recipe week plan with shopping/prep days, fresh/batch cooking choice, a master shopping list and person-managed ingredient exclusions.
- Recipe details are fetched live from TheMealDB; a small in-memory cache holds the last 40 opened recipes and is not persisted to KV.
- Remaining before public use: error-state and empty-search edge cases on real devices (step 5), and production API key confirmation (step 6).

## Current experience updates

- The overview and Journey content columns now share a 560px maximum width.
- Overview copy describes learning as coming from the client’s own experience, reflection and conversations.
- The Playbook leads with “What worked last time”; patterns, session learnings and reframing are available in collapsed sections.
- Today shows progress across the three selected choices and asks for one optional feeling check-in after all three are complete. The optional Pause & Choose feeling reflection is tucked behind a disclosure; notes can be saved directly.
- Selecting “Choose tomorrow’s 3 challenges” from the gift checklist opens the challenge picker. The Move view includes varied activity ideas and additional preference choices.
- The overview has a check-in calls card for the 75-day package. Its booking link is a placeholder until a Cal.com URL is supplied.

## Next: restore the 75-day welcome flow

1. Restore a short start screen with a selectable begin date (default to today) and “Begin my 75 days.”
2. Follow with “Let’s get to know you” and the “Tell me about me” picklists, using the existing Playbook pattern choices.
3. Keep setup skippable and retain access to the open-ended Journey. The 75-day framing must not introduce missed-day, streak-loss or catch-up pressure.
4. Add the Cal.com booking URL to the overview booking card when available. Confirm the included call count and suggested booking timing before making those details more specific in the copy.
## Meals: flexible weekly planning

### Experience

1. Add an optional “Meals for today” idea with a way to see another idea and browse/search recipes.
2. Let someone save favourites and choose four recipes for the week. The four recipes are intended to provide variety for roughly two meals per day; breakfast can be simple or skipped.
3. Let the person choose their shopping day and, separately, their meal-prep day.
4. Offer two ways to use the same shop:
   - Batch cook on the chosen day. Use about 2.5 hours as the planning estimate, including shopping.
   - Cook the selected meals fresh during the week.
5. Build one master shopping list from the four selected recipes. Keep the ability to view the ingredients and method for one recipe at a time.
6. Make recipe ideas and planning optional. Do not turn the Today view into a required checklist.

### Ingredient exclusions

TheMealDB's free API can filter for an ingredient but does not provide an exclude-ingredient query. Fetch recipe details and filter their returned ingredient list in the app. Let the person manage the exclusion terms; do not silently impose a “sugar-free” rule. Match ingredient names carefully so a term such as `sugar` does not unintentionally exclude `sugar snap peas`. Decide whether the app should support aliases for sweeteners before adding any default exclusions.

### API and data handling

- Use TheMealDB's official API endpoints. Use the free key `1` for local development only.
- Keep API requests behind a Cloudflare Pages Function, reading `THEMEALDB_API_KEY` from the local `.env` and the Pages environment in production. Never embed a production key in public HTML or JavaScript.
- Before public use, confirm TheMealDB's production access and usage terms and configure an appropriate supporter key if required.
- Save recipe IDs, favourites, plan dates/options, exclusion terms and shopping-list checks under the existing `y2t` state. Fetch recipe details from TheMealDB rather than copying its entire catalogue into Journey state.
- Treat ingredient quantities as source text initially. Do not claim to have combined quantities accurately unless units and amounts can be parsed and converted safely.
- Escape recipe and user-entered text before inserting it into HTML. Validate API responses and show a helpful message when the API is unavailable or a recipe has incomplete fields.

### Meal-prep details to validate

TheMealDB recipes may not consistently provide servings, freezer suitability, storage duration or reheating instructions. Inspect real results before designing portion calculations or making food-storage claims. If needed, present portions as user-entered planning information and link to reliable food-safety guidance rather than inferring freezer safety from recipe names.

## Later: meal prep and coaching support

- Explore portioning and freezer-friendly planning after recipe data quality and storage guidance have been checked. The intended benefit is to help people decide what to refrigerate for the next couple of days and what to freeze, without calorie, weight or macro targets.
- Keep the Playbook client-owned: the client can add learnings from a coaching session in their own words. Any shared private Journey link allows its holder to view and edit the same data; it does not identify which person made a change.
- Keep recipe discovery and meal planning supportive of MyFitnessPal or other tools rather than presenting this app as the only place to manage health data.

## Constraints to preserve

- No streak-loss, failed-day or catch-up UI; saved history is not automatically reset.
- Challenges stay optional and retain “I get to / I want to” wording.
- Do not add calorie, weight or macro targets to the new experience.
- Keep the meal-window safety notes, “signs to stop” guidance and 12/13/14-hour cap unchanged.
- Keep coach contact details blank until supplied; use the contact page as the fallback.
- Preserve the current light Yoga to Transform brand styling and mobile safe-area support.

## Delivery sequence

1. ~~Verify local `.env` loading and build a narrow Pages Function proxy for TheMealDB search, random suggestion and recipe-detail lookup.~~ Done: `functions/api/recipes/[action].js` allows `search`, `random`, `meal` and `ingredient` only, validates inputs and reads `THEMEALDB_API_KEY` server-side.
2. ~~Add the optional daily idea, search/results, recipe detail and favourites.~~ Done: Meals tab, "Today's idea" and "Find recipes" views.
3. ~~Add the four-recipe weekly selection, shopping/prep day choices, fresh-cook/batch-cook choice and master shopping list with per-recipe filtering.~~ Done: "My week" view with tickable master shopping list; quantities kept as source text.
4. ~~Add editable ingredient exclusions and test exact and partial-name matching, including false-positive cases such as sugar snap peas.~~ Done: person-managed terms; a single-word term matches the exact name or a name ending with it, so "sugar" excludes "caster sugar" and "light brown sugar" but not "sugar snap peas". Sweetener aliases deliberately not added by default (open question stands).
5. Verify the experience locally with Wrangler Pages dev, including unavailable API responses, empty searches, incomplete recipes, mobile navigation and persistence through KV.
6. Confirm production API access and configure the production key before enabling the feature on the live site.

## Open questions for implementation

- Which meal categories and recipe types should be prioritised for the first suggestions?
- Should the weekly plan start with no excluded ingredients, or with a person-managed set of common sweetener terms?
- Should recipe serving counts remain informational, or should a later step let someone scale a recipe to a chosen number of portions?
- Which source should be used for freezer/storage guidance if TheMealDB does not provide it reliably?
