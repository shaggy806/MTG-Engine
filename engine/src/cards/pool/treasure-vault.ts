import { defineCard } from "../define.js";

// {X}{X} is paid twice over: X Treasures for 2X mana.
export default defineCard({
  name: "Treasure Vault",
  colors: [],
  types: ["artifact", "land"],
  text: "{T}: Add {C}.\n{X}{X}, {T}, Sacrifice this land: Create X Treasure tokens.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{X}{X}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: "x" },
      resolve: null,
      text: "{X}{X}, {T}, Sacrifice this land: Create X Treasure tokens.",
    },
  ],
});
