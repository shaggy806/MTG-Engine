import { defineCard } from "../define.js";

const PROWESS_TEXT =
  "Prowess (Whenever you cast a noncreature spell, this creature gets +1/+1 until end of turn.)";
const LOOT_TEXT = "{T}: Draw a card, then discard a card.";
const COPY_TEXT =
  "{2}, {T}: Copy target instant or sorcery spell you control. You may choose new targets for the copy. " +
  "Activate only if Kitsa's power is 3 or greater.";

// The power check is a restriction on activating (rule 602.5), asked as
// it's activated: once on the stack, a change to Kitsa's power doesn't stop
// the copy (the ruling).
export default defineCard({
  name: "Kitsa, Otterball Elite",
  manaCost: "{1}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Otter", "Wizard"],
  power: 1,
  toughness: 3,
  keywords: ["vigilance"],
  text: `Vigilance\n${PROWESS_TEXT}\n${LOOT_TEXT}\n${COPY_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "discard", target: "you", amount: 1 },
        ],
      },
      resolve: null,
      text: LOOT_TEXT,
    },
    {
      cost: { mana: "{2}", tap: true },
      condition: { kind: "source", filter: { power: { op: "gte", n: 3 } } },
      targets: [{ kind: "spell", whose: "you", filter: { typesAnyOf: ["instant", "sorcery"] } }],
      effect: { kind: "copy-spell", target: 0, newTargets: true },
      resolve: null,
      text: COPY_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: PROWESS_TEXT,
    },
  ],
});
