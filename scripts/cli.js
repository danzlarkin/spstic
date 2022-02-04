#!/usr/bin/env -S deno run --allow-all --unstable

// Import the local packages
import { generateWildcardCertificate } from './certificate.js';
import { generateService } from './service.js';

// Define the main function
async function main() {

  // Define the config
  const config = {};

  // Fetch the port and subdomain if they exists
  for (const arg of Deno.args) {

    // Attempt to extract a subdomain
    if (arg.indexOf('--subdomain=') > -1) config.subdomain = arg.replace('--subdomain=', '');

    // Attempt to extract a port
    if (arg.indexOf('--port=') > -1) config.port = Number(arg.replace('--port=', ''));

    // Attempt to extract the importmap
    if (arg.indexOf('--importmap=') > -1) config.importmap = arg.replace('--importmap=', '');
  }

  // Generate the certificates
  await generateWildcardCertificate();

  // Generate the service
  await generateService(config);
}

// Run the main function if running as shell
if (Deno.args.indexOf('--shell') > -1) await main();