"use server";
import { publicErrorFrom } from "@/lib/errors/public-error";
import { screenAssistedDuplicates } from "./duplicate-service";
export async function screenDuplicatesAction(input: unknown) {
  try { return { matches: await screenAssistedDuplicates(input), message: "" }; }
  catch (error) { return { matches: [], message: publicErrorFrom(error).message }; }
}
