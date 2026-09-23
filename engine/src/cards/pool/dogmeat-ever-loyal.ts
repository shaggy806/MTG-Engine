import { defineCard } from "../define.js";

export default defineCard({
  name: "Dogmeat, Ever Loyal",
  manaCost: "{R}{G}{W}",
  colors: ["R", "G", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dog"],
  power: 3,
  toughness: 3,
  text:
    "When Dogmeat enters, mill five cards, then return an Aura or Equipment card from your " +
    "graveyard to your hand.\n" +
    "Whenever a creature you control that's enchanted or equipped attacks, create a Junk token. " +
    '(It\'s an artifact with "{T}, Sacrifice this token: Exile the top card of your library. You ' +
    'may play that card this turn. Activate only as a sorcery.")',
  triggered: [
    {
      // The returned card needn't be one of the five just milled (2024-03-08
      // ruling): the return looks at the whole graveyard.
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "mill", target: "you", amount: 5 },
          {
            kind: "return-from-graveyard",
            filter: { subtypes: ["Aura", "Equipment"] },
            destination: "hand",
            count: 1,
          },
        ],
      },
      resolve: null,
      text:
        "When Dogmeat enters, mill five cards, then return an Aura or Equipment card from your " +
        "graveyard to your hand.",
    },
    {
      trigger: {
        on: "attacks",
        who: "you-control",
        filter: { anyOf: [{ enchanted: true }, { equipped: true }] },
      },
      targets: [],
      effect: { kind: "create-token", token: "Junk Token", count: 1 },
      resolve: null,
      text: "Whenever a creature you control that's enchanted or equipped attacks, create a Junk token.",
    },
  ],
});
