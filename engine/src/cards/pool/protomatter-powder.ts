import { defineCard } from "../define.js";

export default defineCard({
  name: "Protomatter Powder",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["artifact"],
  text: "{4}{W}, {T}, Sacrifice this artifact: Return target artifact card from your graveyard to the battlefield.",
  activated: [
    {
      cost: { mana: "{4}{W}", tap: true, sacrifice: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "artifact" } }],
      effect: { kind: "put-onto-battlefield", target: 0 },
      resolve: null,
      text: "{4}{W}, {T}, Sacrifice this artifact: Return target artifact card from your graveyard to the battlefield.",
    },
  ],
});
