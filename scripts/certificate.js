// Import the configuration
import { ConfigDirectory, CertbotDirectory, BaseDomain, WildcardDomain, NgrokAPIKey } from '../config/config.js';

// Generate TLS certificate for a wildcard domain
export async function generateWildcardCertificate() {

  // Define a flag for whether generation is needed
  let needsGeneration = false;

  // Define the headers
  const headers = {
    'Authorization': `Bearer ${NgrokAPIKey}`,
    'Content-Type': 'application/json',
    'Ngrok-Version': '2'
  }

  // Make a fetch request to ngrok services to find the current certificate
  const list = await fetch('https://api.ngrok.com/tls_certificates', {
    method: 'GET',
    headers: headers
  }).then(r => r.json());

  // Check if there are any current certificates
  if (list.tls_certificates.length > 0) {

    // Find the certificate
    const certificate = list.tls_certificates.find(({ description }) => description == WildcardDomain);

    // If there is a certificate
    if (certificate) {

      // Find the expiry date of the certificate
      const expiry = new Date(certificate.not_after).setHours(0, 0, 0);

      // Check if needs replacing
      if (expiry < Date.now()) {

        // Update the flag as the certifcate has expired
        needsGeneration = true;

        // Log out a message
        console.log(`\x1b[34m\x1b[1m[spstic]\x1b[0m Certificate has expired, removing the exisiting ${WildcardDomain} certificate on ngrok`);
        
        // Delete the certificate
        await fetch(`https://api.ngrok.com/tls_certificates/${certificate.id}`, {
          method: 'DELETE',
          headers
        });
      }

    // No certificate exists yet so one needs to be generated
    } else { needsGeneration = true };

  // No certificate exists yet so one needs to be generated
  } else { needsGeneration = true };

  // Check if a certificate needs generation
  if (needsGeneration) {

    // Generate a new certificate using certbot script
    const certbot = Deno.run({
      cmd: [
        'certbot',
        'certonly',
        '--dns-cloudflare',
        '--dns-cloudflare-credentials',
        `${ConfigDirectory}/cloudflare.ini`,
        `--config-dir=${CertbotDirectory}`,
        `--work-dir=${CertbotDirectory}`,
        `--logs-dir=${CertbotDirectory}`,
        '--non-interactive',
        '--agree-tos',
        '-m', 
        `webmaster@${BaseDomain}`,
        '-d',
        `${WildcardDomain}`
      ]
    });

    // Await for certbot
    await certbot.status();

    // Load the public and private certificates
    const certificate_pem = await Deno.readTextFile(`${CertbotDirectory}/live/${WildcardDomain}/fullchain.pem`);
    const private_key_pem = await Deno.readTextFile(`${CertbotDirectory}/live/${WildcardDomain}/privkey.pem`);

    // Make a fetch request to ngrok services to upload a new certificate
    const certificate = await fetch('https://api.ngrok.com/tls_certificates', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        'description': `${WildcardDomain}`, 
        'certificate_pem': certificate_pem, 
        'private_key_pem': private_key_pem
      })
    }).then(r => r.json());

    // Check the certificate was uploaded
    if (certificate) {

      // Log out a message for successful upload
      console.log(`\x1b[34m\x1b[1m[spstic]\x1b[0m Uploaded the ${WildcardDomain} certificate to ngrok`);

      // Make a fetch request to ngrok services to find the current domains
      const list = await fetch('https://api.ngrok.com/reserved_domains', {
        method: 'GET',
        headers: headers
      }).then(r => r.json());

      // Check if there are any current certificates
      if (list.reserved_domains.length > 0) {

        // Find the domain
        const domain = list.reserved_domains.find(({ domain }) => domain == WildcardDomain);

        // Check if there is a domain
        if (domain) {

          // Make a fetch request to ngrok services apply the certificate to the domain
          const updated = await fetch(`https://api.ngrok.com/reserved_domains/${domain.id}`, {
            method: 'PATCH',
            headers: headers,
            body: JSON.stringify({
              'certificate_id': certificate.id
            })
          }).then(r => r.json());

          // Log out the message for certificate update
          console.log(`\x1b[34m\x1b[1m[spstic]\x1b[0m Applied the certificate for ${WildcardDomain} on ngrok`);
        }
      }
    }

  // No certficate was needed so log that
  } else {

    // Log out the message
    console.log(`\x1b[34m\x1b[1m[spstic]\x1b[0m Certificate is already valid for ${WildcardDomain} on ngrok`);
  }

  // Return on completion
  return true;
}