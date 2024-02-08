import { createClient } from "@supabase/supabase-js";
import config from './.env.json'

// This key has to be anon key, not service key
const supabase = createClient(config.Supa_url, config.Supa_Anon_Key);

export default supabase;