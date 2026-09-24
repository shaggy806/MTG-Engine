import { defineCard } from "../define.js";

// Outlaws are the five creature types the reminder text lists. A Treasure
// animated by the combat trigger is an Assassin, so it's an outlaw and has
// haste — it can attack the turn it was made.
const OUTLAWS = ["Assassin", "Mercenary", "Pirate", "Rogue", "Warlock"];

export default defineCard({
  name: "Vihaan, Goldwaker",
  manaCost: "{R}{W}{B}",
  colors: ["R", "W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dwarf", "Warlock"],
  power: 3,
  toughness: 3,
  text:
    "Other outlaws you control have vigilance and haste. (Assassins, Mercenaries, Pirates, Rogues, and Warlocks are outlaws.)\n" +
    "At the beginning of combat on your turn, you may have Treasures you control become 3/3 Construct Assassin artifact creatures in addition to their other types until end of turn.",
  static: [
    {
      affects: {
        scope: "filter",
        filter: { controlledBy: "you", subtypes: OUTLAWS },
        excludeSelf: true,
      },
      grantKeywords: ["vigilance", "haste"],
      text: "Other outlaws you control have vigilance and haste.",
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Have your Treasures become 3/3 Construct Assassin artifact creatures?",
        effect: {
          kind: "animate-all",
          filter: { subtype: "Treasure", controlledBy: "you" },
          power: 3,
          toughness: 3,
          addTypes: ["artifact", "creature"],
          addSubtypes: ["Construct", "Assassin"],
          duration: "end-of-turn",
        },
      },
      resolve: null,
      text: "At the beginning of combat on your turn, you may have Treasures you control become 3/3 Construct Assassin artifact creatures in addition to their other types until end of turn.",
    },
  ],
});
