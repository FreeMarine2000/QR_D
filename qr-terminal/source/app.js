import React, {useEffect, useState} from 'react';
import {Box, Text, useInput} from 'ink';
import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); 
// PROJECT PATHS
const PROJECT_ROOT = path.resolve(__dirname, '..');
const REPOSITORY_ROOT = path.resolve(PROJECT_ROOT, '..');

const PYTHON_SCRIPT = path.join(
	REPOSITORY_ROOT,
	'backend',
	'qr_generator.py',
);

// COLORS

const PURPLE = '#8B5CF6';
const YELLOW = '#F59E0B';
const WHITE = 'white';
const GREY = 'gray';


// LOADING ANIMATION


const FRAMES = [
	'░░░░░░░░░░',
	'██░░░░░░░░',
	'████░░░░░░',
	'██████░░░░',
	'████████░░',
	'██████████',
];


// ASCII QR LOGO


const QR_LOGO = [
	' █████   ██████ ',
	'██   ██  ██   ██',
	'██   ██  ██   ██',
	'██ █ ██  ██████ ',
	'██  ███  ██ ██  ',
	'██   ██  ██  ██ ',
	' █████   ██   ██',
];

export default function App() {
	const [url, setUrl] = useState('');
	const [focused, setFocused] = useState('input');
	const [screen, setScreen] = useState('home');
	const [frame, setFrame] = useState(0);
	const [qrOutput, setQrOutput] = useState('');
	const [resultFocus, setResultFocus] = useState('again');
	const [error, setError] = useState('');


	// LOADING ANIMATION


	useEffect(() => {
		if (screen !== 'loading') {
			return;
		}

		const timer = setInterval(() => {
			setFrame(value => (value + 1) % FRAMES.length);
		}, 100);

		return () => {
			clearInterval(timer);
		};
	}, [screen]);


	// GENERATE QR


	const generateQR = () => {
		const cleanUrl = url.trim();

		if (!cleanUrl) {
			return;
		}

		setFrame(0);
		setQrOutput('');
		setError('');
		setScreen('loading');

		let output = '';
		let errorOutput = '';

		const python = spawn(
			process.env.PYTHON || 'python3',
			[PYTHON_SCRIPT, cleanUrl],
			{
				cwd: PROJECT_ROOT,
			},
		);


		// PYTHON OUTPUT


		python.stdout.on('data', data => {
			output += data.toString();
		});

		python.stderr.on('data', data => {
			errorOutput += data.toString();
		});


		// PYTHON PROCESS ERROR


		python.on('error', spawnError => {
			setError(
				spawnError.message ||
				'Unable to start the Python backend.',
			);

			setScreen('error');
		});


		// PYTHON PROCESS COMPLETE


		python.on('close', (code, signal) => {
			if (code === 0) {
				const startMarker =
					'--- Terminal QR Code ---';

				const endMarker = 'Success!';

				const start =
					output.indexOf(startMarker);

				const end =
					output.indexOf(endMarker);

				// Python succeeded but expected output
				// was not found.
				if (start === -1 || end === -1) {
					setError(
						'QR generation completed, but the QR output could not be read.',
					);

					setScreen('error');
					return;
				}

				const qr = output
					.slice(
						start + startMarker.length,
						end,
					)
					.trim();

				if (!qr) {
					setError(
						'QR generation completed, but the QR code was empty.',
					);

					setScreen('error');
					return;
				}

				setQrOutput(qr);
				setScreen('result');
				return;
			}


			// PYTHON FAILED


			let message = errorOutput.trim();

			if (!message) {
				message = signal
					? `Python process terminated by ${signal}.`
					: `Python exited with code ${code}.`;
			}

			// Prevent a massive Python traceback from
			// destroying the terminal UI.
			if (message.length > 300) {
				message =
					message.slice(0, 300) + '...';
			}

			setError(message);
			setScreen('error');
		});
	};


	// KEYBOARD INPUT


	useInput((input, key) => {
		// ESC → EXIT
		if (key.escape) {
			process.exit(0);
		}


		// LOADING


		if (screen === 'loading') {
			return;
		}


		// ERROR SCREEN


		if (screen === 'error') {
			if (key.return) {
				setScreen('home');
				setError('');
				setFocused('input');
			}

			return;
		}


		// RESULT SCREEN


		if (screen === 'result') {
			if (
				key.leftArrow ||
				key.rightArrow ||
				key.tab
			) {
				setResultFocus(current =>
					current === 'again'
						? 'exit'
						: 'again',
				);

				return;
			}

			if (key.return) {
				if (resultFocus === 'again') {
					setScreen('home');
					setQrOutput('');
					setUrl('');
					setError('');
					setFocused('input');
					setResultFocus('again');
				} else {
					process.exit(0);
				}
			}

			return;
		}


		// HOME NAVIGATION


		if (
			key.upArrow ||
			key.downArrow ||
			key.tab
		) {
			setFocused(current =>
				current === 'input'
					? 'button'
					: 'input',
			);

			return;
		}


		// URL INPUT


		if (focused === 'input') {
			if (key.backspace || key.delete) {
				setUrl(value =>
					value.slice(0, -1),
				);

				return;
			}

			if (key.return) {
				setFocused('button');
				return;
			}

			if (key.ctrl || key.meta) {
				return;
			}

			if (input) {
				setUrl(value => value + input);
			}

			return;
		}


		// GENERATE BUTTON


		if (
			focused === 'button' &&
			key.return
		) {
			generateQR();
		}
	});


	// LOADING SCREEN


	if (screen === 'loading') {
		return (
			<Box
				borderStyle="double"
				borderColor={PURPLE}
				flexDirection="column"
				alignItems="center"
				padding={2}
				width={64}
			>
				<Box
					flexDirection="column"
					alignItems="center"
				>
					{QR_LOGO.map((line, index) => (
						<Text
							key={index}
							bold
							color={
								index === 3
									? YELLOW
									: PURPLE
							}
						>
							{line}
						</Text>
					))}
				</Box>

				<Box marginTop={2}>
					<Text bold color={YELLOW}>
						GENERATING
					</Text>
				</Box>

				<Box marginTop={1}>
					<Text color={PURPLE}>
						{FRAMES[frame]}
					</Text>
				</Box>

				<Box marginTop={1}>
					<Text color={GREY}>
						{url}
					</Text>
				</Box>
			</Box>
		);
	}


	// ERROR SCREEN


	if (screen === 'error') {
		return (
			<Box
				borderStyle="double"
				borderColor={PURPLE}
				flexDirection="column"
				alignItems="center"
				padding={2}
				width={64}
			>
				<Text bold color={YELLOW}>
					GENERATION FAILED
				</Text>

				<Box marginTop={2}>
					<Text color={GREY}>
						Could not generate the QR code.
					</Text>
				</Box>

				<Box
					marginTop={1}
					paddingX={1}
				>
					<Text color={WHITE}>
						{error}
					</Text>
				</Box>

				<Box marginTop={2}>
					<Text color={PURPLE}>
						⏎ RETURN
					</Text>
				</Box>

				<Text color={GREY}>
					ESC EXIT
				</Text>
			</Box>
		);
	}


	// RESULT SCREEN


	if (screen === 'result') {
		const againFocused =
			resultFocus === 'again';

		const exitFocused =
			resultFocus === 'exit';

		return (
			<Box
				borderStyle="double"
				borderColor={PURPLE}
				flexDirection="column"
				alignItems="center"
				padding={2}
				width={76}
			>
				<Text bold color={YELLOW}>
					✓ GENERATION COMPLETE
				</Text>

				<Box marginTop={2}>
					<Text color={WHITE}>
						{qrOutput}
					</Text>
				</Box>

				<Box
					flexDirection="column"
					alignItems="center"
					marginTop={2}
				>
					<Text color={GREY}>
						DESTINATION
					</Text>

					<Text color={WHITE}>
						{url}
					</Text>
				</Box>

				<Box marginTop={2}>
					<Text bold color={YELLOW}>
						✓ QR CODE READY
					</Text>
				</Box>

				<Text color={GREY}>
					OUTPUT → qrcode.jpg
				</Text>

				<Box marginTop={2}>
					<Text
						bold
						color={
							againFocused
								? 'black'
								: PURPLE
						}
						backgroundColor={
							againFocused
								? YELLOW
								: undefined
						}
					>
						{againFocused
							? '  ↻ GENERATE AGAIN  '
							: '    ↻ GENERATE AGAIN    '}
					</Text>

					<Text
						bold
						color={
							exitFocused
								? 'black'
								: PURPLE
						}
						backgroundColor={
							exitFocused
								? YELLOW
								: undefined
						}
					>
						{exitFocused
							? '  ✕ EXIT  '
							: '    ✕ EXIT    '}
					</Text>
				</Box>

				<Box marginTop={2}>
					<Text color={GREY}>
						←→ NAVIGATE   ⏎ SELECT   ESC EXIT
					</Text>
				</Box>
			</Box>
		);
	}


	// HOME SCREEN


	const inputFocused = focused === 'input';
	const buttonFocused = focused === 'button';

	return (
		<Box
			borderStyle="double"
			borderColor={PURPLE}
			flexDirection="column"
			alignItems="center"
			padding={2}
			width={64}
		>
			<Box
				flexDirection="column"
				alignItems="center"
			>
				{QR_LOGO.map((line, index) => (
					<Text
						key={index}
						bold
						color={
							index === 3
								? YELLOW
								: PURPLE
						}
					>
						{line}
					</Text>
				))}
			</Box>

			<Box
				flexDirection="column"
				width={58}
				marginTop={2}
			>
				<Text
					bold
					color={
						inputFocused
							? YELLOW
							: WHITE
					}
				>
					{inputFocused
						? '●'
						: '○'} DESTINATION
				</Text>

				<Box
					borderStyle="round"
					borderColor={
						inputFocused
							? YELLOW
							: GREY
					}
					marginTop={1}
					paddingX={1}
				>
					<Text color={WHITE}>
						<Text color={YELLOW}>
							❯{' '}
						</Text>

						{url}

						{inputFocused && (
							<Text color={YELLOW}>
								▌
							</Text>
						)}
					</Text>
				</Box>
			</Box>

			<Box marginTop={2}>
				<Text
					bold
					color={
						buttonFocused
							? 'black'
							: PURPLE
					}
					backgroundColor={
						buttonFocused
							? YELLOW
							: undefined
					}
				>
					{buttonFocused
						? '  ▶  GENERATE QR  '
						: '    GENERATE QR    '}
				</Text>
			</Box>

			<Box marginTop={2}>
				<Text color={GREY}>
					↑↓ NAVIGATE   ⏎ SELECT   ESC EXIT
				</Text>
			</Box>
		</Box>
	);
}