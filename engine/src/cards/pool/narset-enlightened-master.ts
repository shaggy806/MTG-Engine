import { defineCard } from "../define.js";

// #486 in top-commanders.txt.
const TEXT =
  "Whenever Narset attacks, exile the top four cards of your library. Until end of turn, you may cast " +
  "noncreature spells from among those cards without paying their mana costs.";

export default defineCard({
  name: "Narset, Enlightened Master",
  manaCost: "{3}{U}{R}{W}",
  colors: ["U", "R", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Monk"],
  power: 3,
  toughness: 2,
  keywords: ["first-strike", "hexproof"],
  text: `First strike, hexproof\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "impulse-exile",
        amount: 4,
        duration: "end-of-turn",
        castOnly: true,
        filter: { notTypes: ["creature", "land"] },
        free: { only: true },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
