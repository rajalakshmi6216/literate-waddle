# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Build the UI as route-level React components that fetch from a shared API client and render loading, empty, and error states consistently for all `/api` capabilities.
- Logic tier decision: Keep Express routes thin and move business validation into route/service logic so invalid IDs, missing records, and invalid payloads return deliberate 4xx responses instead of leaking Mongo/Mongoose cast errors as 500s.
- Data tier decision: Define the Mongoose models for `User`, `Team`, `Activity`, and `Workout` with schema constraints that match the API contract, and keep seed data idempotent so repeated runs do not duplicate or corrupt fixtures.
- Activity tracking approach: Accept `userId`, `teamId`, `type`, and `minutes`; verify both references exist; store the submitted values; and compute `points` and `occurredAt` from the validated activity payload.
- Team management approach: Require a team `name`, default empty `members` arrays, and preserve member references while exposing them via the API with clear serialization.
- Leaderboard approach: Aggregate team totals from activity points, sort descending by `totalPoints`, and assign a 1-based rank to each team in the result set.
- Workout suggestions approach: Match each user to the seeded workout data by email, prefer recent activity or fitness goal, and return a ranked list of recommendation objects with `title`, `focus`, `reason`, and a clear 4xx for missing users.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` — validates schema requirements, seed idempotency, and the required Mongoose model fields (`User`, `Team`, `Activity`, `Workout`). Failures here usually mean the data contract is wrong before API or UI work begins.
- API command: `npm run test:api --prefix octofit-tracker/backend` — validates endpoints, request validation, response shapes, error handling, and leaderboard/workout logic. Failures here point to missing route logic or incorrect business rules.
- Frontend command: `npm test --prefix octofit-tracker/frontend` — validates route rendering, API fetch behavior, loading/empty/error states, and accessible UI semantics. Failures here typically mean the UI is not translating API results into the expected user experience.
- Backend build command: `npm run build --prefix octofit-tracker/backend` — ensures TypeScript compiles cleanly and that route/service data contracts are consistent with the codebase.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` — ensures the React app bundles correctly and the API client usage remains compatible with the Vite setup.
