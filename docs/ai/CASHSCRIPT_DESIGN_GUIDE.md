# CashScript Contract Design Guide for AI Coding Agents

This is a compact working guide for AI agents in this repo. Optimize for safe UTXO lifecycles, explicit transaction shapes, and successor outputs that the TypeScript builder can reproduce exactly. The goal is not just valid syntax.

## 0. Assumptions
- Use the repo-pinned CashScript/Cashc 0.13+ line, which supports the newer loop and SDK patterns we want to target.
- Use the TypeScript SDK with `TransactionBuilder`.
- Prefer P2S/P2SH32-era patterns when the wallet/indexer stack supports them.
- Do not rewrite production contracts to newer syntax until the contract compiles, tests, and the generated artifacts are reviewed.

## 1. Core Mental Model
CashScript answers one question: can this transaction spend this UTXO?

- It does not own mutable storage.
- It validates the spending transaction only.
- State moves by destroying one UTXO and creating successor UTXO(s).

```text
old UTXO consumed
    -> transaction validated
    -> successor output(s) created
    -> successor UTXO becomes next state
```

Use indexers only for discovery. If the contract depends on external state, include that state in the transaction as another input, a token or NFT commitment, a signed message, an OP_RETURN output, or a constructor-bound policy value.

## 2. Interaction Model
Treat users, bots, and backends as the same basic actor type: transaction authors that assemble, sign, and broadcast valid spends.

- Users and bots both discover candidate UTXOs, choose inputs, build transactions, sign, and broadcast.
- Bots are only faster and more automated; they do not get special protocol privileges.
- Full nodes validate and relay transactions.
- Indexers find candidate UTXOs, track protocol state, and help the app decide what can be spent.
- Oracles provide signed data or publish oracle-controlled UTXOs for consumers to validate.
- Backends manage address state, fee estimation, UTXO selection, tx building, rebroadcast, and conflict handling.

The safe offchain flow is:

```text
discover UTXO/state
    -> select inputs and expected successor shape
    -> build transaction
    -> sign
    -> simulate / debug if needed
    -> broadcast
    -> confirm or rebuild on conflict
```

All offchain systems are coordination tools only. None of them are consensus-critical. If the chain cannot verify it, the contract must not depend on it.

## 3. Versioning and Syntax
Every `.cash` file should start with an explicit pragma that matches the compiler line you are actually shipping with.

```cashscript
pragma cashscript ^0.13.0;
```

Keep the pragma aligned with the repo-pinned CashScript line. Newer syntax you should know:

- `for`, `while`, `do-while`
- `+=`, `-=`, `++`, `--`
- bitwise operators and shifts
- stricter function argument typing
- `tx.locktime` guard semantics
- P2S support in the SDK
- change-output and UTXO-gathering helpers

Safety rules that matter most:

- `&&` and `||` do not short-circuit, so split safety checks into separate `require` calls.
- Check byte length before `slice()`, `split()`, or unsafe casts.
- Treat function arguments as attacker-controlled.
- Prove denominators are nonzero before division or modulo.
- Token categories are returned in original byte order, not explorer order.
- NFT capabilities are `+0x01` for mutable, `+0x02` for minting, and `0x` for none.

## 4. Loop and Bounds Rules
Prefer clear bounded loops over clever scripts.

- Use `for` for fixed ranges and array validation.
- Use `while` only when exit depends on runtime data.
- Avoid `do-while` unless one iteration is mandatory and safe.
- Always cap transaction size with product-level limits.

```cashscript
require(tx.inputs.length >= 3);
require(tx.inputs.length <= 12);

for (int i = 2; i < tx.inputs.length; i++) {
    require(tx.inputs[i].value > 0);
}
```

Typical limits should be explicit in the contract or the builder, such as maximum outputs, maximum recipients, maximum oracle samples, or maximum optional tail items.

