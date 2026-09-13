import { defineCard } from "../define.js";

const ENTERS_OR_ATTACKS_EFFECT = {
  kind: "look-and-choose",
  zone: "library",
  count: 8,
  min: 0,
  max: 1,
  destination: "battlefield",
  leftover: "bottom-random",
  filter: { type: "creature", subtype: "Dragon" },
} as const;

const TEXT =
  "Whenever Ureni enters or attacks, look at the top eight cards of your library. " +
  "You may put a Dragon creature card from among them onto the battlefield. " +
  "Put the rest on the bottom of your library in a random order.";

export default defineCard({
  name: "Ureni of the Unwritten",
  manaCost: "{4}{G}{U}{R}",
  colors: ["G", "U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Spirit", "Dragon"],
  power: 7,
  toughness: 7,
  keywords: ["flying", "trample"],
  text: `Flying, trample\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: ENTERS_OR_ATTACKS_EFFECT,
      resolve: null,
      text: TEXT,
    },
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: ENTERS_OR_ATTACKS_EFFECT,
      resolve: null,
      text: TEXT,
    },
  ],
});
