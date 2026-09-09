import { defineCard } from "../define.js";

/**
 * Landfall "add one mana of any color" — modeled as a resolution-time
 * `modal` ("choose one") over the five colours, so the controller makes a
 * real colour choice (a standalone `add-mana: "any-color"` would just make
 * white). The mana empties at end of step/phase like any other, so its value
 * is spending it the same step the land dropped.
 */
export default defineCard({
  name: "Lotus Cobra",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Snake"],
  power: 2,
  toughness: 1,
  text: "Landfall — Whenever a land you control enters, add one mana of any color.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: {
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
      resolve: null,
      text: "Landfall — Whenever a land you control enters, add one mana of any color.",
    },
  ],
});
