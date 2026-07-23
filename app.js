import 'dotenv/config';

import path from 'node:path';
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';

import express from 'express';
import { resolveCpuMove } from './cpu_moves/index.js';

const app = express();
const PORT = process.env.PORT || 3001;

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.dirname(__filename);
const savesDir = path.join(rootDir, 'data');
const twoDGameSavePath = path.join(savesDir, '2d-game-save.json');

// Simple throttle: one CPU move request at a time to avoid rate-limit hammering
let cpuMoveInProgress = false;
const cpuMoveQueue = [];

async function processCpuMoveQueue() {
	// Step 1.1: Exit early when a CPU move is already being processed.
	if (cpuMoveInProgress || cpuMoveQueue.length === 0) { return; }
	cpuMoveInProgress = true;
	// Step 1.2: Pull the next queued CPU request.
	const {handler} = cpuMoveQueue.shift();
	// Step 1.3: Run the queued handler.
	await handler();
	// Step 1.4: Clear the in-progress flag and continue with the next queued request.
	cpuMoveInProgress = false;
	processCpuMoveQueue();
}

function withThrottle(handler) {
	// Step 2.1: Return a wrapper function for route handlers.
	// Step 2.2: Push incoming request handlers into the CPU queue.
	// Step 2.3: Start queue processing.
	return (req, res) => {
		// Queue the route handler and start processing.
		cpuMoveQueue.push({handler: () => {return handler(req, res); }});
		processCpuMoveQueue();
	};
}

async function ensureSavesDirectory() {
	// Step 3.1: Create the save directory if it does not already exist.
	await fs.mkdir(savesDir, {recursive: true});
}

function isValid2dGameState(state) {
	// Step 4.1: Confirm state is an object.
	if (typeof state !== 'object'){
		return false;
	}
	// Step 4.2: Confirm board is an 8x8 array.
	if (state.board.length !== 8){
		return false;
	}
	// Step 4.3: Confirm pieces is an array.
	if (!Array.isArray(state.pieces)){
		return false;
	}
	// Step 4.4: Confirm score, if present, is an object.
	if (typeof state.score !== 'object'){
		return false;
	}

	return true;
}

app.use(express.json({ limit: '1mb' }));

// Serve all project static files under /checkers (script, styles, images, favicons).
app.use(express.static(path.join(rootDir, "public")));

app.get('/checkers', (req, res) => {
	// Step 5.1: Redirect the base checkers route to the 2D game.
	res.redirect('/checkers/2d');
});

app.get('/checkers/2d', (req, res) => {
	res.sendFile(path.join(rootDir, "views", "index.html"));
});

app.get('/checkers/3d', (req, res) => {
	// Step 7.1: Send the 3D game HTML file.
	res.sendFile(path.join(rootDir, "views", "3d.html"));
});

app.get('/api/checkers/2d/save', async (req, res) => {
	try{
		// Step 8.1: Read saved game JSON from disk.
		const saveFile = await fs.readFile(twoDGameSavePath);
		// Step 8.2: Return the parsed payload.
		return res.status(201).json(JSON.parse(saveFile));
	}
	catch(error){
		// Step 8.3: Return 404 when no save exists.
		if (error.code === 'ENOENT') {
			return res.status(404).json({ message: `No save data: ${error.name}.  ${error.message}` });
		}
		// Step 8.4: Return 500 for other read/parse errors.
		return res.status(500).json({ message: `Failed to retrieve save data: ${error.name}.  ${error.message}`});
	}
	
});

app.post('/api/checkers/2d/save', async (req, res) => {
	// Step 9.1: Read state from request body.
	const {state} = req.body;
	// Step 9.2: Validate incoming game state.
	if (!isValid2dGameState(state)) {
		return res.status(400).json({ message: 'Invalid game state' });
	}
	// Step 9.3: Add savedAt timestamp.
	const date = new Date();
	// Step 9.4: Ensure save directory exists.
	await ensureSavesDirectory();
	// Step 9.5: Write JSON payload to disk.
	const resData = {
		date: date,
		message: 'SAVED',
		state
	}

	try{
		await fs.writeFile(twoDGameSavePath, JSON.stringify(resData));
		// Step 9.6: Return created payload or 500 on failure.
		return res.status(201).json(resData);
	}
	catch(error){
		return res.status(500).json({
			date: date,
			message: 'FAILED TO SAVE',
			state: null
		})
	}
});

app.post('/api/checkers/2d/cpu-move', withThrottle(async (req, res) => {
	// Step 10.1: Read state, legalMoves, and difficulty from the request body.
	const {state, legalMoves, difficulty} = req.body;
	// Step 10.2: Validate the incoming state and legal move list.
	if (!state) { return res.status(400); }
	if (!legalMoves) { return res.status(400); }
	// Step 10.3: Validate move ids so response can be checked safely.
	// Step 10.4: Call the provided CPU resolver with state, moves, difficulty, and Gemini API key.
	const resolvedCpuMove = await resolveCpuMove({
		state,
		legalMoves,
		difficulty,
		apiKey: process.env.GEMINI_API_KEY
	});
	// Step 10.5: Accept either a moveId or from/to coordinate response.
	// Step 10.6: Return the selected move payload to the client.
	return res.json({
		moveId: resolvedCpuMove.moveId,
		move: resolvedCpuMove.move,
		provider: resolvedCpuMove.provider,
		fallback: resolvedCpuMove.fallback
	});
	// Step 10.7: Return appropriate error codes/messages for invalid payloads or API failures.
}));

app.get('/', (req, res) => {
	// Step 11.1: Redirect the site root to the 2D game.
	res.redirect('/checkers/2d');
});

app.listen(PORT, () => {
	// Step 12.1: Start the Express server on the configured port.
	// Step 12.2: Log helpful startup information, such as URLs and API key availability.
	console.log(`Checkers game at: http://localhost:${PORT}/checkers/2d`);
	console.log(`CPU Active through GEMINI API key: ${Boolean(process.env.GEMINI_API_KEY)}`);
});
