// import { dbGet } from "../config/database.js";
import FriendService from "../services/friend.service.js";
import InvitationService from "./invitation.service.js";
import MatchMakingService from "./matchmaking.service.js";
import sleep from "../utils/sleep.utils.js";
import { log, DEBUG, INFO, WARN, ERROR } from '../utils/logger.utils.js';
import SessionService from '../services/session.service.js';

// const _matchMakingService = new MatchMakingService(this);

class WebsocketService {
	static WS_TIMEOUT_DISCONNECT = 5000;
	
	constructor(websocketServer) {
		log("[WebsocketService constructor]", DEBUG);
        this.websocketServer = websocketServer;
		this.matchMakingService = new MatchMakingService(this);
		this.invitationService = new InvitationService(this);

    }

/* <><><><><><><><><><><><><><><><><><><><><><><><> */

	handleJoin = async (connection, wsid, sessionId) => {
		connection.userId = wsid;
		connection.sessionId = sessionId;
		const valid = await SessionService.validateSession(wsid, sessionId);
		if (!valid) {
			try { connection.send(JSON.stringify({ type: 'SESSION_INVALID', sender: '__server', message: 'Session not active' })); } catch {}
			return connection.close();
		}
		for (let client of this.websocketServer.clients) {
			if (client === connection) continue;
			if (client.userId === wsid && client.sessionId !== sessionId && client.readyState === 1) {
				try { connection.send(JSON.stringify({ type: 'SESSION_CONFLICT', sender: '__server', message: 'Another active session exists' })); } catch {}
				return connection.close();
			}
		}
		log("[WebSocket] user connected " + connection.userId, INFO);
		this.broadcast({
			type: "BROADCAST",
			sender: '__server',
			message: `id ${wsid} joined`
		}, connection);
		this.matchMakingService.reconnectPlayerToAllRooms(connection);
	}
	
	handleLeave(connection) {
		connection.on('close', async () => {
			log("[WebSocket] user disconnected " + connection.userId);
			this.broadcast({
				type: "BROADCAST",
				sender: '__server',
				message: `id ${connection.userId} left`
			});
			await sleep (WebsocketService.WS_TIMEOUT_DISCONNECT);
			this.matchMakingService.disconnectPlayerFromAllRooms(connection);
		});
	}

	handleMessage(connection) {
		connection.on('message', async message => {
			try {
				const parsedMessage = JSON.parse(message);

				// Validate required fields
				if (!parsedMessage.type || typeof parsedMessage.type !== 'number') {
					throw new Error ("Parsing: Invalid message: 'type' field is missing or not a number");
				}

				if (parsedMessage.type === 1) {
					log("[handleMessage] type 1: message", DEBUG)
					if (!parsedMessage.message) {
						throw new Error ("Parsing: Invalid message: 'message' field is missing or empty");
					}
					this.broadcast({
						type: "BROADCAST",
						sender: `${connection.userId}`,
						message: `${parsedMessage.message}`
					}, connection);
				}
				else if (parsedMessage.type === 2) {
					log("[handleMessage] type 2: online friend status", DEBUG);
					this.onlineFriends(connection);
				}
				else if (parsedMessage.type === 3) {
					log("[handleMessage] type 3: match invitation", DEBUG);
					if (!parsedMessage.players || !parsedMessage.gameMode || !parsedMessage.oppMode) {
						throw new Error ("Parsing: Invalid message: 'players', 'matchType' or 'oppMode' field is missing or empty");
					}
					this.matchMakingService.matchMakingInit(connection, parsedMessage);
				}
				else if (parsedMessage.type === 4) {
					log("[handleMessage] type 4: accept match invitation", DEBUG);
					if (!parsedMessage.roomId || !parsedMessage.acceptance) {
						throw new Error ("Parsing: Invalid message: 'roomId' or 'acceptance' field is missing or empty");
					}
					// this.matchMakingService.matchMakingInit(connection, parsedMessage);
					this.invitationService.matchMakingAcceptInvitation(connection, parsedMessage);
				}
				else if (parsedMessage.type === 5) {
					log("[handleMessage] type 5: cancel or finish match (without saving to database)", DEBUG);
					if (!parsedMessage.roomId || !parsedMessage.status) {
						throw new Error ("Parsing: Invalid message: 'roomId' or 'status' field is missing or empty");
					}
					this.matchMakingService.cancelMatch(connection, parsedMessage);
				}
				else if (parsedMessage.type === 6) {
					log("[handleMessage] type 6: finish match, saving to database", DEBUG);
					if (!parsedMessage.roomId || !parsedMessage.players) {
						throw new Error ("Parsing: Invalid message: 'roomId' or 'players' field is missing or empty");
					}
					this.matchMakingService.saveFinishMatch(connection, parsedMessage);
				}
				else if (parsedMessage.type === 7) {
					// log("[handleMessage] type 7: remote game messaging", DEBUG);
					if (!parsedMessage.roomId || !parsedMessage._gameState) {
						throw new Error ("Parsing: Invalid message: 'roomId' or 'gameState' field is missing or empty");
					}
					this.matchMakingService.remoteMessageForwarding(parsedMessage.roomId, parsedMessage._gameState, connection);
				}
				else {
					log("[handleMessage] unknown type", WARN);
				}
			} catch (error) {
				log("Error occurring in WebsocketService: " + error.message, ERROR);
				await this.sendMessageToClient(connection, {
					type: "ERROR",
					sender: "__server",
					message: `Error occurring in WebsocketService: ${error.message}`
				});
			}
		});
	}



/* <><><><><><><><><><><><><><><><><><><><><><><><> */

	async onlineFriends(connection) {
		const onlineFriends = [];
		const friendslist = [];
		const friendIds = [];

		try {
			friendslist.push( await FriendService.getAllFriendshipsUserId(connection.userId));
		} catch (error) {
			log("DB ERROR: " + error.message, WARN);
		}
		
		const flatFriendslist = friendslist.flat();
		flatFriendslist.forEach(friend => {
			if (friend.initiator_id !== connection.userId) {
				friendIds.push(friend.initiator_id);
			}
			else {
				friendIds.push(friend.recipient_id);
			}
		});
		
		for (let client of this.websocketServer.clients) {
			if (client.readyState !== 1 || connection.userId === client.userId) {
				continue ;
			}
			if (friendIds.includes(client.userId)) {
				onlineFriends.push({
					userId: client.userId
				});
			}
		}
		connection.send(JSON.stringify({ onlineFriends }));
	}

/* <><><><><><><><><><><><><><><><><><><><><><><><> */

	async getWsClientById(id) {
		for (let client of this.websocketServer.clients) {
			if (client.userId === id) {
				return (client);
			}
		}
		return (null);
	}

	async sendMessageToClient(client, message) {
		if (!client) {
			log("Don't send undefined clients to sendMessageToClient function :(", WARN);
			return ;
		}
		if (!message) {
			log("Don't send undefined message to sendMessageToClient function :(", WARN);
			return ;
		}
		client.send(JSON.stringify(message));
	}

	broadcast(message, excludeConnection = null) {
        for (let client of this.websocketServer.clients) {
			if (client.readyState === 1 && client !== excludeConnection) {
                client.send(JSON.stringify(message));
            }
        }
    }


	createErrorMessage(message) {
		const msg = {
			type: "ERROR",
			sender: "__server",
			message: `${message}`
		};
		return msg;
	}

}

export default WebsocketService;