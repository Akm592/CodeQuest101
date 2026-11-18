import { renderToReadableStream } from "react-dom/server.browser";
import { HelmetProvider, type HelmetServerState } from "react-helmet-async";
import { StaticRouter } from "react-router-dom";
import App from "./App";
import Seo from "./components/Seo";

export { publicPages, utilityPages, SITE_URL } from "./lib/seo";

export async function render(path: string, includeApp = true): Promise<{ html: string; head: string }> {
  const context: { helmet?: HelmetServerState } = {};
  let failed = false;
  let failure: unknown;
  // Web Streams avoid React 18's UTF-8 boundary padding bug: https://github.com/facebook/react/issues/31134.
  const stream = await renderToReadableStream(
    <HelmetProvider context={context}>
      <StaticRouter location={path}>
        {includeApp ? <App /> : <Seo />}
      </StaticRouter>
    </HelmetProvider>,
    { onError(error) { failed = true; failure = error; } },
  );
  await stream.allReady;
  if (failed) throw failure;
  const html = await new Response(stream).text();
  const helmet = context.helmet!;
  return { html, head: helmet.title.toString() + helmet.meta.toString() + helmet.link.toString() };
}
