import { UserModel } from '../models/User';
import { LinkModel } from '../models/Link';

const ADMIN_USER_ID = '175694554501087232';
const ADMIN_CHANNEL_ID = '1428065314221850735';

export function isAdmin(userId: string): boolean {
  return userId === ADMIN_USER_ID;
}

export function isAdminChannel(channelId: string): boolean {
  return channelId === ADMIN_CHANNEL_ID;
}

export async function getSystemStats() {
  const [totalUsers, totalLinks, activeLinks, totalPoints] = await Promise.all([
    UserModel.countDocuments(),
    LinkModel.countDocuments(),
    LinkModel.countDocuments({ budget: { $gt: 0 } }),
    UserModel.aggregate([{ $group: { _id: null, total: { $sum: '$balance' } } }])
  ]);

  return {
    totalUsers,
    totalLinks,
    activeLinks,
    totalPoints: totalPoints[0]?.total || 0
  };
}

export async function getAllUsers(page = 0, limit = 10) {
  const users = await UserModel.find()
    .sort({ balance: -1 })
    .skip(page * limit)
    .limit(limit);
  
  const total = await UserModel.countDocuments();
  
  return {
    users: users.map(u => ({
      userId: u.userId,
      balance: u.balance,
      visitedCount: u.visitedLinkIds?.length || 0,
      createdAt: u.createdAt
    })),
    total,
    page,
    hasMore: (page + 1) * limit < total
  };
}

export async function getAllLinks(page = 0, limit = 10) {
  const links = await LinkModel.find()
    .sort({ createdAt: -1 })
    .skip(page * limit)
    .limit(limit);
  
  const total = await LinkModel.countDocuments();
  
  return {
    links: links.map(l => ({
      id: l._id.toString(),
      url: l.url,
      ownerUserId: l.ownerUserId,
      budget: l.budget,
      visitorsCount: l.visitors?.length || 0,
      createdAt: l.createdAt
    })),
    total,
    page,
    hasMore: (page + 1) * limit < total
  };
}

export async function setUserBalance(userId: string, amount: number) {
  const user = await UserModel.findOneAndUpdate(
    { userId },
    { balance: Math.max(0, amount) },
    { upsert: true, new: true }
  );
  return user.balance;
}

export async function deleteLink(linkId: string) {
  const result = await LinkModel.findByIdAndDelete(linkId);
  return !!result;
}

export async function deleteLinksByUser(userId: string) {
  const result = await LinkModel.deleteMany({ ownerUserId: userId });
  return result.deletedCount || 0;
}

export async function getUserInfo(userId: string) {
  const user = await UserModel.findOne({ userId });
  if (!user) return null;

  const ownedLinks = await LinkModel.find({ ownerUserId: userId });
  
  return {
    userId: user.userId,
    balance: user.balance,
    visitedCount: user.visitedLinkIds?.length || 0,
    ownedLinksCount: ownedLinks.length,
    activeBudget: ownedLinks.reduce((sum, l) => sum + l.budget, 0),
    createdAt: user.createdAt
  };
}

export async function getLinkInfo(linkId: string) {
  const link = await LinkModel.findById(linkId);
  if (!link) return null;

  return {
    id: link._id.toString(),
    url: link.url,
    ownerUserId: link.ownerUserId,
    budget: link.budget,
    visitors: link.visitors || [],
    visitorsCount: link.visitors?.length || 0,
    createdAt: link.createdAt,
    updatedAt: link.updatedAt
  };
}

