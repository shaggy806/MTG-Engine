import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

const TEXT = "Whenever Koma deals combat damage to a player, create four 3/3 blue Serpent creature tokens named Koma's Coil.";

export default defineCard({
  name: "Koma, World-Eater",
  manaCost: "{3}{G}{G}{U}{U}",
  colors: ["G", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Serpent"],
  power: 8,
  toughness: 12,
  keywords: ["trample"],
  cantBeCountered: true,
  text: `This spell can't be countered.\nTrample, ward {4}\n${TEXT}`,
  triggered: [
    ward({ mana: "{4}" }),
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Koma's Coil", count: 4 },
      resolve: null,
      text: TEXT,
    },
  ],
});
