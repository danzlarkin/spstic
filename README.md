<p align="center">
  <a href="https://github.com/danzlarkin/spstic" target="_blank">
    <img src="https://i.imgur.com/xTqezUD.png">
  </a>
</p>

***

Static service tool using Deno (esbuild & live-reloading), Ngrok, Certbot and Cloudflare

## Overview

* Deno is used to create a static file server (including esbuild & live-reloading)
* Ngrok is used to tunnel this server to any specified domain
* Certbot is used to issue a TLS/SSL certificate for the specified domain
* Cloudflare is used for DNS service

## Requirements

You must first have [Deno](https://deno.land/), [Ngrok](https://ngrok.io/) and [Certbot](https://certbot.eff.org/) installed on your device.

It is also required that you use [Cloudflare](https://cloudflare.com/) as your DNS for your domain.

You'll need to have a [certbot-dns-cloudflare](https://certbot-dns-cloudflare.readthedocs.io/) installed as a plugin for Certbot.

A wildcard domain (e.g. *.example.io) needs to be added to your Ngrok domains and the corresponding CNAME to your Cloudflare DNS records before usage.

## Getting Started

Download this respository, and run the following script in your terminal:

```sh
./setup.sh
```

The setup script will guide you through the setup process.

## Usage

Once setup, [spstic](https://github.com/danzlarkin/spstic) can be ran via terminal in any directory to spin up a static service

```sh
  # The command `spstic`, `spastic` or `static` can be used from terminal

  # Deploy a static service from this directory
  spstic

  # Deploy a static service from this directory on the specfied subdomain (e.g. xyz123)
  spstic --subdomain=[subdomain]

  # Deploy a static service from this directory on the specfied port (e.g. 8080)
  spstic --port=[port]

  # Deploy a static service from this directory without Certbot or Ngrok
  spstic --local

  # Configure the credentials
  spstic --configure

  # Show the help
  spstic --help
```

Any required TLS/SSL certificates will be generated and uploaded.

The web address for your service will be displayed in the terminal.

Any JavaScript/JSX files will be minified and transpiled as ES Modules with esbuild.

Any changes made to files in your directory will be live-reloaded.

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2022-present, Daniel Larkin