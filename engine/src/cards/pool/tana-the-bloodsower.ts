import { defineCard } from "../define.js";

export default defineCard({
  name: "Tana, the Bloodsower",
  manaCost: "{2}{R}{G}",
  colors: ["R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 2,
  toughness: 2,
  keywords: ["trample"],
  text:
    "Trample\n" +
    "Whenever Tana, the Bloodsower deals combat damage to a player, create that many 1/1 green " +
    "Saproling creature tokens.\n" +
    "Partner (You can have two commanders if both have partner.)",
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: {
        kind: "create-token",
        token: "Saproling Token",
        count: { triggerValue: true },
      },
      resolve: null,
      text:
        "Whenever Tana, the Bloodsower deals combat damage to a player, create that many 1/1 " +
        "green Saproling creature tokens.",
    },
  ],
});
