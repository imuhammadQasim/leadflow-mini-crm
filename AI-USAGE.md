# AI Usage

I used Claude Code (Anthropic's agentic CLI) as my main tool for writing boilerplate and
repetitive code across all four parts, so I could spend my own time validating the logic,
testing the actual behavior, and making the decisions that mattered. Breakdown:

- **Boilerplate/scaffolding (AI-generated)**: project structure and setup for the API
  (`routes/controllers/models/middleware/validators/utils`), the Vite + React + Tailwind
  dashboard, and the Angular standalone project — the repetitive, well-established parts of
  standing up each stack. This is the kind of code that's fast to write correctly with AI and
  slow/error-prone to hand-type, so it was the highest-leverage place to use it.
- **Logic I drove and validated myself**: the Lead Score formula and the duplicate-prevention
  rule (the Logic Challenge) were built through several rounds of me pushing back on the
  weighting and reasoning until they made sense to me, not accepted as a first draft — e.g. I
  decided manually-created leads should get an admin-entered score instead of an
  auto-calculated one, while WordPress-submitted leads keep the backend-calculated score, and
  had that reasoning changed after questioning the first version.
- **Testing**: after each part was built, I had it run actual builds/lints/dev servers rather
  than just claim something worked - e.g. verifying the API boots and the Lead Score function
  produces sane scores, verifying the React app builds and lints clean, and verifying the
  Angular app builds and serves - so what's in this repo has been exercised, not just written.
- **WordPress/PHP**: I don't have a PHP background, so this part leaned on AI more heavily for
  the actual code (shortcode form, nonce/sanitization handling, custom DB table, admin
  screens, API sync logic). To make sure I can still own and explain it in the follow-up
  review, I had it explain the code back to me in plain English (nonces, sanitize vs. escape,
  why a custom table over a custom post type) and generate a separate `LEARNING-GUIDE.md` I
  used to actually learn what each file does.
- **Debugging**: real environment issues came up during the build - an `npm install` that left
  `node_modules` corrupted mid-install on Windows, and an ESLint rule flagging a standard React
  pattern - both were diagnosed from actual error output, not guessed at.
- **Documentation**: first drafts of the READMEs and this file, which I reviewed and edited.

Net split: AI wrote most of the repetitive/boilerplate code and first-draft docs; I reviewed
every part, asked follow-up questions until I understood the non-obvious pieces (especially
WordPress/PHP and the API's auth model), tested that things actually run, and made the final
call on every product/behavior decision (duplicate-window rule, how lead scoring works,
which creativity feature to build).
