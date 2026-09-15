import { defineCard } from "../define.js";

// "Activate only if you control five or more lands" — rule 602.5 counts the
// Temple itself among them.
export default defineCard({
  name: "Temple of the False God",
  types: ["land"],
  text: "{T}: Add {C}{C}. Activate only if you control five or more lands.",
  activated: [
    {
      cost: { mana: null, tap: true },
      condition: { kind: "controls", filter: { type: "land" }, atLeast: 5 },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 2 },
      resolve: null,
      text: "{T}: Add {C}{C}. Activate only if you control five or more lands.",
    },
  ],
});
