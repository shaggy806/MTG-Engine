import { defineCard } from "../define.js";

// EDHREC commander rank 320. Two printed clauses, both existing vocabulary:
//
// - "Ward {2}" — a `"self"`-scoped `ward: { mana }` static, exactly Miirym,
//   Sentinel Wyrm's. The engine pays a ward it can afford rather than offering
//   the "decline and be countered" choice; that is how `ward` behaves for
//   every card in the pool that has it, not anything special here.
// - "If one or more tokens would be created under your control, twice that
//   many of those tokens are created instead." — Doubling Season's
//   `would-create-token` multiplier (rule 614). `tokenCreationMultiplier`
//   scopes it to permanents controlled by the *token's* controller, which is
//   what "under your control" means: a token an opponent's effect puts under
//   your control is doubled, and one of your own effects' tokens that lands
//   under someone else's control is not. Two such replacements multiply, so a
//   second doubler alongside this one quadruples (rule 616.1, order-
//   independent for multipliers).
//
// The 2021-06-18 ruling — "everything specified by the effect creating the
// original token will also be true about the additional tokens" — falls out of
// the multiplier being applied to the batch *count*: the whole batch is minted
// through one `mintTokenBatch` call carrying the same tapped/counters/copy
// state.
//
// Deliberately *not* a `would-add-counter` multiplier. Adrix and Nev doubles
// tokens only; Doubling Season is the card that does both.
const WARD_TEXT = "Ward {2}";
const DOUBLE_TEXT =
  "If one or more tokens would be created under your control, twice that many of those " +
  "tokens are created instead.";

export default defineCard({
  name: "Adrix and Nev, Twincasters",
  manaCost: "{2}{G}{U}",
  colors: ["G", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Merfolk", "Wizard"],
  power: 2,
  toughness: 2,
  text: `${WARD_TEXT}\n${DOUBLE_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      ward: { mana: "{2}" },
      text: WARD_TEXT,
    },
    {
      affects: { scope: "self" },
      replacement: { event: "would-create-token", multiplier: 2 },
      text: DOUBLE_TEXT,
    },
  ],
});
