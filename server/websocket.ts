import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http";
import { DatabaseStorage } from "./storage";
import { getCryptoById } from "./crypto-api";

// สร้าง storage instance
const storage = new DatabaseStorage();

let io: SocketIOServer | null = null;

export function setupWebSocket(server: HttpServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: "*", // ในการพัฒนา สำหรับ production ควรกำหนด origin ที่ชัดเจน
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // เมื่อผู้ใช้เข้าร่วม room สำหรับการเทรด
    socket.on('join-user-room', (userId) => {
      socket.join(`user-${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    // เมื่อผู้ใช้ออกจากระบบ
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  // เริ่มระบบ background processing สำหรับการเทรด
  startTradeBackgroundProcessor();

  return io;
}

export function getSocketIO(): SocketIOServer | null {
  return io;
}

// ฟังก์ชันสำหรับส่งข้อมูลการอัพเดทการเทรดไปยังผู้ใช้
export function notifyTradeUpdate(userId: number, trade: any) {
  if (io) {
    io.to(`user-${userId}`).emit('trade-update', trade);
    console.log(`Trade update sent to user ${userId}:`, trade.id);
  }
}

// ฟังก์ชันสำหรับส่งข้อมูลการอัพเดทยอดเงินไปยังผู้ใช้
export function notifyBalanceUpdate(userId: number, balance: string) {
  if (io) {
    io.to(`user-${userId}`).emit('balance-update', { balance });
    console.log(`Balance update sent to user ${userId}:`, balance);
  }
}

// Background processor สำหรับตรวจสอบและอัพเดทการเทรด
async function startTradeBackgroundProcessor() {
  console.log('Starting trade background processor...');
  
  // ตรวจสอบการเทรดทุก 5 วินาที
  setInterval(async () => {
    try {
      await processActiveTrades();
    } catch (error) {
      console.error('Error in trade background processor:', error);
    }
  }, 5000);
}

async function processActiveTrades() {
  try {
    // ดึงการเทรดที่ยังคง active
    const activeTrades = await storage.getActiveTrades();
    
    for (const trade of activeTrades) {
      const now = new Date();
      const tradeCreatedAt = new Date(trade.createdAt);
      const tradeEndTime = new Date(tradeCreatedAt.getTime() + (trade.duration * 1000));
      
      // ตรวจสอบว่าการเทรดหมดเวลาแล้วหรือยัง
      if (now >= tradeEndTime) {
        console.log(`Trade ${trade.id} has expired, processing...`);
        await completeTrade(trade);
      }
    }
  } catch (error) {
    console.error('Error processing active trades:', error);
  }
}

async function completeTrade(trade: any) {
  try {
    // ดึงข้อมูลราคาปัจจุบัน
    const cryptoData = await getCryptoById(trade.cryptoId);
    if (!cryptoData) {
      console.error(`Failed to get crypto data for ${trade.cryptoId}`);
      return;
    }

    const entryPrice = parseFloat(trade.entryPrice);
    const currentPrice = cryptoData.current_price;
    
    let result: 'win' | 'lose';
    
    // คำนวณผลลัพธ์ตามทิศทาง
    if (trade.direction === 'up') {
      result = currentPrice > entryPrice ? 'win' : 'lose';
    } else {
      result = currentPrice < entryPrice ? 'win' : 'lose';
    }

    console.log(`กำลังอัพเดทสถานะการเทรด ID: ${trade.id} เป็น completed ผลลัพธ์: ${result}`);

    // อัพเดทการเทรดในฐานข้อมูล
    const updatedTrade = await storage.updateTradeStatus(trade.id, 'completed', result);
    
    if (updatedTrade) {
      // คำนวณกำไร/ขาดทุนและอัพเดทยอดเงินผู้ใช้
      if (result === 'win') {
        const profit = parseFloat(trade.amount) * (parseFloat(trade.profitPercentage) / 100);
        const newBalance = await updateUserBalanceAfterTrade(trade.userId, parseFloat(trade.amount), profit);
        console.log(`การเทรดที่ชนะ: เงินลงทุน ${trade.amount}, กำไร ${profit}, ยอดเงินใหม่ ${newBalance}`);
        
        // ส่งการอัพเดทผ่าน WebSocket
        notifyBalanceUpdate(trade.userId, newBalance.toString());
      } else {
        console.log(`การเทรดที่แพ้: เงินลงทุน ${trade.amount} หายไป`);
      }

      // ส่งการอัพเดทการเทรดผ่าน WebSocket
      notifyTradeUpdate(trade.userId, updatedTrade);
    }
  } catch (error) {
    console.error(`Error completing trade ${trade.id}:`, error);
  }
}

async function updateUserBalanceAfterTrade(userId: number, investmentAmount: number, profit: number): Promise<number> {
  try {
    const currentBalance = await storage.getUserBalance(userId);
    const currentBalanceFloat = parseFloat(currentBalance);
    
    // เพิ่มเงินลงทุนกลับและเพิ่มกำไร
    const newBalance = currentBalanceFloat + investmentAmount + profit;
    
    await storage.updateUserBalance(userId, newBalance.toString());
    return newBalance;
  } catch (error) {
    console.error('Error updating user balance after trade:', error);
    throw error;
  }
}