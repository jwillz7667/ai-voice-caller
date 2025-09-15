import { WebSocket } from 'ws';
import { parse } from 'url';
import { AuthService } from './lib/auth';
import { UserService } from './services/userService';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  isAuthenticated?: boolean;
  tokenBalance?: number;
  sessionId?: string;
}

export async function authenticateWebSocketConnection(
  ws: AuthenticatedWebSocket,
  request: any
): Promise<boolean> {
  try {
    const { query } = parse(request.url || '', true);
    const token = query.token as string;

    if (!token) {
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Authentication required'
      }));
      ws.close(1008, 'Authentication required');
      return false;
    }

    try {
      const payload = AuthService.verifyAccessToken(token);
      ws.userId = payload.sub;
      ws.isAuthenticated = true;
      ws.tokenBalance = payload.tokenBalance;

      // Send authentication success
      ws.send(JSON.stringify({
        type: 'auth_success',
        userId: payload.sub,
        tokenBalance: payload.tokenBalance
      }));

      return true;
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Invalid or expired token'
      }));
      ws.close(1008, 'Invalid token');
      return false;
    }
  } catch (error) {
    console.error('WebSocket authentication error:', error);
    ws.close(1011, 'Authentication error');
    return false;
  }
}

export async function checkAndDeductTokens(
  ws: AuthenticatedWebSocket,
  sessionId: string,
  tokensRequired: number = 1
): Promise<boolean> {
  if (!ws.userId) {
    ws.send(JSON.stringify({
      type: 'error',
      error: 'Not authenticated'
    }));
    return false;
  }

  try {
    const user = await UserService.getUserById(ws.userId);

    if (!user) {
      ws.send(JSON.stringify({
        type: 'error',
        error: 'User not found'
      }));
      return false;
    }

    if (user.tokenBalance < tokensRequired) {
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Insufficient tokens',
        tokenBalance: user.tokenBalance,
        required: tokensRequired
      }));
      return false;
    }

    // Deduct tokens for the call
    const newBalance = await UserService.deductTokens(
      ws.userId,
      tokensRequired,
      `Voice call session ${sessionId}`,
      sessionId
    );

    ws.tokenBalance = newBalance;

    // Notify client of new balance
    ws.send(JSON.stringify({
      type: 'token_deducted',
      amount: tokensRequired,
      newBalance,
      sessionId
    }));

    return true;
  } catch (error) {
    console.error('Token deduction error:', error);
    ws.send(JSON.stringify({
      type: 'error',
      error: 'Failed to process tokens'
    }));
    return false;
  }
}

export async function refundTokens(
  userId: string,
  amount: number,
  sessionId: string,
  reason: string
): Promise<void> {
  try {
    await UserService.addTokens(
      userId,
      amount,
      'REFUND' as any,
      `Refund for session ${sessionId}: ${reason}`,
      undefined,
      undefined
    );
  } catch (error) {
    console.error('Token refund error:', error);
  }
}

export function setupWebSocketHeartbeat(ws: AuthenticatedWebSocket): void {
  let isAlive = true;

  ws.on('pong', () => {
    isAlive = true;
  });

  const interval = setInterval(() => {
    if (!isAlive) {
      ws.terminate();
      return;
    }

    isAlive = false;
    ws.ping();
  }, 30000); // 30 seconds

  ws.on('close', () => {
    clearInterval(interval);
  });
}

export async function handleWebSocketMessage(
  ws: AuthenticatedWebSocket,
  message: string
): Promise<void> {
  try {
    const data = JSON.parse(message);

    switch (data.type) {
      case 'start_call':
        if (!await checkAndDeductTokens(ws, data.sessionId, 10)) {
          return;
        }
        // Continue with call initiation
        break;

      case 'check_balance':
        if (ws.userId) {
          const user = await UserService.getUserById(ws.userId);
          ws.send(JSON.stringify({
            type: 'balance_update',
            tokenBalance: user?.tokenBalance || 0
          }));
        }
        break;

      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;

      default:
        // Handle other message types
        break;
    }
  } catch (error) {
    console.error('Message handling error:', error);
    ws.send(JSON.stringify({
      type: 'error',
      error: 'Invalid message format'
    }));
  }
}

export function broadcastToUser(
  userId: string,
  message: any,
  wss: any
): void {
  wss.clients.forEach((client: AuthenticatedWebSocket) => {
    if (client.userId === userId && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}