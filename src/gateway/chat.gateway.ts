import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { ChatService } from "src/chat/chat.service";

interface dataDto {
  chatId: string;
  destinationId: string;
  message: string;
}

@WebSocketGateway(3007, {
  cors: {
    origin: "*",
  },
})
export class ChatGateway {
  constructor(private readonly chatService: ChatService) {}

  @WebSocketServer() server: Server;
  userSocketMap: Map<string, string> = new Map();
  socketUserMap: Map<string, string> = new Map();

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;

    if (!userId) {
      console.log(
        `Client ${client.id} connected without userId. Disconnecting.`,
      );
      client.disconnect();
      return;
    }

    console.log(`Client connected: ${client.id} with userId: ${userId}`);
    this.userSocketMap.set(userId, client.id);
    this.socketUserMap.set(client.id, userId);
    console.log(`Users count connected: ${this.userSocketMap.size}`);
  }

  @SubscribeMessage("chat")
  async handleEvent(
    @MessageBody() data: dataDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const userSenderId = this.socketUserMap.get(client.id);

    if (!userSenderId) {
      console.error(`Could not find user for socket ${client.id}`);
      return;
    }

    await this.chatService.sendMessage(data.chatId, userSenderId, data.message);
    console.log("Message saved in DB");

    const socketDestinationId = this.userSocketMap.get(data.destinationId);
    if (socketDestinationId) {
      this.server.to(socketDestinationId).emit("chat", {
        senderId: userSenderId,
        message: data.message,
        timestamp: new Date(),
      });
      console.log(`Message sent to user ${data.destinationId}`);
    } else {
      console.log(`User ${data.destinationId} is offline. Message saved.`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.socketUserMap.get(client.id);

    if (userId) {
      this.userSocketMap.delete(userId);
      this.socketUserMap.delete(client.id);
      console.log(`Client disconnected: ${client.id} (userId: ${userId})`);
    } else {
      console.log(`Client disconnected: ${client.id} (userId not founded)`);
    }

    console.log(`Users count connected: ${this.userSocketMap.size}`);
  }
}
