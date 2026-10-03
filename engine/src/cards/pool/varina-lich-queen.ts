import { defineCard } from "../define.js";

// #205 in top-commanders.txt. Batched: once per declaration, with how many
// Zombies attacked as "that many" — counted as they're declared, so one that
// leaves combat before this resolves still counts, and the discard and the
// life gain are that number whatever the draw managed (its rulings). The two
// cards the token costs are picked as the ability goes on the stack.
const ATTACK_TEXT =
  "Whenever you attack with one or more Zombies, draw that many cards, then discard that many cards. You gain that much life.";
const TOKEN_TEXT = "{2}, Exile two cards from your graveyard: Create a tapped 2/2 black Zombie creature token.";

export default defineCard({
  name: "Varina, Lich Queen",
  manaCost: "{1}{W}{U}{B}",
  colors: ["W", "U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Zombie", "Wizard"],
  power: 4,
  toughness: 4,
  text: `${ATTACK_TEXT}\n${TOKEN_TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks-batch", who: "you", filter: { subtype: "Zombie" } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: { triggerValue: true } },
          { kind: "discard", target: "you", amount: { triggerValue: true } },
          { kind: "gain-life", amount: { triggerValue: true } },
        ],
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{2}", tap: false, exileFromGraveyard: { count: 2 } },
      targets: [],
      effect: { kind: "create-token", token: "Zombie Token", count: 1, tapped: true },
      resolve: null,
      text: TOKEN_TEXT,
    },
  ],
});
