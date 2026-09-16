import { defineCard } from "../define.js";

// The kicked half is an ETB trigger with an intervening-if on `self-kicked`
// rather than a `kicker.effect`: Verix is a permanent spell, so its rider
// resolves once the Dragon is already on the battlefield.
export default defineCard({
  name: "Verix Bladewing",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text:
    "Kicker {3}\n" +
    "Flying\n" +
    "When Verix Bladewing enters, if it was kicked, create Karox Bladewing, a " +
    "legendary 4/4 red Dragon creature token with flying.",
  kicker: { cost: "{3}" },
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      condition: { kind: "self-kicked" },
      targets: [],
      effect: { kind: "create-token", token: "Karox Bladewing", count: 1 },
      resolve: null,
      text:
        "When Verix Bladewing enters, if it was kicked, create Karox Bladewing, a " +
        "legendary 4/4 red Dragon creature token with flying.",
    },
  ],
});
