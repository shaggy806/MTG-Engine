import { defineCard } from "../define.js";

// The reduction takes only generic mana, and changes no Dragon spell's mana
// value (the rulings). Sarkhan copies the Dragon's copiable values as the
// ability resolves — what it is copying, if it's a copy; a token's as the
// effect that made it said — not its counters, its tapped state or any other
// effect on it (rule 707.2, the rulings), and keeps his own status and
// counters. Named Sarkhan, he and a legendary Dragon he copies have different
// names, so the legend rule leaves them both (the ruling). In the cleanup
// step he is Sarkhan again (rule 514.2).
const COST_TEXT = "Dragon spells you cast cost {1} less to cast.";
const COPY_TEXT =
  "Whenever a Dragon you control enters, you may have Sarkhan become a copy of it until end of turn, except its name is Sarkhan, Soul Aflame and it's legendary in addition to its other types.";

export default defineCard({
  name: "Sarkhan, Soul Aflame",
  manaCost: "{1}{U}{R}",
  colors: ["U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 2,
  toughness: 4,
  text: `${COST_TEXT}\n${COPY_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      costModification: {
        applies: { subtype: "Dragon", controlledBy: "you" },
        reduceGeneric: 1,
      },
      text: COST_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { subtype: "Dragon" } },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Have Sarkhan become a copy of that Dragon until end of turn?",
        effect: {
          kind: "become-copy",
          target: "source",
          of: "trigger-object",
          until: "end-of-turn",
          exceptions: { name: "Sarkhan, Soul Aflame", addSupertypes: ["legendary"] },
        },
      },
      resolve: null,
      text: COPY_TEXT,
    },
  ],
});
