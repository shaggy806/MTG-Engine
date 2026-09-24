import { defineCard } from "../define.js";

// "You control but don't own" is `controlledBy: "you", ownedBy: "opponent"`
// (an owner other than you). The Pirate grant is layer 4, so the +2/+2 and
// the keywords reach exactly the creatures it made Pirates (rule 613.6).
export default defineCard({
  name: "Don Andres, the Renegade",
  manaCost: "{1}{U}{B}{R}",
  colors: ["U", "B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Vampire", "Pirate"],
  power: 4,
  toughness: 3,
  text:
    "Each creature you control but don't own gets +2/+2, has menace and deathtouch, and is a Pirate in addition to its other types.\n" +
    "Whenever you cast a noncreature spell you don't own, create two tapped Treasure tokens.",
  static: [
    {
      affects: {
        scope: "filter",
        filter: { type: "creature", controlledBy: "you", ownedBy: "opponent" },
      },
      addSubtypes: ["Pirate"],
      grantPt: [2, 2],
      grantKeywords: ["menace", "deathtouch"],
      text: "Each creature you control but don't own gets +2/+2, has menace and deathtouch, and is a Pirate in addition to its other types.",
    },
  ],
  triggered: [
    {
      trigger: {
        on: "cast-spell",
        who: "you",
        noncreatureOnly: true,
        filter: { ownedBy: "opponent" },
      },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 2, tapped: true },
      resolve: null,
      text: "Whenever you cast a noncreature spell you don't own, create two tapped Treasure tokens.",
    },
  ],
});
