import { createClient } from "@supabase/supabase-js";
import { Console } from "console";

const supabaseUrl = process.env.REACT_APP_DB_URL as string;
const OIDCToken = process.env.REACT_APP_VERCEL_OIDC_TOKEN as string;
export const supabase = createClient(supabaseUrl, OIDCToken);