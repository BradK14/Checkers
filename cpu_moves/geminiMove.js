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
  const boardString = buildBoardString(state);
  // Step 2: Write a prompt that tells Gemini it is playing as Black.
  // Step 3: Include the board string in the prompt so Gemini can see the current position.
  // Step 4: Ask Gemini for the next move only.
  // Step 5: Instruct Gemini to return strict JSON in this shape: {"from":[row,col],"to":[row,col]}.
  // Step 6: Return the completed prompt string.
  return "You are currently playing checkers as black on a 0 based index 8x8 board.\n" +
  "Here is the current state of the board where 'B' is black, 'W' is white, 'BK' is black king, 'WK' is white king, and '.' is empty:\n" +
  boardString + "\n" +
  'Provide the next move for black strictly in json formatted as:  {"from":[row,col],"to":[row,col]}';
}

// Call Gemini with the current board state and return the move coordinates it suggests.
export async function chooseGeminiMove({ state, legalMoves, apiKey }) {
  // Step 1: Validate that GEMINI_API_KEY is available before making a request.
  if (!apiKey) { return; }
  // Step 2: Build the prompt from the current board state.
  const prompt = buildPrompt(state);
  console.log(prompt);
  // Step 3: Create a GoogleGenAI client with the API key.
  try{
    const ggai = new GoogleGenAI({apiKey: apiKey});
    // Step 4: Call the Gemini model and send the prompt contents.
    const response = await ggai.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
        contents: prompt,
      });
    // Step 5: Read the text response from the first candidate/part.
    console.log(JSON.stringify(response));
    // Step 6: Parse the returned JSON.
    const parsedRes = JSON.parse(response.candidates?.[0]?.content?.parts?.[0]?.text);
    // Step 7: Validate that the JSON contains `from` and `to` arrays.
    if (!Array.isArray(parsedRes.from) || !Array.isArray(parsedRes.to)){
      throw new Error('Gemini response invalid');
    }
    if (!validateGeminiMove(parsedRes, legalMoves)){
      throw new Error('Gemini response move illegal');
    }
    // Step 8: Return the parsed move object so the rest of the game can use it.
    return parsedRes;
  }
  catch (error){
    // Step 9: Throw a helpful error if the API key is missing or the response is invalid.
    console.error('Gemini error:', error.message);
  }
}

// Checks if a gemini response holds a valid cpu move
function validateGeminiMove(cpuMove, legalMoves){
	if (!cpuMove) { return false; }

	for (let move of legalMoves){
		if (move.piece.row === cpuMove.from[0] &&
			move.piece.col === cpuMove.from[1] &&
			move.target.row === cpuMove.to[0] &&
			move.target.col === cpuMove.to[1]){
				return true;
			}
	}

	return false;
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