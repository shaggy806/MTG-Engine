import { defineCard } from "../define.js";

// EDHREC rank 6020.
// Makes Orc Army by amassing → the engine's "Army Token".

const UNBLOCKABLE_TEXT = "{2}{U}: Target Goblin, Orc, or Pirate can't be blocked this turn.";
const AMASS_TEXT = "Whenever this creature deals combat damage to a player, amass Orcs 3.";

export default defineCard({
  name: "Corsairs of Umbar",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Pirate"],
  power: 3,
  toughness: 3,
  text: `${UNBLOCKABLE_TEXT}\n${AMASS_TEXT} (Put three +1/+1 counters on an Army you control. It's also an Orc. If you don't control an Army, create a 0/0 black Orc Army creature token first.)`,
  activated: [
    {
      cost: { mana: "{2}{U}", tap: false },
      targets: [{ kind: "permanent", filter: { subtypes: ["Goblin", "Orc", "Pirate"] } }],
      effect: { kind: "grant-keyword", target: 0, keyword: "unblockable", duration: "end-of-turn" },
      resolve: null,
      text: UNBLOCKABLE_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: { kind: "amass", amount: 3, creatureType: "Orc" },
      resolve: null,
      text: AMASS_TEXT,
    },
  ],
});
