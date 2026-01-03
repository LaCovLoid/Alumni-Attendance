const GAS_URL =
  "https://script.google.com/macros/s/AKfycbzqxu-BH3s7QSlEzcBttpiipfsyo0S97PB63UB3FeNAIQse9RvaZyKbJU0q3b46StaL2w/exec";

exports.handler = async (event) => {
  const url = new URL(GAS_URL);

  const qs = event.queryStringParameters || {};
  for (const [k, v] of Object.entries(qs)) {
    if (v != null) url.searchParams.set(k, v);
  }

  const method = event.httpMethod || "GET";
  const hasBody = method !== "GET" && method !== "HEAD";

  const upstream = await fetch(url.toString(), {
    method,
    headers: { "content-type": "application/json" },
    body: hasBody ? event.body ?? "" : undefined,
  });

  const text = await upstream.text();

  return {
    statusCode: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") || "application/json",
      "access-control-allow-origin": "*",
      "cache-control": "public, max-age=30",
    },
    body: text,
  };
};
