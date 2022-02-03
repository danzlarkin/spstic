// Import the external packages
import { readableStreamFromReader } from "https://deno.land/std/streams/mod.ts";
import { Application } from 'https://deno.land/x/oak/mod.ts';
import { oakCors } from 'https://deno.land/x/cors/mod.ts';

// Import the configurations
import { ScriptsDirectory, BaseDomain, NgrokAuthtoken } from '../config/config.js';

// Refreshing middleware
function refreshMiddleware() {

  // Create a list of sockets
  const sockets = new Set();

  // Create a file watcher for the working directory
  const watcher = Deno.watchFs(Deno.cwd());

  // Watch the events in the directory
  (async() => {
    
    // Watch for the events in the directory
    for await (const event of watcher) {

      // Skip certian events
      if (['any', 'access'].includes(event.kind)) continue;

      // Add the watcher socket
      sockets.forEach(socket => socket.send('refresh'));
    }
  })();

  // Return the middleware functionality
  return async (context, next) => {

    // Handle refreshing socket
    if (context.request.url.pathname.endsWith('/refresh')) {

      // Upgrade the request to a websocket
      const socket = await context.upgrade();

      //Add the socket to the store.
      sockets.add(socket);

      // Remove the socket from the store
      socket.onclose = () => sockets.delete(socket);

    // Handle refreshing injection script
    } else if (context.request.url.pathname.endsWith('/refresh.js')) {

      // Send back the script
      context.response.body = await Deno.readTextFile(`${ScriptsDirectory}/client-injection.js`);
    
    // Otherwise proceed to next functionality
    } else await next();
  }
}

// Favicon middleware
function faviconMiddleware() {

  // Return the favicon middleware
  return async (context, next) => {

    // Check if the path is favicon
    if (context.request.url.pathname == '/favicon.ico') {

      // Fetch the deno favicon
      const favicon = await fetch('https://deno.land/favicon.ico');
      
      // Send the favicon
      context.response.headers.set('content-type', 'image/vnd.microsoft.icon');
      context.response.body = await favicon.body;
    
    // Otherwise continue to the next functionality
    } else await next();
  }
}

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

  // Enable refresh middlewre
  app.use(refreshMiddleware());

  // Enable favicon middleware
  app.use(faviconMiddleware())

  // Perform static routing and injection
  app.use(async(context) => {

    // Attempt to route as needed
    try {

      // Determine whether the file is an index
      const index = context.request.url.pathname.endsWith('/') ? true : false;

      // Determine the file path
      const path = (Deno.cwd() + context.request.url.pathname + (index ? 'index.html' : ''));

      // Perform modifications to the html
      if (path.endsWith('.html')) {

        // Read the file as text
        let html = await Deno.readTextFile(path);

        // Send back the ammended html as the response
        context.response.body = html + '<script type="text/javascript" src="refresh.js"></script>';

      // Stream back every other file
      } else {

        // Read the file as a stream
        const file = await Deno.open(path, { read: true });

        // Create a readable filestream
        const readableStream = readableStreamFromReader(file);

        // Send back the stream as the response
        context.response.body = readableStream;
      }
    
    // Catch all errors and return a 404
    } catch (error) {

      // Wrap html
      const html = (title, content) => `<html><head><title>${title}</title></head><body><p>${content}</p><script type="text/javascript" src="refresh.js"></script></body></html>`;

      // Return the 404 page
      context.response.status = 404;
      context.response.body = html('404 - Not Found', `Cannot ${context.request.method} ${context.request.url.pathname}`);
    }
  });

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