import type { EffectSpec } from "../../effects.js";
import { defineCard } from "../define.js";

// #458 in top-commanders.txt.
//
// "Choose a number between 1 and 5" is a choice of one of five modes, made as
// the trigger resolves. Each mode flips that many coins one after another.
// "If you won five flips this way" is only possible with 5 chosen, so that
// mode's flips are a chain that remembers whether every flip so far was won
// (`winning`) and ends in the free-cast permission; a lost flip drops to the
// plain chain (`plain`).
const TEXT =
  "Whenever Yusri attacks, choose a number between 1 and 5. Flip that many coins. For each flip you " +
  "win, draw a card. For each flip you lose, Yusri deals 2 damage to you. If you won five flips this " +
  "way, you may cast spells from your hand this turn without paying their mana costs.";
const won: EffectSpec = { kind: "draw", amount: 1 };
const lost: EffectSpec = { kind: "damage", amount: 2, who: "you" };
const then = (first: EffectSpec, rest: EffectSpec | null): EffectSpec =>
  rest === null ? first : { kind: "sequence", effects: [first, rest] };
/** `n` more flips, nothing riding on them. */
const plain = (n: number): EffectSpec | null =>
  n === 0 ? null : { kind: "flip-coin", won: then(won, plain(n - 1)), lost: then(lost, plain(n - 1)) };
/** `n` more flips, every one so far having been won. */
const winning = (n: number): EffectSpec =>
  n === 0
    ? { kind: "player-effect", duration: "end-of-turn", castFromHandFree: {} }
    : { kind: "flip-coin", won: then(won, winning(n - 1)), lost: then(lost, plain(n - 1)) };

export default defineCard({
  name: "Yusri, Fortune's Flame",
  manaCost: "{1}{U}{R}",
  colors: ["U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Efreet"],
  power: 2,
  toughness: 3,
  keywords: ["flying"],
  text: `Flying\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "modal",
        minModes: 1,
        maxModes: 1,
        modes: [1, 2, 3, 4, 5].map((n) => ({
          text: `${n}`,
          effect: n === 5 ? winning(5) : (plain(n) as EffectSpec),
        })),
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
