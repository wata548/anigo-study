import { createClient } from "@supabase/supabase-js";
import { Console } from "console";

const supabaseUrl = process.env.DB_URL as string;
const OIDCToken = process.env.VERCEL_OIDC_TOKEN as string;
console.log(supabaseUrl);
console.log(OIDCToken);
export const supabase = createClient(supabaseUrl, OIDCToken);