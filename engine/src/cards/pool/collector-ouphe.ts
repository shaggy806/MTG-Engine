import { defineCard } from "../define.js";

// EDHREC rank 2452.
//
// Rulings:
//   [2019-06-14] If you control Collector Ouphe, you can't activate any abilities of your
//     artifacts, even if you'd sacrifice Collector Ouphe as a cost to activate one of those
//     abilities.
//   [2019-06-14] No abilities of artifacts can be activated, including mana abilities.
//   [2019-06-14] Collector Ouphe's ability affects only artifacts on the battlefield. Activated
//     abilities that work in other zones (such as cycling) can still be activated.
//   [2019-06-14] Activated abilities contain a colon. They're generally written "[Cost]:
//     [Effect]." Some keyword abilities (such as equip) are activated abilities and will have a
//     colon in their reminder text. Triggered abilities (starting with "when," "whenever," or
//     "at") are unaffected.
//
// Myrel's `prohibits` over every player: it bars activated abilities of
// battlefield permanents matching `abilitiesOf`, mana abilities included, and
// leaves a card's abilities in other zones alone (`abilitiesProhibited`).
const TEXT = "Activated abilities of artifacts can't be activated.";

export default defineCard({
  name: "Collector Ouphe",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Ouphe"],
  power: 2,
  toughness: 2,
  text: TEXT,
  static: [
    {
      affects: { scope: "self" },
      prohibits: { who: "each-player", abilitiesOf: { type: "artifact" } },
      text: TEXT,
    },
  ],
});
