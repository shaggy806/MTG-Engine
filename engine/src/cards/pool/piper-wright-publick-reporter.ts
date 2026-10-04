import { defineCard } from "../define.js";

// EDHREC rank 6333.
// Makes Clue tokens → "Clue Token".
//
// Rulings:
//   [2024-03-08] If an effect refers to a Clue, it means any Clue artifact, not just a Clue
//     artifact token. For example, if you sacrifice a nontoken Clue artifact, such as Candy Trail
//     from the Wilds of Eldraine set, Piper Wright's last ability will trigger.
//   [2024-03-08] Piper Wright's last ability triggers whenever you sacrifice a Clue for any
//     reason, not just to activate a Clue's activated ability.

export default defineCard({
  name: "Piper Wright, Publick Reporter",
  manaCost: "{1}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Detective"],
  power: 1,
  toughness: 2,
  text: "Whenever Piper Wright deals combat damage to a player, investigate that many times. (To investigate, create a Clue token. It's an artifact with \"{2}, Sacrifice this token: Draw a card.\")\nWhenever you sacrifice a Clue, put a +1/+1 counter on target creature you control.",
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Clue Token", count: { triggerValue: true } },
      resolve: null,
      text: "Whenever Piper Wright deals combat damage to a player, investigate that many times.",
    },
    {
      trigger: { on: "sacrifice", who: "you", filter: { subtype: "Clue" } },
      targets: ["creature-you-control"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever you sacrifice a Clue, put a +1/+1 counter on target creature you control.",
    },
  ],
});
