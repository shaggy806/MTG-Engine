import { defineCard } from "../define.js";

// A Shadowmoor filter land. The auto-payer funds its hybrid activation cost
// from another source, as it does a Signet's (AUTHORING, the converter note);
// activated by hand, its two mana float and the player picks {G}{G}, {G}{W} or {W}{W} there.
export default defineCard({
  name: "Wooded Bastion",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{G/W}, {T}: Add {G}{G}, {G}{W}, or {W}{W}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{G/W}", tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["G", "W"] }, amount: 2 },
      resolve: null,
      text: "{G/W}, {T}: Add {G}{G}, {G}{W}, or {W}{W}.",
    },
  ],
});
