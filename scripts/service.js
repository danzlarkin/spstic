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

  // Define the ngrok service
  let ngrok;

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
  const service = app.listen({ port: config.port, signal: controller.signal });

  // Handle signals to kill
  Deno.addSignalListener('SIGUSR1', () => {

    // 
    console.log('recieved signal');
  
    // Kill the service and this script
    controller.abort();

    // Kill the ngrok service if exists
    if (ngrok) ngrok.kill('SIGINT');

    // Exit the script
    Deno.exit(0);
  });

  // Log out a message as served
  console.log(`\x1b[34m\x1b[1m[spstic]\x1b[0m Deployed locally to http://localhost:${config.port}`);

  // If not local only use ngrok
  if (!config.localonly) {

    // Start an ngrok service
    ngrok = Deno.run({
      cmd: [
        'ngrok',
        'http',
        `-authtoken=${NgrokAuthtoken}`,
        '-region=au',
        `-hostname=${config.subdomain}.${BaseDomain}`,
        config.port
      ],
      stdout: config.verbose ? 'piped' : 'inherit'
    });

    // Wait for ngrok to close
    await ngrok.status();

  // Otherwise run localonly
  } else await service;
  
  // Log out a message for shutdown
  console.log('\x1b[34m\x1b[1m[spstic]\x1b[0m Shutting service down...');

  // Terminate the service
  controller.abort();

  // Exit the script
  Deno.exit(0);
}