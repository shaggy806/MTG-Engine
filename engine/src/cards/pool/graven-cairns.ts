import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

export default defineCard({
  name: "Graven Cairns",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{B/R}, {T}: Add {B}{B}, {B}{R}, or {R}{R}.",
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      // "{B/R}, {T}" is "{B}, {T} or {R}, {T}" (ruling). A coloured activation
      // cost keeps it out of the auto-payer, so it's activated by hand, where
      // the two colours are chosen.
      cost: { mana: "{B/R}", tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["B", "R"] }, amount: 2 },
      resolve: null,
      text: "{B/R}, {T}: Add {B}{B}, {B}{R}, or {R}{R}.",
    },
  ],
});
