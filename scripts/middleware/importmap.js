// Export the import map resolving middleware
export function importMapMiddleware(config) {

  // Define the import map data
  let importMap = {
    imports: {}
  };

  // Check if there is an import map
  if (config.importmap) (async() => {

    // Define the read function
    const readJSON = async(path) => await Deno.readTextFile(path).then(r => JSON.parse(r));

    // Read and bind the import map
    importMap = await readJSON(config.importmap);

    // Create a file watcher for the importmap
    const watcher = Deno.watchFs(config.importmap);
    
    // Watch for the events in the directory
    for await (const event of watcher) {

      // Skip certian events
      if (['any', 'access'].includes(event.kind)) continue;

      // Read and bind the import map
      importMap = await readJSON(config.importmap);
    }
  })();

  // Return the Import Map middleware
  return async (context, next) => {

    // Extract the pathname
    const path = context.request.url.pathname;

    // Define the esm module path
    const esmpath = path.replace('/esm/', '');

    // Check if the esmpath is in the import maps
    if (Object.keys(importMap.imports).includes(esmpath)) {

      // Fetch the resource from the esmpath
      const resource = await fetch(importMap.imports[esmpath], {
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36'
        }
      });

      // Bind the body
      let body = await resource.text();

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
      context.response.headers.set('Content-Type', 'text/javascript');
      context.response.body = body
      context.response.status = resource.status;
    
    // Map all of the imports statically
    } else if (['/', '.html', '.js', '.mjs'].some(type => path.endsWith(type))) {

      // IGNORE FOR LOCAL BUILDING
      // // Replace any modules for esm
      // context.response.body = context.response.body.replaceAll(/(import.*?from.*?[\'\"])(?<!\.+\/)([\w\@\_\-\/]*?)([\'\"])/igm, (m, pre, mod, post) => {
        
      //   // Return the replace route
      //   return pre + '/esm/' + mod + post;
      //   // return m;
      //   // return pre + imports[mod] + post;
      // });

      // Continue to next functionality
      await next();
    
    // Otherwise continue to the next functionality
    } else await next();
  }
}