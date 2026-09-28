import { defineCard } from "../define.js";
import { equip, mobilize } from "../helpers.js";

// The granted mobilize's "its power" is the equipped creature's — the source
// of the ability it has — read as the trigger resolves.
const TEXT =
  "Equipped creature has menace and mobilize X, where X is its power. (Whenever it attacks, create X tapped and attacking 1/1 red Warrior creature tokens. Sacrifice them at the beginning of the next end step.)";

export default defineCard({
  name: "Infantry Shield",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${TEXT}\nEquip {2}`,
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["menace"],
      grantsTriggered: [mobilize({ powerOf: "source" })],
      text: TEXT,
    },
  ],
  activated: [equip("{2}")],
});
