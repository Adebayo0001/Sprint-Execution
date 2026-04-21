# Security Specification - The Sprint Execution 2026

## Data Invariants
- A lead must have a valid full name, email, and whatsapp number.
- `created_at` must be the server time of the request.
- `support_level` must be one of 'group_only' or 'group_plus_support'.
- Leads can only be created. Read/Update/Delete is restricted (only system-level or future admin access).

## The "Dirty Dozen" Payloads (Denial Tests)
1. Missing `full_name`.
2. Invalid `email` format.
3. `support_level` not in enum.
4. `created_at` set to a future date by client.
5. `full_name` exceeding 200 characters (Resource Poisoning).
6. Unauthorized `read` request.
7. Unauthorized `update` request attempting to change `support_level`.
8. Unauthorized `delete` request.
9. Invalid characters in `whatsapp` (e.g., 1MB string).
10. Submission without `goal`.
11. Attempting to set an arbitrary field `isAdmin: true`.
12. Attempting to submit multiple leads rapidly (handled by Firebase quotas/rate limits usually, but rules can restrict IDs).

## Test Runner Logic
- `match /sprint_leads/{leadId}`: Allow create if all fields valid and `request.time` matches.
- Deny all other operations.
