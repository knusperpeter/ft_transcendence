import { BALL_RADIUS, EXTRA_PADDLE_DISTANCE_FROM_BORDER, EXTRA_PADDLE_HEIGHT, EXTRA_PADDLE_WIDTH, PADDLE_DISTANCE_FROM_BORDER, PADDLE_HEIGHT, PADDLE_WIDTH, colours } from './constants.ts';
import { PongGame } from './pongGame.ts';
import { GameMode } from './types.ts';

export class RenderEngine {
	private _pongGame: PongGame

	constructor(game: PongGame) {
		this._pongGame = game;
	}

	public renderFrame(): void {
		this._pongGame._engine._ctx.clearRect(0, 0, this._pongGame._engine._canvas.width, this._pongGame._engine._canvas.height);
		this._pongGame._engine._ctx.fillStyle = colours.background;
		this._pongGame._engine._ctx.fillRect(0, 0, this._pongGame._engine._canvas.width, this._pongGame._engine._canvas.height);

		this.drawCenterLine();
		this.drawBall();
		this.drawPaddles();
		if (this._pongGame._mode == GameMode.TEAMS) {
			this.drawExtraPaddles()
		}
		this.drawScore();
		this.drawNames();
	}

	private drawBall(): void {
		const { x, y } = this._pongGame._gameStats.ballPosition;
		const ballRadius = BALL_RADIUS;

		this._pongGame._engine._ctx.beginPath();
		this._pongGame._engine._ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
		this._pongGame._engine._ctx.fillStyle = colours.ball;
		this._pongGame._engine._ctx.fill();
		this._pongGame._engine._ctx.closePath();
	}

	private drawPaddles(): void {
		const paddleWidth = PADDLE_WIDTH;
		const paddleHeight = PADDLE_HEIGHT;

		this._pongGame._engine._ctx.fillStyle = colours.paddle;
		this._pongGame._engine._ctx.fillRect(
			PADDLE_DISTANCE_FROM_BORDER,
			this._pongGame._gameStats.paddlePositions.left,
			paddleWidth,
			paddleHeight
		);
		this._pongGame._engine._ctx.fillRect(
			this._pongGame._engine._canvas.width - paddleWidth - PADDLE_DISTANCE_FROM_BORDER,
			this._pongGame._gameStats.paddlePositions.right,
			paddleWidth,
			paddleHeight
		);
	}

	private drawExtraPaddles(): void {
		const paddleWidth = EXTRA_PADDLE_WIDTH;
		const paddleHeight = EXTRA_PADDLE_HEIGHT;

		this._pongGame._engine._ctx.fillStyle = colours.paddle;
		this._pongGame._engine._ctx.fillRect(
			EXTRA_PADDLE_DISTANCE_FROM_BORDER,
			this._pongGame._gameStats.paddlePositions.ml,
			paddleWidth,
			paddleHeight
		);
		this._pongGame._engine._ctx.fillRect(
			this._pongGame._engine._canvas.width - paddleWidth - EXTRA_PADDLE_DISTANCE_FROM_BORDER,
			this._pongGame._gameStats.paddlePositions.mr,
			paddleWidth,
			paddleHeight
		);
	}

	private drawScore(): void {
		this._pongGame._engine._ctx.font = '75px Arial';
		this._pongGame._engine._ctx.fillStyle = colours.foregroundMain;
		
		this._pongGame._engine._ctx.fillText(
			this._pongGame._gameStats.scores.left.toString(),
			(this._pongGame._engine._canvas.width / 2)- 20 - 250,
			85
		);
		this._pongGame._engine._ctx.fillText(
			this._pongGame._gameStats.scores.right.toString(),
			(this._pongGame._engine._canvas.width / 2) - 20 + 250,
			85
		);
	}

	private drawNames(): void {
		this._pongGame._engine._ctx.font = '50px Arial';
		this._pongGame._engine._ctx.fillStyle = colours.foregroundMain;

		if (this._pongGame._mode == GameMode.TEAMS) {
			
			this._pongGame._engine._ctx.fillText(
				this._pongGame._p1.getName() + "s team",
				75,
				75
			);
			this._pongGame._engine._ctx.textAlign = 'right';
			this._pongGame._engine._ctx.fillText(
				this._pongGame._p2.getName() + "s team",
				this._pongGame._engine._canvas.width - 75,
				75
			);
			this._pongGame._engine._ctx.textAlign = 'left';
		}
		else {
			this._pongGame._engine._ctx.fillText(
				this._pongGame._p1.getName(),
				75,
				75
			);
			this._pongGame._engine._ctx.textAlign = 'right';
			this._pongGame._engine._ctx.fillText(
				this._pongGame._p2.getName(),
				this._pongGame._engine._canvas.width - 75,
				75
			);
			this._pongGame._engine._ctx.textAlign = 'left';
		}
	}

	private drawCenterLine(): void {
		this._pongGame._engine._ctx.strokeStyle = colours.foregroundSubtle;
		this._pongGame._engine._ctx.lineWidth = 4;

		this._pongGame._engine._ctx.beginPath();
		this._pongGame._engine._ctx.moveTo(this._pongGame._engine._canvas.width / 2, 0);
		this._pongGame._engine._ctx.lineTo(this._pongGame._engine._canvas.width / 2, this._pongGame._engine._canvas.height);
		this._pongGame._engine._ctx.stroke();

		this._pongGame._engine._ctx.setLineDash([10, 10]);
		this._pongGame._engine._ctx.stroke();

		// this._pongGame._engine._ctx.setLineDash([]);
	}
}