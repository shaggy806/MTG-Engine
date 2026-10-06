import { defineCard } from "../define.js";

// "Destroy target permanent unless its controller has Combustion Man deal
// damage to them equal to his power": the permanent's controller picks one of
// the two outcomes as the trigger resolves (Combustible Gearhulk's `choices`
// shape), and either is Combustion Man's controller's effect — the damage is
// dealt by Combustion Man, his power read as it resolves (as he last existed,
// if he's gone — rule 608.2h). They may take the damage even at power 0.
const ATTACK_TEXT =
  "Whenever Combustion Man attacks, destroy target permanent unless its controller has Combustion Man deal damage to them equal to his power.";

export default defineCard({
  name: "Combustion Man",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Assassin"],
  power: 4,
  toughness: 6,
  text: ATTACK_TEXT,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: ["permanent"],
      effect: {
        kind: "each-player-may",
        who: { controllerOfTarget: 0 },
        choices: [
          {
            text: "Have Combustion Man deal damage to you equal to his power.",
            effect: { kind: "damage", amount: { powerOf: "source" }, who: "that-player" },
          },
          { text: "Let the permanent be destroyed.", effect: { kind: "destroy", target: 0 } },
        ],
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
