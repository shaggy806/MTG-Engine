import { defineCard } from "../define.js";
import { crew, crewText } from "../helpers.js";

// EDHREC rank 4590. "That many" is the combat damage it dealt; the Treasures
// come whether or not the sacrifice happens (it may already be gone).
const SINK = "When RMS Titanic deals combat damage to a player, sacrifice it and create that many Treasure tokens.";

export default defineCard({
  name: "RMS Titanic",
  manaCost: "{3}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["artifact"],
  subtypes: ["Vehicle"],
  power: 7,
  toughness: 1,
  keywords: ["flying", "trample"],
  text: `Flying, trample\n${SINK}\n${crewText(3)}`,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "sacrifice-source" },
          { kind: "create-token", token: "Treasure Token", count: { triggerValue: true } },
        ],
      },
      resolve: null,
      text: SINK,
    },
  ],
  activated: [crew(3, crewText(3))],
});
