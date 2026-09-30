import type { EffectSpec } from "../../effects.js";
import { defineCard } from "../define.js";

// "Two mana in any combination of colors": one colour choice per unit, made
// as the spell resolves.
const ONE_OF_ANY_COLOR: EffectSpec = {
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
};

export default defineCard({
  name: "Manamorphose",
  manaCost: "{1}{R/G}",
  colors: ["R", "G"],
  types: ["instant"],
  text: "Add two mana in any combination of colors.\nDraw a card.",
  effect: {
    kind: "sequence",
    effects: [ONE_OF_ANY_COLOR, ONE_OF_ANY_COLOR, { kind: "draw", amount: 1 }],
  },
});
