import { defineCard } from "../define.js";

// #142 in top-commanders.txt. The token attacks whoever its controller
// chooses (its ruling), and "that token" is the one this resolution created
// (`delayed-trigger`'s `about`). Paying the energy keeps it; declining, or
// having too little, sacrifices it. An illegal target stops the whole
// ability, energy included (its ruling; rule 608.2b).
const ATTACK_TEXT =
  "Whenever Satya attacks, create a tapped and attacking token that's a copy of up to one other target " +
  "nontoken creature you control. You get {E}{E} (two energy counters). At the beginning of the next end " +
  "step, sacrifice that token unless you pay an amount of {E} equal to its mana value.";
const END_TEXT = "At the beginning of the next end step, sacrifice that token unless you pay {E} equal to its mana value.";

export default defineCard({
  name: "Satya, Aetherflux Genius",
  manaCost: "{1}{U}{R}{W}",
  colors: ["U", "R", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Artificer"],
  power: 3,
  toughness: 5,
  keywords: ["menace", "haste"],
  text: `Menace, haste\n${ATTACK_TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [
        {
          kind: "optional",
          of: { kind: "other", of: { kind: "permanent", whose: "you", filter: { type: "creature", token: false } } },
        },
      ],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "create-token-copy", of: 0, count: 1, who: "you", tapped: true, attacking: "choose" },
          { kind: "get-energy", amount: 2 },
          {
            kind: "delayed-trigger",
            at: "next-end-step",
            about: "created",
            effect: {
              kind: "may",
              prompt: "Pay {E} equal to the token's mana value to keep it? (Otherwise it's sacrificed.)",
              costEnergy: { manaValueOf: 0 },
              effect: { kind: "sequence", effects: [] },
              else: { kind: "sacrifice-target", target: 0 },
            },
            text: END_TEXT,
          },
        ],
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
