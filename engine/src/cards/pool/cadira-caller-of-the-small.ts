import { defineCard } from "../define.js";

// EDHREC rank 3890.
// Makes Rabbit → "Rabbit Token".

export default defineCard({
  name: "Cadira, Caller of the Small",
  manaCost: "{1}{G}{W}",
  colors: ["W", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Orc", "Ranger"],
  power: 3,
  toughness: 3,
  keywords: ["trample"],
  text: "Trample\nWhenever Cadira deals combat damage to a player, for each token you control, create a 1/1 white Rabbit creature token.",
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      // Counted as it resolves: every token you control, of any type.
      effect: { kind: "create-token", token: "Rabbit Token", count: { countOf: { token: true, controlledBy: "you" } } },
      resolve: null,
      text: "Whenever Cadira deals combat damage to a player, for each token you control, create a 1/1 white Rabbit creature token.",
    },
  ],
});
