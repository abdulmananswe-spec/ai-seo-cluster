async function test() {
  const res = await fetch("http://127.0.0.1:5000/api/generate-long-tail", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyword: "seo strategy" })
  });
  console.log(res.status);
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

test().catch(console.error);
