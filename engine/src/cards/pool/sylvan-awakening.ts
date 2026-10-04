import { defineCard } from "../define.js";

// EDHREC rank 5227.
//
// Rulings:
//   [2018-04-27] Sylvan Awakening affects only lands you control at the time it resolves. Lands
//     you begin to control before your next turn won’t become creatures.
//   [2018-04-27] Sylvan Awakening doesn’t untap any of the lands that become creatures.
//   [2018-04-27] The lands affected by Sylvan Awakening stop being creatures as your next untap
//     step begins, before you untap your permanents. If this causes any state-based actions to
//     become applicable, or if any abilities trigger, those are handled during your upkeep.

export default defineCard({
  name: "Sylvan Awakening",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Until your next turn, all lands you control become 2/2 Elemental creatures with reach, indestructible, and haste. They're still lands.",
  // The lands are fixed as it resolves (`animate-all` — the first ruling),
  // and stop being creatures as your next turn begins (the third).
  effect: {
    kind: "animate-all",
    filter: { type: "land", controlledBy: "you" },
    power: 2,
    toughness: 2,
    addTypes: ["creature"],
    addSubtypes: ["Elemental"],
    keywords: ["reach", "indestructible", "haste"],
    duration: "until-your-next-turn",
  },
});
