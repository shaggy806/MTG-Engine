import { defineCard } from "../define.js";

const TEXT =
  "Flurry — Whenever you cast your second spell each turn, put a rally counter on this enchantment. Then create a 1/1 white Monk creature token with prowess for each rally counter on it. (Whenever you cast a noncreature spell, the token gets +1/+1 until end of turn.)";

export default defineCard({
  name: "Aligned Heart",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", nthEachTurn: 2 },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: "source", counter: "rally", amount: 1 },
          { kind: "create-token", token: "Monk Token", count: { countersOn: "source", counter: "rally" } },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
