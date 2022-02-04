// Export the import map resolving middleware
export function importMapMiddleware(config) {

  // Define the imports
  let imports = {};

  // Check if there is an import map
  if (config.importmap) (async() => {

    // Read the import map
    const data = await Deno.readTextFile(config.importmap);

    // Parse as json
    const importmap = JSON.parse(data);

    // Bind the imports
    imports = importmap.imports;
  })();

  // Return the Import Map middleware
  return async (context, next) => {

    // Extract the pathname
    const path = context.request.url.pathname;

    // Define the esm module path
    const esmpath = path.replace('/esm/', '');

    // Check if the esmpath is in the import maps
    if (Object.keys(imports).includes(esmpath)) {

      // Fetch the resource from the esmpath
      const resource = await fetch(imports[esmpath], {
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36'
        }
      });
      
      // Send the resource
      context.response.headers.set('Content-Type', 'application/javascript');
      context.response.body = await resource.body;
      context.response.status = resource.status;
    
    // Map all of the imports statically
    } else if (['/', '.html', '.js', '.mjs'].some(type => path.endsWith(type))) {

      // Replace any modules for esm
      context.response.body = context.response.body.replaceAll(/(import.*?from.*?[\'\"])(?<!\.+\/)([\w\@\_\-\/]*?)([\'\"])/igm, (m, pre, mod, post) => pre + '/esm/' + mod + post);

      // Continue to next functionality
      await next();
    
    // Otherwise continue to the next functionality
    } else await next();
  }
}