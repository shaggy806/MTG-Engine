import { defineCard } from "../define.js";

// EDHREC rank 6351.
//
// Rulings:
//   [2025-04-04] Activated abilities contain a colon. They’re generally written “[Cost]:
//     [Effect].” Some keywords are activated abilities and will have colons in their reminder
//     text.

const TEXT = "Activated abilities of artifacts, creatures, and planeswalkers can't be activated.";

export default defineCard({
  name: "Clarion Conqueror",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: `Flying\n${TEXT}`,
  static: [
    {
      // Collector Ouphe's `prohibits`, widened to three types (mana and
      // loyalty abilities included, as the card says).
      affects: { scope: "self" },
      prohibits: { who: "each-player", abilitiesOf: { typesAnyOf: ["artifact", "creature", "planeswalker"] } },
      text: TEXT,
    },
  ],
});
