export async function parseExpenseViaApi(message) {
  const res = await fetch('/api/parse-expense', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(body.error ?? `Request failed (${res.status})`);
    err.code = body.code ?? 'HTTP_ERROR';
    err.status = res.status;
    throw err;
  }

  return body;
}
