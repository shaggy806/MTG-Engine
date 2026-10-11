import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

// EDHREC rank 6674. Goldvein Pick's trigger: once per combat damage step in
// which the equipped creature deals combat damage to a player.

const DAMAGE_TEXT = "Whenever equipped creature deals combat damage to a player, create a Treasure token.";

export default defineCard({
  name: "Prying Blade",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text:
    "Equipped creature gets +1/+0.\n" +
    `${DAMAGE_TEXT} (It's an artifact with "{T}, Sacrifice this token: Add one mana of any color.")\n` +
    "Equip {2} ({2}: Attach to target creature you control. Equip only as a sorcery.)",
  static: [{ affects: { scope: "attached" }, grantPt: [1, 0], text: "Equipped creature gets +1/+0." }],
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
