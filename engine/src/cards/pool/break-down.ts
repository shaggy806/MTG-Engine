import { defineCard } from "../define.js";

export default defineCard({
  name: "Break Down",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Destroy target artifact or enchantment. Create a Junk token. (It's an artifact with \"{T}, Sacrifice this token: Exile the top card of your library. You may play that card this turn. Activate only as a sorcery.\")",
  targets: ["artifact-or-enchantment"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "destroy", target: 0 }, { kind: "create-token", token: "Junk Token", count: 1 }],
  },
});
