import { defineCard } from "../define.js";

export default defineCard({
  name: "Ghalta, Stampede Tyrant",
  manaCost: "{5}{G}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elder", "Dinosaur"],
  power: 12,
  toughness: 12,
  keywords: ["trample"],
  text:
    "Trample\n" +
    "When Ghalta, Stampede Tyrant enters, put any number of creature cards from your hand onto the battlefield.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "hand",
        min: 0,
        // "Any number" — the choice is clamped to however many creature cards
        // are actually in hand (see `beginZoneChoice`), so a large ceiling is
        // the whole hand rather than a real limit.
        max: 99,
        destination: "battlefield",
        leftover: "stay",
        filter: { type: "creature" },
      },
      resolve: null,
      text: "When Ghalta, Stampede Tyrant enters, put any number of creature cards from your hand onto the battlefield.",
    },
  ],
});
