import { defineCard } from "../define.js";

const KINDS = ["Insect", "Rat", "Spider", "Squirrel"];
const PER_KIND = {
  product: [{ countOf: { type: "creature", controlledBy: "you", subtypes: KINDS } }, -1],
} as const;

// Counted once as it resolves, after the two Squirrels exist (rule 608.2h).
export default defineCard({
  name: "Swarmyard Massacre",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text:
    "Create two 1/1 green Squirrel creature tokens. Then each creature that isn't an Insect, Rat, Spider, or Squirrel gets -1/-1 until end of turn for each creature you control that's an Insect, Rat, Spider, or Squirrel.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "create-token", token: "Squirrel Token", count: 2 },
      {
        kind: "modify-pt-all",
        filter: { type: "creature", notSubtypes: KINDS },
        power: PER_KIND,
        toughness: PER_KIND,
        duration: "end-of-turn",
      },
    ],
  },
});
