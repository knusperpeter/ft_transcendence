import GameEngine from './gameEngine.ts';
import { GameMode, GameState, OpponentMode } from './types.ts';

export class InputHandler {
	private _engine: GameEngine;
	public _oppMode: OpponentMode = OpponentMode.SINGLE;
	private _onPopState?: (e: PopStateEvent) => void;

	constructor(engine: GameEngine) {
		this._engine = engine;
	}

	public setupEventListeners(): void {
		window.addEventListener('keydown', this.handleKeyDown.bind(this));
		window.addEventListener('keyup', this.handleKeyUp.bind(this));

		// Map browser Back button to behave like Escape and keep user on game view
		try {
			history.pushState(null, '', window.location.href);
			this._onPopState = (e: PopStateEvent) => {
				// Stop router from handling this popstate
				try { e.stopImmediatePropagation(); e.stopPropagation(); } catch {}
				// prevent navigating away by restoring state, then mirror Esc
				history.pushState(null, '', window.location.href);
				this.handleEscapeAction();
			};
			// Use capture to intercept before router listeners
			window.addEventListener('popstate', this._onPopState, true);
		} catch {}
	}

	private handleKeyDown(event: KeyboardEvent): void {
		switch(this._engine._gameStateMachine.getCurrentState()) {
			case GameState.START:
				this.handleStartScreen(event);
				break;
			case GameState.OPPONENT:
				this.handleOpponentScreen(event);
				break;
			case GameState.SELECT:
				this.handleSelectScreen(event);
				break;
			case GameState.GAME:
				this.handleGameScreenDown(event);
				break;
			case GameState.PAUSED:
				this.handlePauseScreen(event);
				break;
			case GameState.GAME_OVER:
				this.handleGameOverScreen(event);
				break;
			case GameState.PRE_BATTLE_SCREEN:
				this.handlePreBattleScreen(event);
				break;
			case GameState.TOURNAMENT_MIDDLE:
				this.handleTournamentMiddle(event);
		}
	}

	private handleKeyUp(event:KeyboardEvent): void {
		switch(this._engine._gameStateMachine.getCurrentState()) {
			case GameState.GAME:
				this.handleGameScreenUp(event);
				break;
		}
	}

	private handleStartScreen(event: KeyboardEvent): void {
		if (event.key == 'Enter') {
			console.log("pressed start");
			this._engine._gameStateMachine.transition(GameState.OPPONENT);
		}
	}

	private handleSelectScreen(event: KeyboardEvent): void {
		if (event.key == 'ArrowUp') {
			var currentIndex = this._engine._selectScreen._options.indexOf(this._engine._selectScreen._currentOption);
			this._engine._selectScreen._currentOption = this._engine._selectScreen._options[
				(currentIndex - 1 + this._engine._selectScreen._options.length) % this._engine._selectScreen._options.length];
		}

		if (event.key == 'ArrowDown') {
			var currentIndex = this._engine._selectScreen._options.indexOf(this._engine._selectScreen._currentOption);
			this._engine._selectScreen._currentOption = this._engine._selectScreen._options[
				(currentIndex + 1) % this._engine._selectScreen._options.length];
		}

		if (event.key == 'Enter') {
			console.log("selected mode: ", this._engine._selectScreen._currentOption);
			this._engine._gameStateMachine.transition(GameState.GAME);
			this._engine.startGame(this._engine._selectScreen._currentOption, this._oppMode);
		}

		if (event.key == 'Escape') {
			this._engine._gameStateMachine.transition(GameState.OPPONENT);
		}
	}

	private handleOpponentScreen(event: KeyboardEvent): void {
		if (event.key == 'ArrowUp') {
			var currentIndex = this._engine._opponentScreen._options.indexOf(this._engine._opponentScreen._currentOption);
			this._engine._opponentScreen._currentOption = this._engine._opponentScreen._options[
				(currentIndex - 1 + this._engine._opponentScreen._options.length) % this._engine._opponentScreen._options.length];
		}

		if (event.key == 'ArrowDown') {
			var currentIndex = this._engine._opponentScreen._options.indexOf(this._engine._opponentScreen._currentOption);
			this._engine._opponentScreen._currentOption = this._engine._opponentScreen._options[
				(currentIndex + 1) % this._engine._opponentScreen._options.length];
		}

		if (event.key == 'Enter') {
			console.log("selected mode: ", this._engine._opponentScreen._currentOption);
			this._oppMode = this._engine._opponentScreen._currentOption;
			if (this._oppMode == OpponentMode.ONLINE) {
				this._engine._gameStateMachine.transition(GameState.START);
			}
			else {
				this._engine._gameStateMachine.transition(GameState.SELECT);
			}
		}
	}

