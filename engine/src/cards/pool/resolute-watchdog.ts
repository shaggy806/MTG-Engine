import { defineCard } from "../define.js";

export default defineCard({
  name: "Resolute Watchdog",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Dog"],
  power: 1,
  toughness: 3,
  keywords: ["defender"],
  text: "Defender\n{1}, Sacrifice this creature: Target creature you control gains indestructible until end of turn. (Damage and effects that say \"destroy\" don't destroy it.)",
  activated: [
    {
      cost: { mana: "{1}", tap: false, sacrifice: "self" },
      targets: ["creature-you-control"],
      effect: { kind: "grant-keyword", target: 0, keyword: "indestructible", duration: "end-of-turn" },
      resolve: null,
      text: "{1}, Sacrifice this creature: Target creature you control gains indestructible until end of turn.",
    },
  ],
});
