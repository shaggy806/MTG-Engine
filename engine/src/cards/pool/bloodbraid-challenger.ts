import { defineCard } from "../define.js";

// EDHREC rank 6721. Bloodbraid Elf's cascade (a `this-cast` trigger, so it
// cascades however it's cast — from the graveyard by escape too: rule
// 702.85a, "when you cast this spell") and Underworld Rage-Hound's escape
// (rule 702.139a — the three other cards are the caster's to choose, as the
// cost is paid). A permanent spell that escaped stays on the battlefield and
// goes back to the graveyard if it dies, free to escape again (its ruling).
//
// Rulings (selected):
//   Cascade triggers when you cast the spell, meaning that it resolves before that spell. If you
//     end up casting the exiled card, it will go on the stack above the spell with cascade.
//   If you cast a spell with its escape permission, you can't choose to apply any other
//     alternative costs or to cast it without paying its mana cost.

export default defineCard({
  name: "Bloodbraid Challenger",
  manaCost: "{3}{R}{G}",
  colors: ["G", "R"],
  types: ["creature"],
  subtypes: ["Elf", "Berserker"],
  power: 4,
  toughness: 3,
  keywords: ["haste"],
  text:
    "Cascade\n" +
    "Haste\n" +
    "Escape—{3}{R}{G}, Exile three other cards from your graveyard. (You may cast this card from your graveyard for its escape cost.)",
  escape: { cost: "{3}{R}{G}", exileCount: 3 },
  triggered: [
    {
      trigger: { on: "this-cast" },
      targets: [],
      effect: { kind: "cascade" },
      resolve: null,
      text: "Cascade.",
    },
  ],
});
