import { NextResponse } from "next/server";
import { searchJobs } from "@/lib/firebase/firestore";
import { JobFilters } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters: JobFilters = {};

    if (searchParams.get("q")) filters.keyword = searchParams.get("q")!;
    if (searchParams.get("location")) filters.location = searchParams.get("location")!;
    if (searchParams.get("type")) filters.jobType = [searchParams.get("type")!] as JobFilters["jobType"];
    if (searchParams.get("mode")) filters.workMode = [searchParams.get("mode")!] as JobFilters["workMode"];
    if (searchParams.get("level")) filters.experienceLevel = searchParams.get("level")! as JobFilters["experienceLevel"];

    const { jobs } = await searchJobs(filters);
    return NextResponse.json({ jobs });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
