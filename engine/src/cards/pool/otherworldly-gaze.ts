import { defineCard } from "../define.js";

export default defineCard({
  name: "Otherworldly Gaze",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  flashback: { cost: "{1}{U}" },
  text: "Surveil 3. (Look at the top three cards of your library, then put any number of them into your graveyard and the rest on top of your library in any order.)\nFlashback {1}{U} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  effect: { kind: "surveil", amount: 3 },
});
