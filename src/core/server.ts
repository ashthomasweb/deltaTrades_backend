import WebSocket, { WebSocketServer as WSS } from "ws";
import { EventBus } from "./eventBus";
import { HistoricalService } from "./historical";

export class WebSocketServer {
	private wss: WSS;

	constructor(private bus: EventBus) {
		this.wss = new WSS({ port: 8080 });

		this.wss.on("connection", (ws: WebSocket) => {
			ws.send(JSON.stringify({ msg: "Established" }));
			this.bus.on("price:update", (data) =>
				ws.send(JSON.stringify({ type: "price", data }))
			);
			// this.bus.on('historical:data', data => ws.send(JSON.stringify({ type: 'historical', data })));

			ws.on("message", (message) => {
        console.log('recieved msg')
				try {
					const parsed = JSON.parse(message.toString());
					if (parsed.type === "getHistorical") {
						// You could store last-known data or trigger a fetch
						const mockHistoricalData = [
							{ symbol: "SPY", prices: [430, 432, 435, 437] },
						];
						ws.send(
							JSON.stringify({
								type: "historical",
								data: mockHistoricalData,
							})
						);
            // HistoricalService.fetchInitialData()
					}
				} catch (err) {
					console.error("Error handling WS message:", err);
				}
			});

		});
	}
}
