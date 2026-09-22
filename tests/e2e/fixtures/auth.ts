// Only fictitious identities. Real login helpers arrive with T015–T021.
// This fixture does not bypass authentication or claim a user is authenticated.
export const fictitiousIdentities = {
  candidate: "candidate@example.invalid",
  company: "company@example.invalid",
  admins: ["admin1@example.invalid", "admin2@example.invalid", "admin3@example.invalid", "admin4@example.invalid"],
} as const;
