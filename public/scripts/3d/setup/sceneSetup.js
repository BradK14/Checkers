import * as THREE from 'https://unpkg.com/three@0.164.1/build/three.module.js?module';
import { OrbitControls } from 'https://unpkg.com/three@0.164.1/examples/jsm/controls/OrbitControls.js?module';

// Creates the 3D scene, camera, renderer, lights, board mesh, and resize wiring.
export function createSceneSystem(canvasHost, boardSize, squareSize) {
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x1f2330);

	const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
	camera.position.set(0, 9, 9);

	const renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	renderer.shadowMap.enabled = true;
	canvasHost.appendChild(renderer.domElement);

	const controls = new OrbitControls(camera, renderer.domElement);
	controls.enableDamping = true;
	controls.target.set(0, 0.2, 0);
	controls.minDistance = 8;
	controls.maxDistance = 22;
	controls.maxPolarAngle = Math.PI * 0.48;

	scene.add(new THREE.HemisphereLight(0xf4f7ff, 0x252526, 0.9));

	const keyLight = new THREE.DirectionalLight(0xffffff, 1.05);
	keyLight.position.set(8, 14, 6);
	keyLight.castShadow = true;
	keyLight.shadow.mapSize.set(1024, 1024);
	scene.add(keyLight);

	const fillLight = new THREE.PointLight(0xb7c6ff, 0.4, 40);
	fillLight.position.set(-6, 6, -7);
	scene.add(fillLight);

	const boardGroup = new THREE.Group();
	scene.add(boardGroup);

	const boardOffset = (boardSize * squareSize) / 2 - squareSize / 2;
	const darkSquares = [];

	const base = new THREE.Mesh(
		new THREE.BoxGeometry(9, 0.5, 9),
		new THREE.MeshStandardMaterial({ color: 0x2d2017, roughness: 0.9 })
	);
	base.position.y = -0.28;
	base.receiveShadow = true;
	boardGroup.add(base);

	const darkSquareMat = new THREE.MeshStandardMaterial({ color: 0x4d2a1b, roughness: 0.95 });
	const lightSquareMat = new THREE.MeshStandardMaterial({ color: 0xd8bfa4, roughness: 0.95 });
	const squareGeo = new THREE.BoxGeometry(squareSize, 0.15, squareSize);

	for (let row = 0; row < boardSize; row += 1) {
		for (let col = 0; col < boardSize; col += 1) {
			const isDark = (row + col) % 2 === 1;
			const square = new THREE.Mesh(squareGeo, isDark ? darkSquareMat : lightSquareMat);
			square.position.set(col - boardOffset, 0, row - boardOffset);
			square.receiveShadow = true;
			square.userData = { isSquare: true, row, col, isDark };
			boardGroup.add(square);
			if (isDark) darkSquares.push(square);
		}
	}

	// Keeps renderer and projection in sync with host element size changes.
	function resize() {
		const width = canvasHost.clientWidth;
		const height = canvasHost.clientHeight;
		renderer.setSize(width, height, false);
		camera.aspect = width / height;
		camera.updateProjectionMatrix();
	}

	window.addEventListener('resize', resize);
	resize();

	return {
		THREE,
		scene,
		camera,
		renderer,
		controls,
		boardGroup,
		darkSquares,
		boardOffset
	};
}
