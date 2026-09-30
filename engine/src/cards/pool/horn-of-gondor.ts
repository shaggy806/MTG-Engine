import { defineCard } from "../define.js";

const ENTER_TEXT = "When Horn of Gondor enters, create a 1/1 white Human Soldier creature token.";
const HORN_TEXT = "{3}, {T}: Create X 1/1 white Human Soldier creature tokens, where X is the number of Humans you control.";

export default defineCard({
  name: "Horn of Gondor",
  manaCost: "{3}",
  supertypes: ["legendary"],
  types: ["artifact"],
  text: `${ENTER_TEXT}\n${HORN_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Human Soldier Token", count: 1 },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{3}", tap: true },
      targets: [],
      effect: {
        kind: "create-token",
        token: "Human Soldier Token",
        count: { countOf: { type: "creature", subtype: "Human", controlledBy: "you" } },
      },
      resolve: null,
      text: HORN_TEXT,
    },
  ],
});
