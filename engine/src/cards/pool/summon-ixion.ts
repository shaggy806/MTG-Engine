import { defineCard } from "../define.js";
import { distinctTargets } from "../helpers.js";

// EDHREC rank 3625.
//
// Rulings (abridged):
//   [2025-06-06] You don't have to choose any targets for Summon: Ixion's second or third chapter
//     ability. However, if you do and all of the targets are illegal when the ability tries to
//     resolve, it won't resolve and none of its effects will happen. You won't gain life.
//   [2025-06-06] If Summon: Ixion leaves the battlefield before its first chapter ability
//     resolves, the target permanent won't be exiled.
//   [2025-06-06] If a token is exiled this way, it will cease to exist and won't return to the
//     battlefield.
//   [2025-06-06] If an Aura is exiled this way, its owner chooses what it will enchant as it
//     returns to the battlefield.
//
// Summon: Titan's Saga-creature shape; chapter I is Banishing Light's O-Ring
// (`untilSourceLeaves` plus the linked leaves-the-battlefield return, rule
// 610.3b: nothing is exiled if the Saga has already left). Chapters II and
// III are Rishkar's "each of up to two target creatures": two optional slots,
// so choosing none still gains the life, and choosing some that are all
// illegal on resolution does nothing (rule 608.2b, the ruling).

const CHAPTER_I = "I — Aerospark — Exile target creature an opponent controls until this Saga leaves the battlefield.";
const CHAPTER_II_III = "II, III — Put a +1/+1 counter on each of up to two target creatures you control. You gain 2 life.";

export default defineCard({
  name: "Summon: Ixion",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["enchantment", "creature"],
  subtypes: ["Saga", "Unicorn"],
  power: 3,
  toughness: 3,
  keywords: ["first-strike"],
  text: `(As this Saga enters and after your draw step, add a lore counter. Sacrifice after III.)\n${CHAPTER_I}\n${CHAPTER_II_III}\nFirst strike`,
  chapters: [
    {
      at: [1],
      targets: ["creature-an-opponent-controls"],
      effect: { kind: "exile", target: 0, untilSourceLeaves: true },
      resolve: null,
      text: CHAPTER_I,
    },
    {
      at: [2, 3],
      targets: distinctTargets(2, "creature-you-control", { optional: true }),
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
          { kind: "add-counter", target: 1, counter: "+1/+1", amount: 1 },
          { kind: "gain-life", amount: 2 },
        ],
      },
      resolve: null,
      text: CHAPTER_II_III,
    },
  ],
  triggered: [
    {
      trigger: { on: "leaves-battlefield", who: "self" },
      targets: [],
      effect: { kind: "return-exiled-by-source" },
      resolve: null,
      text: "When this Saga leaves the battlefield, return the exiled card.",
    },
  ],
});
