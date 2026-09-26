import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

const ATTACK_TEXT =
  "Whenever equipped creature attacks, look at the top card of your library. If it's a land card, you may put it onto the battlefield tapped.";

// A card left alone stays on top, where it was looked at.
export default defineCard({
  name: "Explorer's Scope",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${ATTACK_TEXT}\nEquip {1} ({1}: Attach to target creature you control. Equip only as a sorcery.)`,
  triggered: [
    {
      trigger: { on: "attacks", who: "attached" },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "library",
        count: 1,
        min: 0,
        max: 1,
        filter: { type: "land" },
        destination: "battlefield",
        enterTapped: true,
        leftover: "stay",
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
  activated: [equip("{1}")],
});
