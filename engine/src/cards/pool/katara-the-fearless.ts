import { defineCard } from "../define.js";

// #260 in top-commanders.txt.
const TEXT = "If a triggered ability of an Ally you control triggers, that ability triggers an additional time.";

export default defineCard({
  name: "Katara, the Fearless",
  manaCost: "{G}{W}{U}",
  colors: ["G", "W", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warrior", "Ally"],
  power: 3,
  toughness: 3,
  text: TEXT,
  static: [
    {
      affects: { scope: "self" },
      doubleTriggersOf: { filter: { subtype: "Ally", controlledBy: "you" } },
      text: TEXT,
    },
  ],
});
