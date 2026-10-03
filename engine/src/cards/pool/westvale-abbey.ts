import { defineCard } from "../define.js";

const CLERIC_TEXT = "{5}, {T}, Pay 1 life: Create a 1/1 white and black Human Cleric creature token.";
const TRANSFORM_TEXT = "{5}, {T}, Sacrifice five creatures: Transform this land, then untap it.";

// The five creatures are chosen as the cost is paid — a sacrifice of several
// — and may include this land if something has made it a creature. Rule
// 701.27f is built into `transform`: an ability of a permanent that has
// transformed since it went on the stack doesn't turn it over again. "Untap
// it" is the same permanent either way: transforming doesn't change zones.
export default defineCard({
  name: "Westvale Abbey",
  colors: [],
  types: ["land"],
  text: `{T}: Add {C}.\n${CLERIC_TEXT}\n${TRANSFORM_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{5}", tap: true, payLife: 1 },
      targets: [],
      effect: { kind: "create-token", token: "Human Cleric Token", count: 1 },
      resolve: null,
      text: CLERIC_TEXT,
    },
    {
      cost: { mana: "{5}", tap: true, sacrifice: { filter: { type: "creature" }, count: 5 } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "transform", target: "source" },
          { kind: "untap", target: "source" },
        ],
      },
      resolve: null,
      text: TRANSFORM_TEXT,
    },
  ],
  faces: ["Westvale Abbey", "Ormendahl, Profane Prince"],
  transform: true,
});
