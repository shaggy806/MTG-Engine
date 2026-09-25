import type { TriggeredAbility } from "../../abilities.js";
import { defineCard } from "../define.js";

const TRIGGER_TEXT =
  "Whenever this creature deals combat damage to a player or planeswalker, create that many Treasure tokens.";

/** "…to a player or planeswalker": one damage event has one recipient, so a
 * trigger per kind of recipient fires exactly once per hit, for that hit's
 * amount. */
const treasuresFor = (to: "player" | "planeswalker"): TriggeredAbility => ({
  trigger: { on: "deals-damage", who: "self", combat: true, to },
  targets: [],
  effect: { kind: "create-token", token: "Treasure Token", count: { triggerValue: true } },
  resolve: null,
  text: TRIGGER_TEXT,
});

export default defineCard({
  name: "The Reaver Cleaver",
  manaCost: "{2}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `Equipped creature gets +1/+1 and has trample and "${TRIGGER_TEXT}"\nEquip {3}`,
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [1, 1],
      grantKeywords: ["trample"],
      grantsTriggered: [treasuresFor("player"), treasuresFor("planeswalker")],
      text: `Equipped creature gets +1/+1 and has trample and "${TRIGGER_TEXT}"`,
    },
  ],
  activated: [
    {
      cost: { mana: "{3}", tap: false },
      targets: ["creature-you-control"],
      effect: { kind: "attach", target: 0 },
      resolve: null,
      sorcerySpeed: true,
      text: "Equip {3}",
    },
  ],
});
