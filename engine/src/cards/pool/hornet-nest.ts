import { defineCard } from "../define.js";

export default defineCard({
  name: "Hornet Nest",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Insect"],
  power: 0,
  toughness: 2,
  keywords: ["defender"],
  text:
    "Defender\n" +
    "Whenever Hornet Nest is dealt damage, create that many 1/1 green Insect " +
    "creature tokens with flying and deathtouch.",
  triggered: [
    {
      trigger: { on: "dealt-damage", who: "self" },
      targets: [],
      effect: {
        kind: "create-token",
        token: "Insect Token (Flying, Deathtouch)",
        count: { triggerValue: true },
      },
      resolve: null,
      text:
        "Whenever Hornet Nest is dealt damage, create that many 1/1 green Insect " +
        "creature tokens with flying and deathtouch.",
    },
  ],
});
