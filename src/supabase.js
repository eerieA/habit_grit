import { createClient } from "@supabase/supabase-js";

// This key has to be service key, not anon key
const supabase = createClient(process.env.REACT_APP_Supa_url, process.env.REACT_APP_Supa_Service_Key);

export default supabase;