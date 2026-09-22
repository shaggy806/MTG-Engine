import { defineCard } from "../define.js";

// Top-commanders rank 73. The upkeep token is an intervening-if (rule 603.4):
// checked when the trigger would fire and again as it resolves, against the
// `monarch` condition.
export default defineCard({
  name: "Queen Marchesa",
  manaCost: "{1}{R}{W}{B}",
  colors: ["R", "W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Assassin"],
  power: 3,
  toughness: 3,
  keywords: ["deathtouch", "haste"],
  text:
    "Deathtouch, haste\n" +
    "When Queen Marchesa enters, you become the monarch.\n" +
    "At the beginning of your upkeep, if an opponent is the monarch, create a 1/1 black Assassin creature token with deathtouch and haste.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "become-monarch" },
      resolve: null,
      text: "When Queen Marchesa enters, you become the monarch.",
    },
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      condition: { kind: "monarch", who: "opponent" },
      targets: [],
      effect: { kind: "create-token", token: "Assassin Token", count: 1 },
      resolve: null,
      text:
        "At the beginning of your upkeep, if an opponent is the monarch, create a 1/1 black " +
        "Assassin creature token with deathtouch and haste.",
    },
  ],
});
