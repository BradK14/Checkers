import {GoogleGenAI} from '@google/genai';

// Convert the board state object into a readable 8x8 text board for the Gemini prompt.
function buildBoardString(state) {
  const board = Array.isArray(state?.board)
    ? state.board.map((row) => (Array.isArray(row) ? row.slice(0, 8) : [0, 0, 0, 0, 0, 0, 0, 0]))
    : [];

  const kings = new Set();
  if (Array.isArray(state?.pieces)) {
    for (const piece of state.pieces) {
      if (!piece || !piece.king || !Array.isArray(piece.position) || piece.position.length !== 2) continue;
      const [row, col] = piece.position;
      if (Number.isInteger(row) && Number.isInteger(col) && row >= 0 && row < 8 && col >= 0 && col < 8) {
        kings.add(`${row},${col}`);
      }
    }
  }

  return board
    .map((row, rowIndex) => row
      .map((cell, colIndex) => {
        const isKing = kings.has(`${rowIndex},${colIndex}`);
        if (cell === 1) return isKing ? 'WK' : 'W';
        if (cell === 2) return isKing ? 'BK' : 'B';
        return '.';
      })
      .join(' '))
    .join('\n');
}

// Build the plain-language prompt that asks Gemini for the next black move.
function buildPrompt(state) {
  // Step 1: Convert the current board state into a readable board string.
  // Step 2: Write a prompt that tells Gemini it is playing as Black.
  // Step 3: Include the board string in the prompt so Gemini can see the current position.
  // Step 4: Ask Gemini for the next move only.
  // Step 5: Instruct Gemini to return strict JSON in this shape: {"from":[row,col],"to":[row,col]}.
  // Step 6: Return the completed prompt string.
  return '';
}

// Call Gemini with the current board state and return the move coordinates it suggests.
export async function chooseGeminiMove({ state, legalMoves, apiKey }) {
  // Step 1: Validate that GEMINI_API_KEY is available before making a request.
  // Step 2: Build the prompt from the current board state.
  // Step 3: Create a GoogleGenAI client with the API key.
  // Step 4: Call the Gemini model and send the prompt contents.
  // Step 5: Read the text response from the first candidate/part.
  // Step 6: Parse the returned JSON.
  // Step 7: Validate that the JSON contains `from` and `to` arrays.
  // Step 8: Return the parsed move object so the rest of the game can use it.
  // Step 9: Throw a helpful error if the API key is missing or the response is invalid.
  return null;
}
// Debug helper blueprint: list available Gemini models for troubleshooting.
// async function listModels(client) {
//     try {
//       // Fetch the list of models
//       const response = await client.models.list();
//       console.log("Available Models:");
//       const models = response.pageInternal;
//       // The response contains a 'models' array
//       models.forEach((model) => {
//         console.log(`- Name: ${model.name}`);
//         console.log('----------------------------');
//       });

//     } catch (error) {
//         console.error("Error fetching models:", error);
//     }
// }