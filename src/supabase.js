import { createClient } from "@supabase/supabase-js";
import config from './.env.json'

const supabase = createClient(config.Supa_url, config.Supa_Key);

export default supabase;