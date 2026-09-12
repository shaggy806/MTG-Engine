import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

// needed-cards P15. New: Exalted — a new "attacks-alone" TriggerSpec (rule
// 702.111a) + EffectTargetRef "trigger-object" (the lone attacker, not a
// target and not the ability's own source).
export default defineCard({
  name: "Ignoble Hierarch",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Goblin", "Shaman"],
  power: 0,
  toughness: 1,
  text:
    "Exalted (Whenever a creature you control attacks alone, that creature gets +1/+1 until end of turn.)\n" +
    "{T}: Add {B}, {R}, or {G}.",
  triggered: [
    {
      trigger: { on: "attacks-alone", who: "you-control" },
      targets: [],
      effect: {
        kind: "modify-pt",
        target: "trigger-object",
        power: 1,
        toughness: 1,
        duration: "end-of-turn",
      },
      resolve: null,
      text: "Exalted (Whenever a creature you control attacks alone, that creature gets +1/+1 until end of turn.)",
    },
  ],
  activated: (["B", "R", "G"] as const).map((c) => manaTapAbility(c)),
});
