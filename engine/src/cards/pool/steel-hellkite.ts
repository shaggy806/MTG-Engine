import { defineCard } from "../define.js";

export default defineCard({
  name: "Steel Hellkite",
  manaCost: "{6}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Dragon"],
  power: 5,
  toughness: 5,
  keywords: ["flying"],
  text:
    "Flying\n" +
    "{2}: This creature gets +1/+0 until end of turn.\n" +
    "{X}: Destroy each nonland permanent with mana value X whose controller was dealt combat damage by this creature this turn. Activate only once each turn.",
  activated: [
    {
      cost: { mana: "{2}", tap: false },
      targets: [],
      effect: {
        kind: "modify-pt",
        target: "source",
        power: 1,
        toughness: 0,
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{2}: This creature gets +1/+0 until end of turn.",
    },
    {
      cost: { mana: "{X}", tap: false },
      oncePerTurn: true,
      targets: [],
      // `n: "x"` reads the {X} this ability was activated for.
      effect: {
        kind: "destroy-all",
        filter: { notTypes: ["land"], manaValue: { op: "eq", n: "x" } },
        onlyControllersDamagedBySource: true,
      },
      resolve: null,
      text:
        "{X}: Destroy each nonland permanent with mana value X whose controller was dealt combat damage by this creature this turn. Activate only once each turn.",
    },
  ],
});
