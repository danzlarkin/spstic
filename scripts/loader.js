// Import the standard modules
import { existsSync } from 'https://deno.land/std/fs/mod.ts';

// Import the configuration
import { ScriptsDirectory } from '../config/config.js';

// Define the flags
const flags = {
  deno: ['deno', 'run', '--allow-all', '--unstable'],
  script: [`${ScriptsDirectory}/cli.js`, '--shell', ...Deno.args]
}

// Check if there is an import map
if (existsSync(`${Deno.cwd()}/import_map.json`)) {
  
  // Add the import map to the flags
  flags.deno.push(`--importmap=${Deno.cwd()}/import_map.json`);
  flags.script.push(`--importmap=${Deno.cwd()}/import_map.json`);

  // Log to console
  console.log(`\x1b[34m\x1b[1m[spstic]\x1b[0m Using import map located at ${Deno.cwd()}/import_map.json`);
}

// Run the server instance
const service = Deno.run({ 
  cmd: Object.values(flags).flat()
});

// Await the service
await service.status();