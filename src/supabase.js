import { createClient } from "@supabase/supabase-js";
import config from './.env.json'

// This key has to be service key, not public/anon key
const supabase = createClient(config.Supa_url, config.Supa_Key);

export default supabase;