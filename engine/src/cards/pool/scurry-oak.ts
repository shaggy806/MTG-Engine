import { defineCard } from "../define.js";
import { evolve } from "../helpers.js";

const SQUIRREL_TEXT = "Whenever one or more +1/+1 counters are put on this creature, you may create a 1/1 green Squirrel creature token.";

// Once per placement, however many counters it is.
export default defineCard({
  name: "Scurry Oak",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Treefolk"],
  power: 1,
  toughness: 2,
  text:
    "Evolve (Whenever a creature you control enters, if that creature has greater power or toughness than this creature, put a +1/+1 counter on this creature.)\n" +
    SQUIRREL_TEXT,
  triggered: [
    evolve(),
    {
      trigger: { on: "counters-put", who: "self", counter: "+1/+1" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Create a 1/1 Squirrel token?",
        effect: { kind: "create-token", token: "Squirrel Token", count: 1 },
      },
      resolve: null,
      text: SQUIRREL_TEXT,
    },
  ],
});
