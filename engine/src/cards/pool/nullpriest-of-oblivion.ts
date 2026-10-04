import { defineCard } from "../define.js";

// EDHREC rank 4789.
//
// Rulings:
//   [2024-11-08] If a card or token enters as a copy of a permanent, the new permanent isn't
//     kicked, even if the original was.
//   [2024-11-08] If you put a permanent with a kicker ability onto the battlefield without casting
//     it, you can't kick it.
//   [2024-11-08] If you copy a kicked spell on the stack, the copy is also kicked. If the copied
//     spell is a permanent spell, the token the copy of that spell becomes when it enters is also
//     kicked.

const KICKED_TEXT =
  "When this creature enters, if it was kicked, return target creature card from your graveyard to the battlefield.";

export default defineCard({
  name: "Nullpriest of Oblivion",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Cleric"],
  power: 2,
  toughness: 1,
  keywords: ["lifelink", "menace"],
  text: `Kicker {3}{B} (You may pay an additional {3}{B} as you cast this spell.)\nLifelink\nMenace (This creature can't be blocked except by two or more creatures.)\n${KICKED_TEXT}`,
  kicker: { cost: "{3}{B}" },
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      condition: { kind: "self-kicked" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
      effect: { kind: "put-onto-battlefield", target: 0 },
      resolve: null,
      text: KICKED_TEXT,
    },
  ],
});
