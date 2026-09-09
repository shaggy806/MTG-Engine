import { defineCard } from "../define.js";

export default defineCard({
  name: "Scourge of Valkas",
  manaCost: "{2}{R}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text:
    "Flying\n" +
    "Whenever Scourge of Valkas or another Dragon you control enters, it deals " +
    "X damage to any target, where X is the number of Dragons you control.\n" +
    "{R}: Scourge of Valkas gets +1/+0 until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { subtype: "Dragon" } },
      targets: ["any-target"],
      effect: {
        kind: "damage",
        amount: { countOf: { subtype: "Dragon", controlledBy: "you" } },
        target: 0,
      },
      resolve: null,
      text:
        "Whenever Scourge of Valkas or another Dragon you control enters, it " +
        "deals X damage to any target, where X is the number of Dragons you control.",
    },
  ],
  activated: [
    {
      cost: { mana: "{R}", tap: false },
      targets: [],
      effect: {
        kind: "modify-pt",
        target: "source",
        power: 1,
        toughness: 0,
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{R}: Scourge of Valkas gets +1/+0 until end of turn.",
    },
  ],
});
