import { NextResponse } from "next/server";
import { hasMongo, hasSupabase } from "@/lib/env";
export function GET() { return NextResponse.json({ ok: true, services: { supabase: hasSupabase, mongodb: hasMongo } }); }
