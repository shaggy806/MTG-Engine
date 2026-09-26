import { defineCard } from "../define.js";

// A Shadowmoor filter land, as Fetid Heath: its hybrid activation cost keeps
// the second ability out of the auto-payer, so it's activated by hand and its
// two mana float; the player picks {W}{W}, {W}{U} or {U}{U} there.
export default defineCard({
  name: "Mystic Gate",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{W/U}, {T}: Add {W}{W}, {W}{U}, or {U}{U}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{W/U}", tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["W", "U"] }, amount: 2 },
      resolve: null,
      text: "{W/U}, {T}: Add {W}{W}, {W}{U}, or {U}{U}.",
    },
  ],
});
