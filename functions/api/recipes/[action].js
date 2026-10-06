// Cloudflare Pages Function — narrow proxy for TheMealDB.
// The API key comes from THEMEALDB_API_KEY (local .env or Pages environment).
// The free development key is "1"; a production key must be configured before
// public use and never embedded in client-side code.
//
// Only three upstream actions are allowed:
//   search.php?s=...   (name search; empty s returns the latest meals)
//   random.php         (one random meal)
//   lookup.php?i=<id>  (full recipe by meal id)
// plus filter.php?i=<ingredient> for browsing by a single ingredient.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const UPSTREAM = 'https://www.themealdb.com/api/json/v1';

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequestGet({ request, env, params }) {
  const action = params.action; // 'search' | 'random' | 'meal' | 'ingredient'
  const url = new URL(request.url);
  const query = (url.searchParams.get('q') || '').trim();
  const key = env.THEMEALDB_API_KEY || '1';

  let endpoint;
  if (action === 'search') {
    if (query.length > 60) return json({ error: 'Search term is too long.' }, 400);
    if (!/^[\p{L}\p{N} '’-]*$/u.test(query)) return json({ error: 'Please use letters and numbers in your search.' }, 400);
    endpoint = `search.php?s=${encodeURIComponent(query)}`;
  } else if (action === 'random') {
    endpoint = 'random.php';
  } else if (action === 'meal') {
    if (!/^\d{1,7}$/.test(query)) return json({ error: 'Invalid recipe id.' }, 400);
    endpoint = `lookup.php?i=${query}`;
  } else if (action === 'ingredient') {
    if (!/^[A-Za-z ]{1,40}$/.test(query)) return json({ error: 'Invalid ingredient.' }, 400);
    endpoint = `filter.php?i=${encodeURIComponent(query)}`;
  } else {
    return json({ error: 'Unknown action.' }, 404);
  }

  try {
    const upstream = await fetch(`${UPSTREAM}/${key}/${endpoint}`, {
      cf: { cacheTtl: 3600, cacheEverything: true },
    });
    if (!upstream.ok) return json({ error: 'The recipe service is not responding right now. Please try again later.' }, 502);
    const data = await upstream.json();
    return json(data || {}, 200);
  } catch {
    return json({ error: 'The recipe service is not responding right now. Please try again later.' }, 502);
  }
}

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
