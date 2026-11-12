import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import { HelmetProvider, type HelmetServerState } from "react-helmet-async";
import { StaticRouter } from "react-router-dom";
import App from "./App";
import Seo from "./components/Seo";

export { publicPages, utilityPages, SITE_URL } from "./lib/seo";

export function render(path: string, includeApp = true): Promise<{ html: string; head: string }> {
  return new Promise((resolve, reject) => {
    const context: { helmet?: HelmetServerState } = {};
    const output = new PassThrough();
    let html = "";
    output.on("data", (chunk) => { html += chunk.toString(); });
    output.on("error", reject);
    output.on("end", () => {
      const helmet = context.helmet!;
      resolve({ html, head: helmet.title.toString() + helmet.meta.toString() + helmet.link.toString() });
    });
    const stream = renderToPipeableStream(
      <HelmetProvider context={context}>
        <StaticRouter location={path}>
          {includeApp ? <App /> : <Seo />}
        </StaticRouter>
      </HelmetProvider>,
      {
        onAllReady() { stream.pipe(output); },
        onError(error) { stream.abort(); reject(error); },
      },
    );
  });
}
