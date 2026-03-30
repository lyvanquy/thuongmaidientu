import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket, MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private chatService: ChatService) {}

  handleConnection(client: Socket) {
    console.log(`Chat connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Chat disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_chat')
  handleJoin(@ConnectedSocket() client: Socket, @MessageBody() data: { chatId: string }) {
    client.join(`chat:${data.chatId}`);
    return { event: 'joined', data: { chatId: data.chatId } };
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; senderId: string; content: string; type?: string },
  ) {
    const message = await this.chatService.createMessage(
      data.chatId, data.senderId, data.content, data.type,
    );
    this.server.to(`chat:${data.chatId}`).emit('receive_message', message);
    return message;
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; userId: string; isTyping: boolean },
  ) {
    client.to(`chat:${data.chatId}`).emit('typing', data);
  }
}
