import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

const DAMAGE_TEXT = "Whenever equipped creature deals combat damage to a player or battle, create a Treasure token.";

// Battles aren't part of this engine, so only the player half can happen.
export default defineCard({
  name: "Beamtown Beatstick",
  manaCost: "{R}",
  colors: ["R"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text:
    "Equipped creature gets +1/+0 and has menace. (It can't be blocked except by two or more creatures.)\n" +
    `${DAMAGE_TEXT}\nEquip {2} ({2}: Attach to target creature you control. Equip only as a sorcery.)`,
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [1, 0],
      grantKeywords: ["menace"],
      text: "Equipped creature gets +1/+0 and has menace.",
    },
  ],
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "attached" },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: DAMAGE_TEXT,
    },
  ],
  activated: [equip("{2}")],
});
