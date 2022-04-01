// Import the external packages
import { transform, build } from 'https://deno.land/x/esbuild@v0.14.18/mod.js';
import { ensureFileSync } from 'https://deno.land/std/fs/mod.ts';

// Exists sync function
function existsSync(filepath) {
  try {
    ensureFileSync(filepath);
    return true;
  } catch {
    return false;
  }
}

// Contents exists function
function hasContents(filepath) {
  try {
    const { length } = Deno.readTextFileSync(filepath);
    if (length > 0) return true;
  } catch {}
  return false;
}

// Export the esbuild middleware
export function esbuildMiddleware() {

  // Return the esbuild middleware
  return async (context, next) => {

    // Define the path
    const path = context.request.url.pathname;

    // Check if the file is to be a bundle
    if (path.indexOf('-bundle.js') > -1) {

      // Define the file path
      const filepath = Deno.cwd() + path.replace('-bundle.js', '');

      // Bundle with esbuild
      const output = await build({
        entryPoints: [filepath],
        bundle: true,
        format: 'esm',
        loader: {
          '.js': 'jsx'
        },
        minify: true,
        write: false
      });

      // Send the response payload
      context.response.body = output.outputFiles[0].contents;
      context.response.headers.set('Content-Type', 'text/javascript');
      context.response.status = 200;

    // Check if the path is a javascript file and exists
  } else if (['.js', '.mjs', '.jsx'].some(type => path.endsWith(type)) && context.response.status == 200) {

      // Skip if an imported es module
      if (path.indexOf('/esm/') == 0) await next();

      // Transform with esbuild
      const transformed = await transform(context.response.body, {
        format: 'esm',
        loader: 'jsx',
        minify: true,
        pure: []
      });

      // If there is transformed code then update the body with it
      if (transformed.code) context.response.body = transformed.code;

  
    // Handle building of node modules    
    } else if (path.indexOf('/esm-local/') == 0) {

      // Define the local file path
      let localPath = `.${path.replace('esm-local', 'node_modules')}`;

      // Attempt to read the file and if needed transform the code
      // try {

        // Determine if there is a seperator needed or not
        const sep = (path.endsWith('/')) ? '' : '/';

        // Define the package json path
        const packageJSON = `${localPath}${sep}package.json`;

        if (existsSync(packageJSON)) console.log(packageJSON, hasContents(packageJSON));

        // Check if the package.json exists here and has valid contents
        if (existsSync(packageJSON) && hasContents(packageJSON)) {

          // Read the package json to get the main file
          const { main, module } = await Deno.readTextFile(packageJSON).then(r => JSON.parse(r));

          // Determine the file to point to
          const file = (module != undefined) ? module : main;

          // Define the url href
          const base = context.request.url.href.replace('http:', 'https:');

          // Add the response
          context.response.body = `export * from '${base + sep + file}';`;
          context.response.headers.set('Content-Type', 'text/javascript');
          context.response.status = 200;

        // Check if the file is a javascript file
        } else if (['.js', '.mjs', '.cjs', '.jsx'].some(type => path.endsWith(type))) {

          // Read the code from the main file
          let code = await Deno.readTextFile(localPath);

          // Transform with esbuild
          const transformed = await transform(code, {
            target: 'es2021',
            loader: 'jsx',
            minify: true,
            pure: []
          });

          // Add the headers
          context.response.headers.set('Content-Type', 'text/javascript');
          context.response.status = 200;

          // Define the import export regex
          const regex = /((?:(?:import|export).*?from.*?|require\()[\'\"])(?<!\.+\/)([\w\@\_\-\/]*?)([\'\"])/igm;

          // Replace any modules for esm-local and bind to the body
          context.response.body = String(transformed.code || code).replaceAll(regex, (m, open, route, close) => {

            // Return the routed module module
            return open + '/esm-local/' + route + close;
          });

        // Otherwise try to route to the file without extension name
        } else {

          // Attempt to find the file extension
          const extension = ['.js', '.mjs', '.cjs', '.jsx', '.json'].find(ext => existsSync(localPath + ext));

          // If there is a location
          if (extension) {

            // Apply the relocation (temporary)
            context.response.headers.set('Location', context.request.url.href + extension)
            context.response.status = 307;
          }
        }

        // Throw for catch
      // } catch (e) {

      //   console.log(e);
      // }
      
            // Bind the body
            // let body = await resource.text();
      
            // console.log(body)
      
            // // Replace any references and add them to the map
            // body = body.replaceAll(/(import.*?from.*?[\'\"])(?:https\:\/\/cdn\.esm\.sh\/v66\/)([\w\@\_\-\/]*?)([\'\"])/igm, (m, pre, mod, post) => {
      
            //   // Check if the map is already stored and save if not
            //   if (!importmap.imports[mod]) importmap.imports[mod] = `https://cdn.esm.sh/v66/${mod}`;
      
            //   // console.log(mod)
              
            //   // Return the replace route
            //   return pre + '/esm/' + mod + post;
            // });
            
            // Send the resource
            // context.response.headers.set('Content-Type', 'text/javascript');
            // context.response.body = body
            // context.response.status = resource.status;
    }
    
    // Continue to the next middleware
    await next();
  }
}