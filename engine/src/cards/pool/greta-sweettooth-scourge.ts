import { defineCard } from "../define.js";

// EDHREC rank 5637.
// Makes Food → uses "Food Token".
//
// "A Food" is any Food artifact, a Food creature included (the ruling).
//
// Rulings:
//   [2024-11-08] You can't sacrifice a Food to pay multiple costs. For example, you can't
//     sacrifice a Food token to activate its own ability and also to activate Maraleaf Rider's
//     ability.
//   [2024-11-08] Food is an artifact type. Even though it appears on some creatures, it's never a
//     creature type.
//   [2024-11-08] If an effect refers to a Food, it means any Food artifact, not just a Food
//     artifact token. For example, you can sacrifice Tough Cookie (an Artifact Creature — Food
//     Golem) to activate Maraleaf Rider's ability (an ability with "Sacrifice a Food" in its
//     cost).

const FOOD = { filter: { subtype: "Food" } } as const;

export default defineCard({
  name: "Greta, Sweettooth Scourge",
  manaCost: "{1}{B}{G}",
  colors: ["B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 3,
  toughness: 3,
  text: "When Greta enters, create a Food token. (It's an artifact with \"{2}, {T}, Sacrifice this token: You gain 3 life.\")\n{G}, Sacrifice a Food: Put a +1/+1 counter on target creature. Activate only as a sorcery.\n{1}{B}, Sacrifice a Food: You draw a card and you lose 1 life.",
  activated: [
    {
      cost: { mana: "{G}", tap: false, sacrifice: FOOD },
      targets: ["creature"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "{G}, Sacrifice a Food: Put a +1/+1 counter on target creature. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
    {
      cost: { mana: "{1}{B}", tap: false, sacrifice: FOOD },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "lose-life", amount: 1 },
        ],
      },
      resolve: null,
      text: "{1}{B}, Sacrifice a Food: You draw a card and you lose 1 life.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Food Token", count: 1 },
      resolve: null,
      text: "When Greta enters, create a Food token.",
    },
  ],
});