## 5. Choose the Right State Location
- Constructor args: immutable policy, such as admin key, reserve ratio, oracle key, protocol id.
- Mutable NFT commitment: compact evolving state, such as sequence, price, flags, version, allowance, or policy state.
- Immutable receipt NFT commitment: individualized claims, tickets, deposits, withdrawals, and redemption rights.
- Fungible token amount: supply and accounting quantities, such as shares or balances.
- BCH value: native collateral or reserve value.
- Signed message: hot-path external data, such as prices or attestations.
- Offchain indexer: discovery and UI only, never consensus-critical enforcement.

## 6. Classify the Lifecycle
- Exactly self-replicating: same bytecode, token category, commitment, amount, and value.
- State-mutating: same identity and value, new commitment.
- State-and-balance-mutating: contract identity stays, but balances change.
- Terminal: burn, redeem, settle, or close the position.

Pick the lifecycle before writing the contract. It determines where state lives, which output is the successor, and what must be preserved or burned.

## 7. Design the Transaction Shape First
Write the transaction shape before writing the contract.

```text
Function: <name>

Inputs:
  0: <state UTXO>
  1: <authority/user/oracle/fee UTXO>
  2..N: <variable tail>

Outputs:
  0: <successor state UTXO>
  1: <payout/change/receipt>
  2..N: <settlement or mirrored outputs>

Required invariants:
  - successor output index is fixed
  - successor locking bytecode matches the expected contract
  - successor token category or capability is preserved
  - successor commitment is computed, not trusted
  - fee leak is bounded
  - optional outputs cannot carry protected tokens
```

Fixed indexes are fine, but they must be enforced explicitly.

## 8. Successor and Fee Safety
Every stateful covenant should answer these questions:

- Which output is the successor?
- What locking bytecode must it use?
- What BCH value must it carry?
- What token category or capability must it preserve?
- What commitment must it contain?
- What token amount, if any, must it preserve?

Fee safety basics:

- BCH fee is `sum(inputs) - sum(outputs)`.
- Bound the maximum fee leak explicitly.
- For variable-sized transactions, compute value preservation across the full bounded shape.
- Do not let optional outputs absorb protocol value by accident.

```cashscript
int maxFee = 1000;
require(tx.outputs[0].value >= tx.inputs[0].value - maxFee);
```

## 9. Optional Outputs, Burns, and Authority
Optional outputs are a common source of authority leaks.

- Reject protected token categories from all optional outputs.
- Use `LockingBytecodeNullData` for explicit burns or metadata outputs.
- Never send BCH to NullData unless burning is intentional.
- Burn or destroy authority NFTs on terminal paths when the protocol requires it.

```cashscript
for (int i = 1; i < tx.outputs.length; i++) {
    require(tx.outputs[i].tokenCategory != stateCategory + 0x01);
    require(tx.outputs[i].tokenCategory != stateCategory + 0x02);
}
```

## 10. Time, Locktime, and Oracles
- `tx.time` is the consensus-enforced absolute time check.
- `this.age` is the UTXO-relative lock.
- If you use `tx.locktime`, keep the lock semantics explicit instead of relying on compiler magic.
- Do not make high-frequency users spend the same oracle UTXO.

Oracle guidance:

- Prefer signed reports for hot paths.
- Prefer certificate NFTs when many users consume a one-shot report.
- Prefer threaded replicas or batch settlement when a single oracle state would be too contended.
- Always verify category or asset match, message length, sequence monotonicity, freshness, positive prices, and signer or quorum.

## 11. Modular Patterns
Receipt NFTs:

- Issue an immutable receipt NFT when a user deposits or reserves value.
- Put claim-critical data in the commitment, not in dust.
- Include protocol id, position or campaign id, amount, expiry, and a nonce if needed.

Function NFTs:

- Use them for loan actions, liquidations, pool operations, migrations, and admin paths.
- Every function path must preserve or explicitly burn top-level authority.
- Every function path must cap output count and protect all outputs.

Sidecar UTXOs:

