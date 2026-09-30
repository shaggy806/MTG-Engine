import { defineCard } from "../define.js";

const TEXT =
  "Landfall — Whenever a land you control enters, add one mana of any color. Then if this is the second time this ability has resolved this turn, reveal cards from the top of your library until you reveal an Elf or Elemental card. Put that card into your hand and the rest on the bottom of your library in a random order.";

// The colour is chosen as the ability resolves, as Lotus Cobra's is. Every
// resolution after the second only adds mana (the ruling); with no Elf or
// Elemental left, every revealed card goes to the bottom.
export default defineCard({
  name: "Nissa, Resurgent Animist",
  manaCost: "{2}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elf", "Scout"],
  power: 3,
  toughness: 3,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "modal",
            minModes: 1,
            maxModes: 1,
            modes: [
              { text: "Add {W}.", effect: { kind: "add-mana", mana: "W", amount: 1 } },
              { text: "Add {U}.", effect: { kind: "add-mana", mana: "U", amount: 1 } },
              { text: "Add {B}.", effect: { kind: "add-mana", mana: "B", amount: 1 } },
              { text: "Add {R}.", effect: { kind: "add-mana", mana: "R", amount: 1 } },
              { text: "Add {G}.", effect: { kind: "add-mana", mana: "G", amount: 1 } },
            ],
          },
          {
            kind: "conditional",
            condition: { kind: "resolved-this-turn", n: 2 },
            then: {
              kind: "reveal-until",
              filter: { subtypes: ["Elf", "Elemental"] },
              put: "hand",
              rest: "bottom-random",
            },
          },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
