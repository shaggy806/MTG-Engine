import { defineCard } from "../define.js";

// EDHREC rank 5829.
export default defineCard({
  name: "Soothing of Sméagol",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Return target nontoken creature to its owner's hand. The Ring tempts you.",
  targets: [{ kind: "permanent", filter: { type: "creature", token: false } }],
  effect: { kind: "sequence", effects: [{ kind: "return-to-hand", target: 0 }, { kind: "the-ring-tempts-you" }] },
});
