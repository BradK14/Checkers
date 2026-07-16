import { BOARD_SIZE, SQUARE_SIZE, createGameState } from './3d/models/gameState.js';
import { getGameDomRefs } from './3d/setup/domRefs.js';
import { createSceneSystem } from './3d/setup/sceneSetup.js';
import { initializeGameWorld } from './3d/setup/gameSetup.js';
import { createGameController } from './3d/logic/gameLogic.js';

const dom = getGameDomRefs();
const state = createGameState(BOARD_SIZE);
const sceneCtx = createSceneSystem(dom.canvasHost, BOARD_SIZE, SQUARE_SIZE);
const gameWorld = initializeGameWorld(state, sceneCtx);

const controller = createGameController(state, dom, sceneCtx, gameWorld);
controller.start();
