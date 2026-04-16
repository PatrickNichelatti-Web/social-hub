import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lzxtmjrregjtbdcunhr.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6eHRtanJycmVnanRiZGN1bmhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNzk2NDksImV4cCI6MjA5MTg1NTY0OX0.w0jhJo2xE-yrWI8v0L7gjvPCKegQX7ON-WkxKE863BU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
