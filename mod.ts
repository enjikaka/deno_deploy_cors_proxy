import { serve } from "https://deno.land/std@0.143.0/http/server.ts";

let origin;

/**
 * Generates Headers with Access-Control-Allow-Origin.
 * If a response is passed in, the headers are cloned
 * and the CORS header set before the Headers are returned.
 */
function corsHeaders(response?: Response): Headers {
  const headers = new Headers(response ? response.headers : {});
  const allowedOrigins = [
    'https://podd.app',
    'https://enjikaka-podd-app.deno.dev'
  ]
  
  if (allowedOrigins.includes(origin)) {
    headers.set("access-control-allow-origin", origin);
  }

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

async function handler (request: Request) {
  const { pathname } = new URL(request.url);
  const url = pathname.substr(1);
  origin = request.headers.get('origin');

  if (isUrl(url)) {
      // Respond to OPTIONS requests to this proxy service
      if (request.method.toUpperCase() === "OPTIONS") {
        return new Response(null, { headers: corsHeaders() });
      }

      /*
        Make an OPTIONS request to the target URL to
        assert if we need to set CORS headers or not.
        (Optimization to use as little data on Deno Deploy as possible)
      */
      const optResponse = await fetch(url, {
        method: 'OPTIONS'
      });

      if (newCorsNeeded(optResponse)) {
        console.log("Proxy to %s", url);
        const response = await fetch(url, request);

        if (newCorsNeeded(response)) {
          return new Response(response.body, { ...response, headers: corsHeaders(response) });
        }
      }

      console.log("CORS already in order. Redirect to %s", url);

      const redirectHeaders = corsHeaders();
      redirectHeaders.set('Location', url);

      return new Response(null, {
        status: 302,
        headers: redirectHeaders
      });
  }

  const usage = new URL("README.md", import.meta.url);
  return fetch(usage);
}

await serve(handler);
