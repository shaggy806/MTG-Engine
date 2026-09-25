import { defineCard } from "../define.js";

export default defineCard({
  name: "Junktown",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{4}{R}, {T}, Sacrifice this land: Create three Junk tokens. (They're artifacts with \"{T}, Sacrifice this token: Exile the top card of your library. You may play that card this turn. Activate only as a sorcery.\")",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{4}{R}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Junk Token", count: 3 },
      resolve: null,
      text: "{4}{R}, {T}, Sacrifice this land: Create three Junk tokens.",
    },
  ],
});
