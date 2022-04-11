// Import the standard modules
import { existsSync } from 'https://deno.land/std/fs/mod.ts';

// Import the configuration
import { ScriptsDirectory } from '../config/config.js';

// Define the config
const config = {};

// Define the service instance
let service;

// Define the previous timeout
let timeout = Date.now();

// Create a service
async function createService() {

  // Define the flags
  const flags = {
    deno: ['deno', 'run', '--allow-all', '--unstable', '--no-check'],
    script: [
      `${ScriptsDirectory}/cli.js`, '--shell', 
      ...Object.entries(config).map(([key, value]) => `--${key}=${value}`)
    ]
  }

  // Run the server instance
  service = Deno.run({ 
    cmd: Object.values(flags).flat()
  });

  await service.status();

  // Return the service
  return service;
}

// Iterate through each of the arguments
for (const arg of Deno.args) {

  // Attempt to extract a subdomain
  if (arg.indexOf('--subdomain=') > -1) config.subdomain = arg.replace('--subdomain=', '');

  // Attempt to extract a port
  if (arg.indexOf('--port=') > -1) config.port = Number(arg.replace('--port=', ''));

  // Attempt to extract the importmap
  if (arg.indexOf('--importmap=') > -1) config.importmap = arg.replace('--importmap=', '');

  // Attempt to disable ngrok and certificates
  if (arg.indexOf('--local') > -1) config.localonly = true;

  // Attempt to verbose errors
  if (arg.indexOf('--verbose') > -1) config.verbose = true;
}

// Generate a random port between 8100 and 8200
config.port = config.port || (8100 + (Math.round(Math.random() * 99) + 1));

// Generate a random domain from that port
config.subdomain = config.subdomain || (config.port + Math.random() + 1).toString(36).substr(4, 8);

// Define the import map path
config.importmap = `${Deno.cwd()}/${config.importmap || 'import_map.json'}`;

// Check if there is an import map
if (existsSync(config.importmap)) {

  // Handle the file watcher
  /*((async() => {

    // Create a file watcher for the importmap
    const watcher = Deno.watchFs(config.importmap);

    // Watch for the events in the directory
    for await (const event of watcher) {

      // Skip certian events
      if (['any', 'access'].includes(event.kind)) continue;

      // Check the last timeout is more than 2 seconds ago
      if (Date.now() > timeout + 2000) {

        // Update the timeout
        timeout = Date.now();

        // Check if a service is running
        if (service && event.kind == 'modify') {

          // Kill the service
          try { await service.kill('SIGUSR1') } catch {};

          // Create a new service
          await createService();

          // Log to console
          console.log(`\x1b[34m\x1b[1m[spstic]\x1b[0m Reloading import map located at ${config.importmap}`);

          // Await the service status
          // await service.status();
        }
      }
    }
  })());*/

  // Log to console
  console.log(`\x1b[34m\x1b[1m[spstic]\x1b[0m Using import map located at ${config.importmap}`);

// Otherwise remove the importmap from the config args
} else {
  
  // Delete the importmap flag
  delete config.importmap; 
}

// Create a service
await createService();

// // Await the service status
// await service.status();