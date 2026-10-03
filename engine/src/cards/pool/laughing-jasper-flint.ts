import { defineCard } from "../define.js";

// #399 in top-commanders.txt.
//
// Outlaws are the five creature types the reminder text names, counted among
// permanents you control (the rulings: "outlaws you control" are permanents
// only) as the upkeep trigger resolves. Mercenary is granted to creatures you
// control but don't own as they enter, so a stolen creature arriving is
// already an outlaw (the ruling). The exiled cards are cast for their own
// costs ("cast spells", so no lands), at normal timing, and mana of any type
// pays for them — only when cast this way (rule 118.14).
const OUTLAWS = ["Assassin", "Mercenary", "Pirate", "Rogue", "Warlock"];
const MERCENARY_TEXT = "Creatures you control but don't own are Mercenaries in addition to their other types.";
const UPKEEP_TEXT =
  "At the beginning of your upkeep, exile the top X cards of target opponent's library, where X is the number of outlaws you control. Until end of turn, you may cast spells from among those cards, and mana of any type can be spent to cast those spells.";

export default defineCard({
  name: "Laughing Jasper Flint",
  manaCost: "{1}{B}{R}",
  colors: ["B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Lizard", "Rogue"],
  power: 4,
  toughness: 3,
  text: `${MERCENARY_TEXT}\n${UPKEEP_TEXT}`,
  static: [
    {
      affects: {
        scope: "filter",
        filter: { type: "creature", controlledBy: "you", ownedBy: "opponent" },
      },
      addSubtypes: ["Mercenary"],
      text: MERCENARY_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: ["opponent"],
      effect: {
        kind: "impulse-exile",
        amount: { countOf: { controlledBy: "you", subtypes: OUTLAWS } },
        whose: 0,
        duration: "end-of-turn",
        castOnly: true,
        spendAs: "any-type",
      },
      resolve: null,
      text: UPKEEP_TEXT,
    },
  ],
});
