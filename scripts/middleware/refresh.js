// Import the configurations
import { ScriptsDirectory } from '../../config/config.js';

// Export the refresh / live-reload middleware
export function refreshMiddleware() {

  // Create a list of sockets
  const sockets = new Set();

  // Create a watcher to observe changes in the socket
  async function watch(path, recursive = true) {

    // Return if is this path
    if (path.includes('spstic')) return;
    
    // Watch for the events in the directory
    for await (const event of Deno.watchFs(path, { recursive })) {

      // Skip certian events
      if (['any', 'access'].includes(event.kind)) continue;

      // Log the refresh message
      console.log('\x1b[34m\x1b[1m[spstic]\x1b[0m Detected changes is workspace -- refreshing...');

      // Add the watcher socket
      sockets.forEach(socket => socket.send('refresh'));
    }
  }

  // Create a watcher for the current directory (non recursive)
  watch(Deno.cwd(), false);

  // Read the current directories
  for (const item of Deno.readDirSync(Deno.cwd())) {

    // Check if the item is a directory and if so watch recursively
    if (item.isDirectory) watch(`${Deno.cwd()}/${item.name}`);
  }

  // Return the middleware functionality
  return async (context, next) => {

    // Extract the path
    const path = context.request.url.pathname;

    // Handle refreshing socket
    if (path.endsWith('/refresh')) {

      // Upgrade the request to a websocket
      const socket = await context.upgrade();

      //Add the socket to the store.
      sockets.add(socket);

      // Remove the socket from the store
      socket.onclose = () => sockets.delete(socket);

    // Handle refreshing injection script
    } else if (path.endsWith('/refresh.js')) {

      // Send back the script
      context.response.headers.set('Content-Type', 'text/javascript');
      context.response.body = await Deno.readTextFile(`${ScriptsDirectory}/client-injection.js`);
      context.response.status = 200;

    // Add the injection to any html pages
    } else if (['/', '.html'].some(type => path.endsWith(type))) {

      // Append the refresh script to the head
      context.response.body = context.response.body.replace(/\<head\>/ig, `<head>\n<script type="text/javascript" src="/refresh.js"></script>`);

      // Continue to the next
      await next();
    
    // Otherwise proceed to next functionality
    } else await next();
  }
}