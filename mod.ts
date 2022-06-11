function corsHeaders(response?: Response) {
  const headers = new Headers(response ? response.headers : {});
  
  headers.set("access-control-allow-origin", "https://podd.app");

  return headers;
}

function newCorsNeeded (response: Response) {
  return !response.headers.has("access-control-allow-origin") || response.headers.get("access-control-allow-origin") !== '*';
}

function isUrl(url: string) {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return false;
  }

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

async function handleRequest(request: Request) {
  const { pathname } = new URL(request.url);
  const url = pathname.substr(1);

  if (isUrl(url)) {
      if (request.method.toUpperCase() === "OPTIONS") {
        return new Response(null, { headers: corsHeaders() });
      }

      const optResponse = await fetch(url, {
        method: 'OPTIONS'
      });

      if (newCorsNeeded(optResponse)) {
        const response = await fetch(url, request);

        return new Response(response.body, { ...response, headers: corsHeaders(response) });
      }

      return new Response(null, {
        status: 302,
        headers: new Headers({
          'Location': url
        })
      });
  }

  const usage = new URL("README.md", import.meta.url);
  return fetch(usage);
}

addEventListener("fetch", (event: FetchEvent) => {
  event.respondWith(handleRequest(event.request));
});