	private handleGameScreenDown(event: KeyboardEvent): void {
		if (this._engine._pongGame) {
			const gameStats = this._engine._pongGame._gameStats.paddleDirection;
			
			if (this._engine._pongGame?._gameStats.pnumber == this._engine._pongGame?._p1.getPnumber()
				|| (this._engine._pongGame?._p1.isBot() && event.location == 1 && this._engine._pongGame?._gameStats.pnumber == this._engine._pongGame?._p1.getPnumber())
				|| this._engine._pongGame._oppMode === OpponentMode.MULTI) {
				if (event.key == 'w') gameStats.left = -1;
				if (event.key == 's') gameStats.left = +1;
			}

			if ((this._engine._pongGame?._gameStats.pnumber == this._engine._pongGame?._p2.getPnumber())
				|| (this._engine._pongGame?._p2.isBot() && event.location == 1 && this._engine._pongGame?._gameStats.pnumber == this._engine._pongGame?._p1.getPnumber())
				|| this._engine._pongGame._oppMode === OpponentMode.MULTI) {
				if (event.key == 'ArrowUp') gameStats.right = -1;
				if (event.key == 'ArrowDown') gameStats.right = +1;
			}

			if (this._engine._pongGame._mode === GameMode.TEAMS
				&& (this._engine._pongGame._gameStats.pnumber == this._engine._pongGame._p3?.getPnumber()
				|| this._engine._pongGame._oppMode === OpponentMode.MULTI)) {
				if (event.key == 'g') gameStats.ml = -1;
				if (event.key == 'b') gameStats.ml = +1;
			}

			if (this._engine._pongGame._mode === GameMode.TEAMS
				&& (this._engine._pongGame._gameStats.pnumber == this._engine._pongGame._p4?.getPnumber()
				|| this._engine._pongGame._oppMode === OpponentMode.MULTI)) {
				if (event.key == 'k') gameStats.mr = -1;
				if (event.key == 'm') gameStats.mr = +1;
			}

			if (event.key == 'Escape' && this._engine._pongGame._oppMode != OpponentMode.ONLINE){
				this._engine._gameStateMachine.transition(GameState.PAUSED);
			}
		}
	}

	private handleGameScreenUp(event: KeyboardEvent): void {
		if (this._engine._pongGame) {
			const gameStats = this._engine._pongGame._gameStats.paddleDirection;
			
			if (this._engine._pongGame?._gameStats.pnumber == this._engine._pongGame?._p1.getPnumber()
				|| (this._engine._pongGame?._p1.isBot() && event.location == 1 && this._engine._pongGame?._gameStats.pnumber == this._engine._pongGame?._p1.getPnumber())
				|| this._engine._pongGame._oppMode === OpponentMode.MULTI) {
				if (event.key == 'w'  && this._engine._pongGame._gameStats.paddleDirection.left == -1) gameStats.left = 0;
				if (event.key == 's'  && this._engine._pongGame._gameStats.paddleDirection.left == +1) gameStats.left = 0;
			}
			
			if (this._engine._pongGame?._gameStats.pnumber == this._engine._pongGame?._p2.getPnumber()
				|| (this._engine._pongGame?._p2.isBot() && event.location == 1 && this._engine._pongGame?._gameStats.pnumber == this._engine._pongGame?._p1.getPnumber())
				|| this._engine._pongGame._oppMode === OpponentMode.MULTI) {
				if (event.key == 'ArrowUp'  && this._engine._pongGame._gameStats.paddleDirection.right == -1) gameStats.right = 0;
				if (event.key == 'ArrowDown'  && this._engine._pongGame._gameStats.paddleDirection.right == +1) gameStats.right = 0;
			}

			if (this._engine._pongGame._mode === GameMode.TEAMS
				&& (this._engine._pongGame._gameStats.pnumber == this._engine._pongGame._p3?.getPnumber()
				|| this._engine._pongGame._oppMode === OpponentMode.MULTI)) {
				if (event.key == 'g' && this._engine._pongGame._gameStats.paddleDirection.ml == -1) gameStats.ml = 0;
				if (event.key == 'b'  && this._engine._pongGame._gameStats.paddleDirection.ml == +1) gameStats.ml = 0;
			}

			if (this._engine._pongGame._mode === GameMode.TEAMS
				&& (this._engine._pongGame._gameStats.pnumber == this._engine._pongGame._p4?.getPnumber()
				|| this._engine._pongGame._oppMode === OpponentMode.MULTI)) {
				if (event.key == 'k' && this._engine._pongGame._gameStats.paddleDirection.mr == -1) gameStats.mr = 0;
				if (event.key == 'm'  && this._engine._pongGame._gameStats.paddleDirection.mr == +1) gameStats.mr = 0;
			}
		}
	}
	
	private handlePauseScreen(event: KeyboardEvent): void {
		if (event.key == 'Escape') {
			this.handleEscapeAction();
		}
		if (event.key == 'Enter') {
			const msg = {
				"type": 5,
				"roomId": this._engine._roomID,
				"status": "cancelled"
			}
			console.log('Sending cancel match msg:', JSON.stringify(msg));
			this._engine._ws.sendMessage(JSON.stringify(msg));
			this._engine._gameStateMachine.transition(GameState.SELECT);
			this._engine.endGameLoop();
		}
	}
		
	private handleGameOverScreen(event: KeyboardEvent): void {
		if (event.key == 'Enter') {
			this._engine._gameStateMachine.transition(GameState.SELECT);
			this._engine.endGameLoop();
		}
	}

	private handlePreBattleScreen(event: KeyboardEvent): void {
		if (event.key == 'Enter') {
			const msg = {
				"type": 7,
				"roomId": this._engine._roomID,
				"_gameState": "ready"
			};
			const gameStateString = JSON.stringify(msg);
			this._engine._ws.sendMessage(gameStateString);
			this._engine._gameStateMachine.transition(GameState.GAME);
		}
	}

	private handleTournamentMiddle(event: KeyboardEvent): void {
		if (event.key == 'Enter') {
			this._engine.startRoundThree();
		}
	}

	private handleEscapeAction(): void {
		switch (this._engine._gameStateMachine.getCurrentState()) {
			case GameState.GAME:
				this._engine._gameStateMachine.transition(GameState.PAUSED);
				break;
			case GameState.PAUSED:
				this._engine._gameStateMachine.transition(GameState.GAME);
				break;
			case GameState.SELECT:
				this._engine._gameStateMachine.transition(GameState.OPPONENT);
				break;
			default:
				break;
		}
	}
}