// Export the favicon middleware
export function faviconMiddleware() {

  // Return the favicon middleware
  return async (context, next) => {

    // Check if the path is favicon
    if (context.request.url.pathname == '/favicon.ico') {

      // Fetch the deno favicon
      const response = await fetch('https://deno.land/favicon.ico');
      
      // Send the favicon
      context.response.headers.set('Content-Type', 'image/vnd.microsoft.icon');
      context.response.body = await response.body;
      context.response.status = response.status;
    
    // Otherwise continue to the next functionality
    } else await next();
  }
}