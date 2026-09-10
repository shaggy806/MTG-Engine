import { defineCard } from "../define.js";

// needed-cards P5b — a token that's a copy of a permanent. The `create-token-copy`
// effect reads the triggering creature via `of: "trigger-object"` (threaded from
// `detectTriggers` like `triggerValue`), mints a token whose `copyOf` is that
// creature's name, grants haste, skips the legend rule (`notLegendary`), and
// flags it for exile at the next end step (`endStepActions` sweeps the flag).
export default defineCard({
  name: "Miirym, Sentinel Wyrm",
  manaCost: "{2}{G}{U}{R}",
  colors: ["G", "U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 3,
  toughness: 7,
  keywords: ["vigilance"],
  text:
    "Vigilance\n" +
    "Whenever another nontoken Dragon you control enters, create a token that's a copy of that creature, except it's not legendary. That token gains haste. Exile it at the beginning of the next end step.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        otherOnly: true,
        filter: { subtype: "Dragon", token: false },
      },
      targets: [],
      effect: {
        kind: "create-token-copy",
        of: "trigger-object",
        count: 1,
        gainsHaste: true,
        exileAtEndStep: true,
        notLegendary: true,
      },
      resolve: null,
      text:
        "Whenever another nontoken Dragon you control enters, create a token that's a copy of that creature, except it's not legendary. That token gains haste. Exile it at the beginning of the next end step.",
    },
  ],
});
