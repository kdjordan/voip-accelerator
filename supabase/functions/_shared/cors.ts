// Environment-specific allowed origins
const getAllowedOrigins = (): string[] => {
  const origins = [
    // Development
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    
    // Add your actual domains here:
    "https://staging.d2fnr90mzdyqva.amplifyapp.com",
    "https://voipaccelerator.com",
    "https://www.voipaccelerator.com"
  ];
  
  // Add environment-specific origins from env vars if available
  const envOrigins = Deno.env.get("ALLOWED_ORIGINS");
  if (envOrigins) {
    origins.push(...envOrigins.split(",").map(origin => origin.trim()));
  }
  
  return origins;
};

export const getCorsHeaders = (requestOrigin?: string): Record<string, string> => {
  const allowedOrigins = getAllowedOrigins();
  
  console.log('🔍 CORS Debug - Request origin:', requestOrigin);
  console.log('🔍 CORS Debug - Allowed origins:', allowedOrigins);
  
  // Check if the request origin is in our allowed list
  const origin = requestOrigin && allowedOrigins.includes(requestOrigin) 
    ? requestOrigin 
    : "*"; // Allow all origins temporarily for debugging
  
  console.log('🔍 CORS Debug - Using origin:', origin);
  
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Credentials": origin === "*" ? "false" : "true",
  };
};

// Legacy export for backward compatibility
export const corsHeaders = getCorsHeaders();
