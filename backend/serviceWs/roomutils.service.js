import { log, DEBUG, INFO, WARN, ERROR } from '../utils/logger.utils.js';

class RoomUtilsService {
	static async getAllAcceptedPlayerNicksRoom(room) {
		const playerNicksRoom = [];
		for (let player of room.players) {
			if (player.ai == false && player.accepted === "accepted")
				{
					playerNicksRoom.push(player.nick);
				}
		}
		return (playerNicksRoom);
	}
	
	static async getAllPendingPlayerNicksRoom(room) {
		const playerNicksRoom = [];
		for (let player of room.players) {
			if (player.ai == false && player.accepted === "pending")
				{
					playerNicksRoom.push(player.nick);
				}
		}
		return (playerNicksRoom);
	}



	static async playersBusy(rooms, players) {
		for (let room of rooms) {
			const playerNicks = await this.getAllAcceptedPlayerNicksRoom(room);
			for (let player of players) {
				if (player.ai === true) {
					continue ;
				}
				if (playerNicks.includes(player.nick)) {
					return true; // Player is busy
				}
			}
		}
		return false; // No players are busy
	}


	static roomExists(rooms, roomId) {
		for (let r of rooms) {
			if (r.id == roomId) {
				return (r);
			}
		}
		return (null);
	}

	static async isPlayerInvited(room, connection) {
		let areUEvenInvitedBro = false;
		for (let p of room.players) {
			if (p.ai == true) {
				continue ;
			}
			if (p.id == connection.userId) {
				areUEvenInvitedBro = true;
				break;
			}
		}
		return (areUEvenInvitedBro);
	}

	static async setPlayerAcceptance(room, playerId, acceptance) {

		for (let p of room.players) {
			if (p.ai === true) {
				continue ;
			}
			if (p.wsclient.userId === playerId) {
				if (acceptance == "accept" || acceptance == "accepted" || acceptance == "accepts") {
					p.accepted = "accepted";
				}
				else {
					p.accepted = "declined";
				}
			}
		}
	}


	static async sendMessageToAllPlayers(websocketService, room, message, connection = null) {
    // log("[RoomUtils] sendMessageToAllPlayers", DEBUG);

		for (let p of room.players) {
			if (p.ai == true) {
				continue ;
			}
			if (p.accepted != "declined" && p.wsclient !== null && p.wsclient !== connection) {
				await websocketService.sendMessageToClient(p.wsclient, message);
			}
		}
	}


	// this method updates the wsclient inside the room.players array after user has reconnected
	static reconnectPlayerToRoom(room, connection) {
		for (let p of room.players) {
			if (p.id === connection.userId) {
				p.wsclient = connection;
				log(`[reconnectPlayerToRoom] reconnected user ${p.id} to room ${room.id}`, DEBUG);
				return ;
			}
		}
	}
}

export default RoomUtilsService;
