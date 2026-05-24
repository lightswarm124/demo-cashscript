# ADevelop

This repository is a BCH CashScript protocol workspace.

Future Codex prompts should treat this repo as a place to:

- design CashScript contracts
- write transaction-shape specs
- build TypeScript transaction builders and offchain coordination code
- test contract validity and UTXO lifecycle behavior
- iterate on multiple contract suites for different use cases

## Core Context

- CashScript contracts validate transaction shapes; they do not hold mutable global state.
- Offchain systems such as full nodes, indexers, backend services, and oracle feeds are coordination tools only.
- Bots should be treated like very fast users: they discover UTXOs, build transactions, sign, broadcast, and rebuild on conflict.
- The main job of the contract is to protect funds and enforce the intended UTXO lifecycle.

## Design Source of Truth

- Use `docs/ai/CASHSCRIPT_DESIGN_GUIDE.md` as the primary design guide for contract structure, safety rules, lifecycle modeling, and review checklists.
- Prefer the newest CashScript 0.13+ style when writing new contracts.
- Preserve old code only as reference or archived context.

## Repository Layout

- `contracts/` is the active workspace for new contract suites.
- Each use case gets its own folder under `contracts/`.
- A single use-case folder may contain multiple contracts, shared helpers, interaction code, and tests.
- `contracts/shared/` is for reusable pieces that apply across multiple use cases.
- `docs/ai/` contains design and prompt context for future agent runs.
- `archived-cashscript-2026-05-24/` contains the older root-level contracts and scripts that are kept for reference only.

## Working Rules

When adding a new contract suite:

1. Pick the use-case folder first.
2. Keep all related contracts for that protocol together.
3. Put the TypeScript interaction code next to the contracts or in the same use-case folder.
4. Model the UTXO lifecycle before writing code.
5. Make fee handling, successor outputs, and protected token handling explicit.
6. Write tests for both valid and adversarial transaction shapes.

## Naming Guidance

- Name folders by use case, not by implementation detail.
- Use shared folders only for reusable primitives that truly span multiple use cases.
- Keep the repo organized so future prompts can locate the correct contract family quickly.

## Safety Reminder

Do not assume offchain coordination is consensus-critical.
Do not let optional outputs leak protected assets.
Do not lose BCH or CashTokens in contract design unless burning is intentional and explicit.
