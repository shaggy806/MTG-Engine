import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

const DAMAGE_TEXT =
  "Whenever equipped creature deals combat damage to a player, that player loses half their life, rounded up.";

// Half of their life as the ability resolves, after the combat damage —
// so two Spikes take half, then half of what's left (the rulings).
export default defineCard({
  name: "Quietus Spike",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `Equipped creature has deathtouch.\n${DAMAGE_TEXT}\nEquip {3}`,
  static: [{ affects: { scope: "attached" }, grantKeywords: ["deathtouch"], text: "Equipped creature has deathtouch." }],
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "attached" },
      targets: [],
      effect: {
        kind: "lose-life",
        who: "trigger-player",
        amount: { half: { lifeTotal: "each" }, round: "up" },
      },
      resolve: null,
      text: DAMAGE_TEXT,
    },
  ],
  activated: [equip("{3}")],
});
