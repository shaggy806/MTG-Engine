import { defineCard } from "../define.js";

export default defineCard({
  name: "Undermine",
  manaCost: "{U}{U}{B}",
  colors: ["U", "B"],
  types: ["instant"],
  text: "Counter target spell. Its controller loses 3 life.",
  targets: ["spell"],
  effect: {
    kind: "sequence",
    effects: [
      // The life loss is read off the countered spell, so the counter has to
      // come first only for the printed order — `controllerOf` answers either
      // way (a spell's controller is its owner).
      { kind: "counter", target: 0 },
      { kind: "lose-life", amount: 3, toControllerOfTarget: 0 },
    ],
  },
});
