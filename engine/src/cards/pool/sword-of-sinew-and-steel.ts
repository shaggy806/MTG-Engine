import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

const DAMAGE_TEXT =
  "Whenever equipped creature deals combat damage to a player, destroy up to one target planeswalker and up to one target artifact.";

export default defineCard({
  name: "Sword of Sinew and Steel",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `Equipped creature gets +2/+2 and has protection from black and from red.\n${DAMAGE_TEXT}\nEquip {2}`,
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [2, 2],
      protection: { colors: ["B", "R"] },
      text: "Equipped creature gets +2/+2 and has protection from black and from red.",
    },
  ],
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "attached" },
      targets: [
        { kind: "optional", of: { kind: "permanent", filter: { type: "planeswalker" } } },
        { kind: "optional", of: "artifact" },
      ],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "destroy", target: 0 },
          { kind: "destroy", target: 1 },
        ],
      },
      resolve: null,
      text: DAMAGE_TEXT,
    },
  ],
  activated: [equip("{2}")],
});
