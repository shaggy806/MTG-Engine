import { defineCard } from "../define.js";

// Flying and not being legendary are part of what the token copies (rule
// 707.9b), so they hold whatever it copies (the ruling on its update).
export default defineCard({
  name: "Irenicus's Vile Duplication",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Create a token that's a copy of target creature you control, except the token has flying and it isn't legendary.",
  targets: ["creature-you-control"],
  effect: {
    kind: "create-token-copy",
    of: 0,
    count: 1,
    who: "you",
    notLegendary: true,
    exceptions: { keywords: ["flying"] },
  },
});
