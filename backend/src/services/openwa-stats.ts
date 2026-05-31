import { connectDB } from "../config/connection.js";
import { Session } from "../models/openwa.js";
import { Message } from "../models/openwa.js";

class OpenWAStatsService {
  async getOverview(organizationId: string) {
    await connectDB();
    const sessions = await Session.find({ organizationId }).lean();
    const byStatus: Record<string, number> = {};
    let active = 0;
    for (const s of sessions) {
      byStatus[s.status] = (byStatus[s.status] || 0) + 1;
      if (s.status === "ready") active++;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const msgAgg = await Message.aggregate([
      { $match: { organizationId } },
      { $group: { _id: "$direction", count: { $sum: 1 } } },
    ]);
    const todayAgg = await Message.aggregate([
      { $match: { organizationId, createdAt: { $gte: todayStart.toISOString() } } },
      { $group: { _id: "$direction", count: { $sum: 1 } } },
    ]);

    const getCount = (agg: any[], dir: string) => parseInt(agg.find((a: any) => a._id === dir)?.count || "0");
    return {
      sessions: { active, total: sessions.length, byStatus },
      messages: {
        sent: getCount(msgAgg, "outgoing"),
        received: getCount(msgAgg, "incoming"),
        failed: await Message.countDocuments({ organizationId, status: "failed" }),
        today: { sent: getCount(todayAgg, "outgoing"), received: getCount(todayAgg, "incoming") },
      },
    };
  }

  async getMessageStats(organizationId: string, period: "24h" | "7d" | "30d" = "24h") {
    await connectDB();
    const now = Date.now();
    const since = new Date(now - (period === "24h" ? 86400000 : period === "7d" ? 604800000 : 2592000000));

    const timeSeries = await Message.aggregate([
      { $match: { organizationId, createdAt: { $gte: since.toISOString() } } },
      { $group: { _id: { $dateToString: { format: period === "24h" ? "%Y-%m-%dT%H:00:00" : "%Y-%m-%d", date: { $toDate: { $toLong: "$createdAt" } } } }, sent: { $sum: { $cond: [{ $eq: ["$direction", "outgoing"] }, 1, 0] } }, received: { $sum: { $cond: [{ $eq: ["$direction", "incoming"] }, 1, 0] } } } },
      { $sort: { _id: 1 } },
    ]);

    const byType = await Message.aggregate([
      { $match: { organizationId, createdAt: { $gte: since.toISOString() } } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]);

    const bySession = await Message.aggregate([
      { $match: { organizationId, createdAt: { $gte: since.toISOString() } } },
      { $group: { _id: { sessionId: "$sessionId", direction: "$direction" }, count: { $sum: 1 } } },
    ]);

    const topChats = await Message.aggregate([
      { $match: { organizationId, createdAt: { $gte: since.toISOString() } } },
      { $group: { _id: "$chatId", messageCount: { $sum: 1 } } },
      { $sort: { messageCount: -1 } },
      { $limit: 10 },
    ]);

    const sessionNames = new Map((await Session.find({ organizationId }).lean()).map(s => [s._id, s.name]));
    const sessionMap = new Map<string, { sent: number; received: number }>();
    for (const row of bySession) {
      const sid = row._id.sessionId;
      if (!sessionMap.has(sid)) sessionMap.set(sid, { sent: 0, received: 0 });
      const entry = sessionMap.get(sid)!;
      if (row._id.direction === "outgoing") entry.sent = row.count;
      else entry.received = row.count;
    }

    return {
      timeSeries: timeSeries.map(r => ({ timestamp: r._id, sent: r.sent, received: r.received })),
      byType: Object.fromEntries(byType.map(r => [r._id, r.count])),
      bySession: Array.from(sessionMap.entries()).map(([sessionId, stats]) => ({ sessionId, name: sessionNames.get(sessionId) || "Unknown", ...stats })),
      topChats: topChats.map(c => ({ chatId: c._id, messageCount: c.messageCount })),
    };
  }

  async getSessionStats(organizationId: string, sessionId: string) {
    await connectDB();
    const session = await Session.findOne({ _id: sessionId, organizationId }).lean() as any;
    if (!session) throw new Error("Session not found");

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const stats = await Message.aggregate([
      { $match: { organizationId, sessionId } },
      { $group: { _id: "$direction", count: { $sum: 1 } } },
    ]);
    const todayCount = await Message.countDocuments({ organizationId, sessionId, createdAt: { $gte: todayStart.toISOString() } });
    const failed = await Message.countDocuments({ organizationId, sessionId, status: "failed" });

    const topChats = await Message.aggregate([
      { $match: { organizationId, sessionId } },
      { $group: { _id: "$chatId", count: { $sum: 1 }, lastActive: { $max: "$createdAt" } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    return {
      session: { id: session._id, name: session.name, status: session.status },
      messages: {
        sent: parseInt(stats.find(s => s._id === "outgoing")?.count || "0"),
        received: parseInt(stats.find(s => s._id === "incoming")?.count || "0"),
        today: todayCount,
        failed,
      },
      topChats: topChats.map(c => ({ chatId: c._id, count: c.count, lastActive: c.lastActive })),
    };
  }
}

export const openwaStats = new OpenWAStatsService();
