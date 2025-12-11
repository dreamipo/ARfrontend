import { createClient } from "@supabase/supabase-js";

// const SUPABASE_URL = "https://eepqytijpdiejpmjmkda.supabase.co";
const SUPABASE_URL = "https://dqwqvzwoxjthmkdavwol.supabase.co";

// const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcHF5dGlqcGRpZWpwbWpta2RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MjU1NjksImV4cCI6MjA3OTIwMTU2OX0.AwCaYJcjIufqk_0Ukp0XFMzN_7O_L-7jLVwhBYlgwWY";

const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxd3F2endveGp0aG1rZGF2d29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyODQ4NzQsImV4cCI6MjA4MDg2MDg3NH0.XiMUVspgg9Xtxv3DOqRa1bqbWAUnBi9_4kr4tqMtMSE";
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
