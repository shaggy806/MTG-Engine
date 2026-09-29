import { defineCard } from "../define.js";

// #36 in top-commanders.txt. "That card" is the discarded card, copied as a
// card (its printed values), whether it's still in the graveyard or has left
// it since (rule 608.2h). "It's a 4/4 black Zombie" sets its colour and its
// creature types (rule 205.1a) — every other type and subtype stays.
const TEXT =
  "Whenever you discard a creature card, you may pay {2}{U}. If you do, create a tapped token that's a copy " +
  "of that card, except it's a 4/4 black Zombie.";

export default defineCard({
  name: "Hashaton, Scarab's Fist",
  manaCost: "{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Zombie", "Wizard"],
  power: 1,
  toughness: 3,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "discards", who: "you", filter: { type: "creature" }, perCard: true },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Pay {2}{U} to create a tapped 4/4 black Zombie token copy of the discarded card?",
        cost: "{2}{U}",
        effect: {
          kind: "create-token-copy",
          of: "trigger-object",
          count: 1,
          asCard: true,
          tapped: true,
          who: "you",
          exceptions: { setColors: ["B"], setSubtypes: ["Zombie"], basePt: [4, 4] },
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
