// Import the external modules
import { Application } from 'https://deno.land/x/oak/mod.ts';
import { oakCors } from 'https://deno.land/x/cors/mod.ts';

// Import the middleware
import { staticMiddleware } from './middleware/static.js';
import { importMapMiddleware } from './middleware/importmap.js';
import { faviconMiddleware } from './middleware/favicon.js';
import { esbuildMiddleware } from './middleware/esbuild.js';
import { refreshMiddleware } from './middleware/refresh.js';

// Import the configurations
import { BaseDomain, NgrokAuthtoken } from '../config/config.js';

// Generate a service
export async function generateService(config) {

  // Generate a random port between 8100 and 8200
  const port = config.port || (8100 + (Math.round(Math.random() * 99) + 1));

  // Generate a random domain from that port
  const subdomain = config.subdomain || (port + Math.random() + 1).toString(36).substr(4, 8);

  // Create an application
  const app = new Application();

  // Enable CORS middleware
  app.use(oakCors());

  // Enable statics middleware
  app.use(staticMiddleware());

  // Enable favicon middleware
  app.use(faviconMiddleware());

  // Enable import map middleware
  app.use(importMapMiddleware(config));

  // Enable the esbuild middleware
  app.use(esbuildMiddleware());

  // Enable refresh middlewre
  app.use(refreshMiddleware());

  // Create an abort controller
  const controller = new AbortController();

  // Serve to a specified port
  const service = app.listen({ port, signal: controller.signal });

  // Log out a message as served
  console.log(`\x1b[34m\x1b[1m[spstic]\x1b[0m Deployed locally to port ${port}`);

  // Start an ngrok service
  const ngrok = Deno.run({
    cmd: [
      'ngrok',
      'http',
      `-authtoken=${NgrokAuthtoken}`,
      '-region=au',
      `-hostname=${subdomain}.${BaseDomain}`,
      port
    ]
  });

  // Wait for ngrok to close
  await ngrok.status();

  // Log out a message for shutdown
  console.log('\x1b[34m\x1b[1m[spstic]\x1b[0m Shutting service down...');

  // Terminate the service
  controller.abort();

  // Exit the script
  Deno.exit(1);
}