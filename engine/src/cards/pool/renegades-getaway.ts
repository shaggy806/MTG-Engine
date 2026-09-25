import { defineCard } from "../define.js";

export default defineCard({
  name: "Renegade's Getaway",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Target permanent gains indestructible until end of turn. Create a 1/1 colorless Servo artifact creature token. (Effects that say \"destroy\" don't destroy a permanent with indestructible, and if it's a creature, it can't be destroyed by damage.)",
  targets: ["permanent"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "grant-keyword", target: 0, keyword: "indestructible", duration: "end-of-turn" },
      { kind: "create-token", token: "Servo Token", count: 1 },
    ],
  },
});
