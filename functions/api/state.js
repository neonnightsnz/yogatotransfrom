// Cloudflare Pages Function — handles GET and POST for tracker state.
// Requests without a Journey token retain the original shared tracker key.
// Journey tokens are unguessable UUIDv4 bearer links; keep them private.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function stateKey(request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('journey');
  if (token === null) return { key: 'tracker' };
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)) {
    return { error: new Response('Invalid Journey link', { status: 400, headers: CORS }) };
  }
  return { key: `y2t:${token}` };
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequestGet({ request, env }) {
  const target = stateKey(request);
  if (target.error) return target.error;
  const state = await env.STATE.get(target.key, { type: 'json' });
  return Response.json(state || {}, { headers: CORS });
}

export async function onRequestPost({ request, env }) {
  const target = stateKey(request);
  if (target.error) return target.error;
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid JSON', { status: 400, headers: CORS });
  }
  await env.STATE.put(target.key, JSON.stringify(body));
  return new Response('ok', { headers: CORS });
}
