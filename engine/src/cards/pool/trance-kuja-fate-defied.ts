import { defineCard } from "../define.js";

// The back face of Kuja, Genome Sorcerer.
const TEXT =
  "Flare Star — If a Wizard you control would deal damage to a permanent or player, it deals " +
  "double that damage instead.";

export default defineCard({
  name: "Trance Kuja, Fate Defied",
  art: "https://cards.scryfall.io/art_crop/back/0/0/008782d2-72b0-4554-b1ce-2db99969a4d8.jpg",
  colors: ["B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Avatar", "Wizard"],
  power: 4,
  toughness: 6,
  text: TEXT,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "would-deal-damage",
        multiplier: 2,
        source: { subtype: "Wizard", controlledBy: "you" },
      },
      text: TEXT,
    },
  ],
  faces: ["Kuja, Genome Sorcerer", "Trance Kuja, Fate Defied"],
  transform: true,
});
