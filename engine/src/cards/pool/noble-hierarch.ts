import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

export default defineCard({
  name: "Noble Hierarch",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Druid"],
  power: 0,
  toughness: 1,
  text:
    "Exalted (Whenever a creature you control attacks alone, that creature gets +1/+1 until end of turn.)\n" +
    "{T}: Add {G}, {W}, or {U}.",
  triggered: [
    {
      trigger: { on: "attacks-alone", who: "you-control" },
      targets: [],
      effect: { kind: "modify-pt", target: "trigger-object", power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "Exalted (Whenever a creature you control attacks alone, that creature gets +1/+1 until end of turn.)",
    },
  ],
  activated: (["G", "W", "U"] as const).map((c) => manaTapAbility(c)),
});
