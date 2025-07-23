import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@blinkdotnew/sdk";

const blink = createClient({
  projectId: 'ai-diagram-generator-uwcnzx5s',
  authRequired: false
});

serve(async (req) => {
  // Handle CORS for frontend calls
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    // Test database connection
    const testQuery = await blink.db.diagrams.list({ limit: 1 });
    
    const result = {
      status: 'success',
      message: 'Backend is working correctly',
      timestamp: new Date().toISOString(),
      databaseTest: {
        connected: true,
        recordCount: testQuery.length
      }
    };

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Backend test error:', error);
    
    const result = {
      status: 'error',
      message: 'Backend test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(result), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});