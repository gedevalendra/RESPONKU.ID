const groqApiKeys = Array.from(new Set([
  process.env.GROQ_API_KEY,
  ...(process.env.GROQ_API_KEYS || "").split(","),
].map((key) => key?.trim()).filter((key): key is string => Boolean(key)))).slice(0, 4);
const geminiApiKeys = Array.from(new Set([
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  ...(process.env.GEMINI_API_KEYS || "").split(","),
].map((key) => key?.trim()).filter((key): key is string => Boolean(key)))).slice(0, 2);

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabasePublicKey:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseStorageBucket: process.env.SUPABASE_STORAGE_BUCKET || "articles",
  groqApiKey: groqApiKeys[0],
  groqApiKeys,
  groqModel: process.env.GROQ_MODEL,
  geminiApiKeys,
  geminiModel: process.env.GEMINI_MODEL || "gemini-3.1-flash-lite",
  vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY,
  vapidSubject: process.env.VAPID_SUBJECT || "mailto:admin@responku.id",
  mongodbUri: process.env.MONGODB_URI,
  mongodbDbName: process.env.MONGODB_DB_NAME || "responku",
  funikinSupabaseUrl: process.env.FUNIKIN_SUPABASE_URL || "https://wkitepiehrgpnoprgcqx.supabase.co",
  funikinSupabaseAnonKey:
    process.env.FUNIKIN_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndraXRlcGllaHJncG5vcHJnY3F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU0OTUxNjksImV4cCI6MjExMTA3MTE2OX0.iCfPQ8JwPRCRzZil1Gm3o5enkxzYoDVnSTD2GdPJzPw",
  funikinSupabaseSecretKey: process.env.FUNIKIN_SUPABASE_SECRET_KEY || "",
  funikinAuthUrl: process.env.NEXT_PUBLIC_FUNIKIN_AUTH_URL || "https://auth.funikin.com",
};

export const hasSupabase = Boolean(
  env.supabaseUrl && env.supabaseServiceRoleKey,
);
export const hasMongo = Boolean(env.mongodbUri);
export const hasGroq = Boolean(env.groqApiKeys.length && env.groqModel);
export const hasGemini = Boolean(env.geminiApiKeys.length && env.geminiModel);
