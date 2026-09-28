import { defineCard } from "../define.js";
import { myriad } from "../helpers.js";

const MYRIAD_TEXT =
  "Myriad (Whenever this creature attacks, for each opponent other than defending player, you may create a token copy that's tapped and attacking that player or a planeswalker they control. Exile the tokens at end of combat.)";
const DAMAGE_TEXT = "Whenever this creature deals combat damage to a player, create a Treasure token.";

export default defineCard({
  name: "Goldlust Triad",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 4,
  toughness: 3,
  keywords: ["flying"],
  text: `Flying\n${MYRIAD_TEXT}\n${DAMAGE_TEXT}`,
  triggered: [
    myriad(),
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: DAMAGE_TEXT,
    },
  ],
});