- Use a sidecar when one contract needs separate identity, data, or token inventory.
- Authenticate the sidecar with token category, commitment, bytecode, constructor hash, or explicit linkage.
- Document how the sidecar is recreated or burned.

## 12. Bitwise Flags
Use bitwise flags for compact commitment state.

```cashscript
require(state.length >= 1);
byte flags = unsafe_bytes1(state.slice(0, 1));

require((flags & 0x01) == 0x);   // not paused
require((flags & 0x02) == 0x02);  // withdrawals enabled
```

Document the bit layout in the contract header so the builder and tests share the same meaning.

## 13. Testing and Debugging
Every contract needs both positive and adversarial tests.

Positive tests:

- valid state update
- valid terminal path
- valid signature path
- valid oracle or report path
- valid receipt claim or refund

Negative tests:

- wrong token category or capability
- wrong commitment length
- wrong output index
- missing successor
- duplicate authority output
- protected token in optional output
- excessive fee drain
- stale oracle message
- malformed or zero price
- wrong signer
- wrong locktime or sequence
- out-of-bounds variable tail cases

Concurrency tests:

- stale UTXO conflict
- rebuild against a new tip
- unconfirmed successor behavior
- reorg or dropped transaction behavior if the app supports it

Tooling:

- `MockNetworkProvider` for deterministic unit tests
- chipnet or integration tests for wallet, indexer, and broadcast behavior
- `transaction.debug()` for local evaluation
- byte size, opcount, and resource-usage checks for loop-heavy contracts

When a spend fails, classify the bug first:

- builder bug: the transaction shape does not match the contract
- contract bug: the valid transaction is being rejected

## 14. SDK Usage
Prefer the current `TransactionBuilder`.

```ts
const tx = await new TransactionBuilder({ provider })
  .addInput(stateUtxo, contract.unlock.update(...args))
  .addInput(userUtxo, userTemplate.unlockP2PKH())
  .addOutput({ to: contract.tokenAddress, amount, token })
  .addBchChangeOutputIfNeeded(userAddress)
  .send();
```

Rules:

- Do not use deprecated `contract.functions` style for new code.
- Compile `.cash` to artifacts and import the artifacts into TypeScript.
- Use `SignatureTemplate` for transaction signatures.
- Use `signMessageHash()` or data signatures only when the design explicitly needs signed-message flows.
- Use token-aware addresses when sending CashTokens to contracts.
- Set explicit fee limits in production paths.

## 15. Contract Header Template
Every nontrivial contract should start with a compact header like this:

```cashscript
pragma cashscript ^0.13.0;

/*
Contract: <Name>
Lifecycle: exactly-self-replicating | state-mutating | state-and-balance-mutating | terminal

Purpose:
  <What this contract enforces>

State:
  Constructor args:
    - <arg>: <meaning>
  Commitment schema:
    - bytes[0..N]: <field>
  BCH value:
    - <meaning>
  Token amount:
    - <meaning>

Authorities:
  - <signature / token / function NFT / oracle key / receipt NFT>

Transaction shape:
  Inputs:
    0: <...>
  Outputs:
    0: <...>

Critical invariants:
  - successor preservation
  - fee bound
  - no protected token in optional outputs
  - terminal authority burn
*/
```

## 16. Review Checklist for AI Agents
Before modifying or creating a contract, answer these questions:

1. What UTXO is consumed?
2. What UTXO, if any, is the successor?
3. Which output index holds the successor?
4. What token category or capability must be preserved?
5. What commitment schema is used?
6. Which values are derived from transaction deltas instead of user arguments?
7. What is the maximum fee leak?
8. Which outputs are optional?
9. How are protected tokens blocked from optional outputs?
10. What happens to authority NFTs on terminal paths?
11. Does the design create shared UTXO contention?
12. Are all loops bounded by product-level limits?
13. Are all length-sensitive operations preceded by length checks?
14. Are all denominators proven nonzero?
15. Are `tx.time`, `tx.locktime`, and `this.age` used with the right semantics?
16. Are all tests covering both valid and adversarial transaction shapes?
17. Does the TypeScript builder exactly match the documented input/output layout?

