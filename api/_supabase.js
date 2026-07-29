async function callRpc(fnName, params) {
  const url = `${process.env.SUPABASE_URL}/rest/v1/rpc/${fnName}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: process.env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase RPC ${fnName} failed: ${response.status} ${text}`);
  }

  return response.json();
}

module.exports = { callRpc };
