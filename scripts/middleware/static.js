// Import the external modules
import { readableStreamFromReader } from 'https://deno.land/std/streams/mod.ts';

// Export the static file service middleware
export function staticMiddleware() {
  
  // Return the middleware
  return async(context, next) => {

    // Attempt to route as needed
    try {

      // Determine whether the file is an index
      const index = context.request.url.pathname.endsWith('/') ? true : false;

      // Determine the file path
      const path = (Deno.cwd() + context.request.url.pathname + (index ? 'index.html' : ''));

      // Add the file types for javascript files
      if (['.js', '.mjs'].some(type => path.endsWith(type))) context.response.headers.set('Content-Type', 'application/javascript');

      // Read the html, js and mjs files
      if (['.html', '.js', '.mjs'].some(type => path.endsWith(type))) {

        // Read the file as text
        let data = await Deno.readTextFile(path);

        // Send back the ammended html as the response
        context.response.body = data;

      // Stream back every other file
      } else {

        // Read the file as a stream
        const file = await Deno.open(path, { read: true });

        // Create a readable filestream
        const readableStream = readableStreamFromReader(file);

        // Send back the stream as the response
        context.response.body = readableStream;
      }
    
    // Catch all errors and return a 404
    } catch (error) {

      // Wrap html
      const html = (title, content) => `<html><head><title>${title}</title></head><body><p>${content}</p></body></html>`;

      // Return the 404 page
      context.response.status = 404;
      context.response.body = html('404 - Not Found', `Cannot ${context.request.method} ${context.request.url.pathname}`);
    }

    // Continue forward to the next middleware
    await next();
  }
}