## 17. Recommended Development Flow
1. Write the transaction-shape spec first.
2. Write the commitment schema.
3. Define the lifecycle class.
4. Define all authorities.
5. Write the `.cash` contract.
6. Compile the artifact.
7. Write the TypeScript transaction builder.
8. Add positive tests.
9. Add adversarial tests.
10. Run debug evaluation.
11. Check byte size, opcount, and resource usage.
12. Run chipnet or integration tests if external wallet or indexer behavior matters.
13. Document known scalability limits and UTXO contention surfaces.

## 18. Design Rule of Thumb
Use the right topology:

- Canonical low-frequency state: mutable NFT state UTXO.
- Many users with individualized claims: receipt NFTs.
- High-frequency external data: signed reports or certificate NFTs.
- Public shared state with moderate concurrency: threaded UTXOs.
- Many actions settled together: batch transaction with loop validation.
- Normal DEX swaps: pool invariant plus user slippage; avoid a global shared oracle UTXO when possible.

Design the UTXO topology first. Then write CashScript to enforce it.

## 19. Worked Example: CDP-Style Stablecoin Flow
Use this as the mental model for a BCH-backed CDP stablecoin.

### Actors and roles

| Actor | Role |
| --- | --- |
| Borrower | Opens or updates a collateralized loan position. |
| Redeemer | Spends stablecoins to redeem BCH under the protocol rules. |
| Staker / stability pool depositor | Deposits stablecoins to absorb liquidation risk and earn yield or fees. |
| Keeper bot | Watches the chain, oracle, and DEX, then submits protocol-valid transactions. |
| Backend / indexer | Tracks live positions, UTXOs, oracle data, and candidate actions. |

### High-level UTXO lifecycle

- Borrow: borrower selects collateral UTXO(s), backend/indexer reads oracle data, borrower or bot builds and signs, the contract validates position rules, and a new position UTXO is created with minted stablecoins in the expected output(s).
- Redeem: redeemer selects stablecoin UTXO(s), backend finds the redemption path, the tx is built with the expected successor and payout shape, the contract validates, and collateral is paid out while the redeemed stablecoin is consumed.
- Stability pool: staker deposits stablecoins, the contract creates or updates the staker UTXO, and later fee or liquidation events update the successor UTXO or pay out rewards.
- Keeper / bot: the indexer detects an unsafe position, the keeper computes the eligible action from oracle data and protocol rules, builds the liquidation or rescue transaction, signs and broadcasts it, and rebuilds against the new UTXO set if a conflict occurs first.

### What matters at the contract level
- The contract must identify the live position UTXO and the output that becomes the successor.
- The contract must preserve or intentionally burn the right token categories and authority NFTs.
- The contract must bound fees and prevent protected assets from leaking into optional outputs.
- The contract must derive critical values from transaction shape, token state, or signed oracle data, not from blind trust in offchain coordination.
- The app layer handles discovery, rebroadcast, and conflict resolution; the contract handles validity.

## Reference Appendix
These links are provided for additional research context, not as normative rules.

- CashScript Bliss Workshop 2026 repo, including the post-Layla `for` loop / Cauldron oracle case study and the warning that the example oracle is not production-safe as-is.
- CashStarter repo, which shows a BCH crowdfunding flow with manager, campaign, refund, stop, cancel, and claim paths.
- ParyonUSD contracts repo, which provides a larger production-style CashScript protocol set.
- CashScript `next` docs, including the contract syntax and loop documentation.

Links:

- [CashScript/bliss-workshop-2026](https://github.com/CashScript/bliss-workshop-2026)
- [SayoshiNakamario/CashStarter](https://github.com/SayoshiNakamario/CashStarter)
- [ParyonUSD/contracts](https://github.com/ParyonUSD/contracts)
- [CashScript next contract docs](https://next.cashscript.org/docs/language/contracts#do-while-loop)
