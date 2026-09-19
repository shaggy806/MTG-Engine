import { defineCard } from "../define.js";

export default defineCard({
  name: "Kiki-Jiki, Mirror Breaker",
  manaCost: "{2}{R}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Goblin", "Shaman"],
  power: 2,
  toughness: 2,
  keywords: ["haste"],
  text:
    "Haste\n" +
    "{T}: Create a token that's a copy of target nonlegendary creature you control, " +
    "except it has haste. Sacrifice it at the beginning of the next end step.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["creature-you-control"],
      effect: {
        kind: "create-token-copy",
        of: 0,
        count: 1,
        gainsHaste: true,
        // Sacrificed, not exiled — a Kiki-Jiki token dying is the point of
        // half the combos built on him.
        sacrificeAtEndStep: true,
      },
      resolve: null,
      text:
        "{T}: Create a token that's a copy of target nonlegendary creature you control, " +
        "except it has haste. Sacrifice it at the beginning of the next end step.",
    },
  ],
});
