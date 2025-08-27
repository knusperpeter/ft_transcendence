import { colours } from "./constants.ts";
import GameEngine from "./gameEngine.ts";
import { Player } from "./player.ts";
import { GameState } from "./types.ts";

export class PreBattleScreen {
	private _engine: GameEngine

	constructor(engine: GameEngine) {
		this._engine = engine;
	}
	
	public drawPreBattleScreen(name1: string, name2: string, message: string): void {
		this._engine._ctx.fillStyle = colours.background;
		this._engine._ctx.fillRect(0, 0, this._engine._canvas.width, this._engine._canvas.height);
		
		this._engine._ctx.font = '125px Arial';
		this._engine._ctx.fillStyle = colours.foregroundMain;
		this._engine._ctx.textAlign = 'center';
		this._engine._ctx.textBaseline = 'middle';
		
		this._engine._ctx.fillText(message, this._engine._canvas.width / 2, 150);
		
		this._engine._ctx.font = '100px Arial';
		this._engine._ctx.textAlign = "right";
		this._engine._ctx.fillText(name1, this._engine._canvas.width / 2, this._engine._canvas.height / 2 -  100);
		
		this._engine._ctx.font = '30px Arial';
		this._engine._ctx.textAlign = "center";
		this._engine._ctx.fillText('VS.', this._engine._canvas.width / 2, this._engine._canvas.height / 2);
		
		this._engine._ctx.font = '100px Arial';
		this._engine._ctx.textAlign = "left";
		this._engine._ctx.fillText(name2, this._engine._canvas.width / 2, this._engine._canvas.height / 2 + 100);
		
		
		this._engine._ctx.font = '50px Arial';
		this._engine._ctx.textAlign = "center";
		if (this._engine._gameStateMachine.getCurrentState() == GameState.PRE_BATTLE_SCREEN)
			this._engine._ctx.fillText('press ENTER to ready up', this._engine._canvas.width / 2, this._engine._canvas.height - 100);
		else
			this._engine._ctx.fillText('waiting for other players', this._engine._canvas.width / 2, this._engine._canvas.height - 100);
	}

	public drawWaitScreen(): void {
		this._engine._ctx.fillStyle = colours.background;
		this._engine._ctx.fillRect(0, 0, this._engine._canvas.width, this._engine._canvas.height);
		
		this._engine._ctx.font = '125px Arial';
		this._engine._ctx.fillStyle = colours.foregroundMain;
		this._engine._ctx.textAlign = 'center';
		this._engine._ctx.textBaseline = 'middle';
		
		this._engine._ctx.font = '50px Arial';
		this._engine._ctx.textAlign = "center";
		this._engine._ctx.fillText('waiting for other players', this._engine._canvas.width / 2, this._engine._canvas.height / 2);
	}

	public drawBrackets(p1: Player, p2: Player, p3: Player, p4: Player) {
		var message1: string;
		var message2: string;
		var message3: string;
		var message4: string;

		this._engine._ctx.fillStyle = colours.background;
		this._engine._ctx.fillRect(0, 0, this._engine._canvas.width, this._engine._canvas.height);

		this._engine._ctx.font = '150px Arial';
		this._engine._ctx.fillStyle = colours.foregroundMain;
		this._engine._ctx.textAlign = 'center';
		this._engine._ctx.textBaseline = 'middle';

		this._engine._ctx.fillText('Previous Results', this._engine._canvas.width / 2, 150);

		this._engine._ctx.font = '75px Arial';

		if (p1.getPosition() == 3) {
			message1 = p1.getName() + ": WINNER";
		}
		else {
			message1 = p1.getName() + ": LOSER";
		}

		if (p2.getPosition() == 3) {
			message2 = p2.getName() + ": WINNER";
		}
		else {
			message2 = p2.getName() + ": LOSER";
		}

		if (p3.getPosition() == 3) {
			message3 = p3.getName() + ": WINNER";
		}
		else {
			message3 = p3.getName() + ": LOSER";
		}

		if (p4.getPosition() == 3) {
			message4 = p4.getName() + ": WINNER";
		}
		else {
			message4 = p4.getName() + ": LOSER";
		}

		this._engine._ctx.fillText(message1, this._engine._canvas.width / 4, 350);
		this._engine._ctx.fillText(message2, (this._engine._canvas.width / 4) * 3, 450);
		this._engine._ctx.fillText(message3, this._engine._canvas.width / 4, this._engine._canvas.height - 350);
		this._engine._ctx.fillText(message4, (this._engine._canvas.width / 4) * 3, this._engine._canvas.height - 250);

		this._engine._ctx.font = '50px Arial';
		this._engine._ctx.textAlign = "center";
		this._engine._ctx.fillText('press ENTER to continue', this._engine._canvas.width / 2, this._engine._canvas.height - 100);
	}
}