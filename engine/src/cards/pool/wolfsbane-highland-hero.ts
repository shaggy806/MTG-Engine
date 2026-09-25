import { defineCard } from "../define.js";

export default defineCard({
  name: "Wolfsbane, Highland Hero",
  manaCost: "{1}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Mutant", "Werewolf", "Hero"],
  power: 2,
  toughness: 2,
  keywords: ["trample"],
  text: "Trample (This creature can deal excess combat damage to the player she's attacking.)\n{2}{G}: Wolfsbane gets +2/+2 until end of turn. Activate only once each turn.",
  activated: [
    {
      cost: { mana: "{2}{G}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "{2}{G}: Wolfsbane gets +2/+2 until end of turn. Activate only once each turn.",
      oncePerTurn: true,
    },
  ],
});
