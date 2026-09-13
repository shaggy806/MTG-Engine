import { defineCard } from "../define.js";

// needed-cards P5b — a token that's a copy of a permanent. The `create-token-copy`
// effect reads the triggering creature via `of: "trigger-object"` (threaded from
// `detectTriggers` like `triggerValue`), mints a token whose `copyOf` is that
// creature's name, and skips the legend rule (`notLegendary`) — a permanent,
// ordinary copy with no expiry (a prior pass here had incorrectly given it
// haste and an end-of-turn self-exile, neither of which the real card has).
export default defineCard({
  name: "Miirym, Sentinel Wyrm",
  manaCost: "{3}{G}{U}{R}",
  colors: ["G", "U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dragon", "Spirit"],
  power: 6,
  toughness: 6,
  keywords: ["flying"],
  text:
    "Flying, ward {2}\n" +
    "Whenever another nontoken Dragon you control enters, create a token that's a copy of it, except the token isn't legendary.",
  static: [
    {
      affects: { scope: "self" },
      ward: { mana: "{2}" },
      text: "Ward {2}",
    },
  ],
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
        notLegendary: true,
      },
      resolve: null,
      text:
        "Whenever another nontoken Dragon you control enters, create a token that's a copy of it, except the token isn't legendary.",
    },
  ],
});
