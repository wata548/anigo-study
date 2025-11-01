import { createClient } from "@supabase/supabase-js";

// ⬇️ 여기에 본인의 Supabase 정보 입력!
const supabaseUrl = "https://cqkvmkuyihyqfovrpdar.supabase.co"; // 예: https://abcdefg.supabase.co
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxa3Zta3V5aWh5cWZvdnJwZGFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MzkwOTgsImV4cCI6MjA3NzMxNTA5OH0.u7l61H0yyeVyLup0J-3jWMLTqGzW-5kvC4bGsRjNxYc"; // eyJhbG... 로 시작하는 긴 키

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
// import { createClient } from "@supabase/supabase-js";

// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// export const supabase = createClient(supabaseUrl, supabaseAnonKey);
