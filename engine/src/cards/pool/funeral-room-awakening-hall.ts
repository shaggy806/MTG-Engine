import { roomCard } from "../helpers.js";
import left from "./funeral-room.js";
import right from "./awakening-hall.js";

// EDHREC rank 2072. A Room (rule 709.5): each door is cast on its own and
// enters unlocked; the other is unlocked by paying its mana cost as a
// sorcery.
export default roomCard("Funeral Room // Awakening Hall", left, right);
