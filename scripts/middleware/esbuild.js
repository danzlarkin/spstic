// Import the external packages
import { transform } from 'https://deno.land/x/esbuild@v0.14.18/mod.js';

// Export the esbuild middleware
export function esbuildMiddleware() {

  // Return the esbuild middleware
  return async (context, next) => {

    // Define the path
    const path = context.request.url.pathname;

    // Check if the path is a javascript file and exists
    if (['.js', '.mjs', '.jsx'].some(type => path.endsWith(type)) && context.response.status == 200) {

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
    } 
    
    // Continue to the next middleware
    await next();
  }
}