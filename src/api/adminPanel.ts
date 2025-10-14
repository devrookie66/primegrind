import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { LinkModel } from '../models/Link';
import { UserModel } from '../models/User';

// Admin authentication middleware
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);
  
  if (token !== config.adminPassword) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  next();
}

// Get current config
export async function getConfig(req: Request, res: Response) {
  try {
    res.json({
      pointsPerVerifiedClick: config.pointsPerVerifiedClick,
      allowedLinkDomains: config.allowedLinkDomains,
      port: config.port,
      adminUsers: config.adminUsers,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get config' });
  }
}

// Update config
export async function updateConfig(req: Request, res: Response) {
  try {
    const { pointsPerVerifiedClick, allowedLinkDomains } = req.body;

    if (pointsPerVerifiedClick !== undefined) {
      const points = parseInt(pointsPerVerifiedClick, 10);
      if (!isNaN(points) && points > 0) {
        config.pointsPerVerifiedClick = points;
      }
    }

    if (allowedLinkDomains !== undefined && Array.isArray(allowedLinkDomains)) {
      config.allowedLinkDomains = allowedLinkDomains
        .map((d: string) => d.trim().toLowerCase())
        .filter(Boolean);
    }

    res.json({ 
      success: true, 
      config: {
        pointsPerVerifiedClick: config.pointsPerVerifiedClick,
        allowedLinkDomains: config.allowedLinkDomains,
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update config' });
  }
}

// Get system statistics
export async function getStatistics(req: Request, res: Response) {
  try {
    const totalLinks = await LinkModel.countDocuments();
    const activeLinks = await LinkModel.countDocuments({ budget: { $gt: 0 } });
    const totalUsers = await UserModel.countDocuments();
    
    const budgetAgg = await LinkModel.aggregate([
      { $group: { _id: null, totalBudget: { $sum: '$budget' } } }
    ]);
    const totalBudget = budgetAgg.length > 0 ? budgetAgg[0].totalBudget : 0;

    const pointsAgg = await UserModel.aggregate([
      { $group: { _id: null, totalPoints: { $sum: '$balance' } } }
    ]);
    const totalPoints = pointsAgg.length > 0 ? pointsAgg[0].totalPoints : 0;

    // Top links by budget
    const topLinks = await LinkModel.find({ budget: { $gt: 0 } })
      .sort({ budget: -1 })
      .limit(10)
      .select('url budget ownerUserId createdAt');

    // Top users by balance
    const topUsers = await UserModel.find()
      .sort({ balance: -1 })
      .limit(10)
      .select('userId balance');

    res.json({
      totalLinks,
      activeLinks,
      inactiveLinks: totalLinks - activeLinks,
      totalBudget,
      totalUsers,
      totalPoints,
      topLinks,
      topUsers,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get statistics' });
  }
}

// Get all links with pagination
export async function getAllLinks(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const links = await LinkModel.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('url budget ownerUserId visitors createdAt');

    const total = await LinkModel.countDocuments();

    res.json({
      links,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get links' });
  }
}

// Delete a link
export async function deleteLink(req: Request, res: Response) {
  try {
    const { linkId } = req.params;
    const result = await LinkModel.findByIdAndDelete(linkId);
    
    if (!result) {
      return res.status(404).json({ error: 'Link not found' });
    }

    res.json({ success: true, message: 'Link deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete link' });
  }
}

// Get all users with pagination
export async function getAllUsers(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const users = await UserModel.find()
      .sort({ balance: -1 })
      .skip(skip)
      .limit(limit)
      .select('userId balance');

    const total = await UserModel.countDocuments();

    res.json({
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get users' });
  }
}

// Update user balance
export async function updateUserBalance(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { balance } = req.body;

    if (balance === undefined || isNaN(balance)) {
      return res.status(400).json({ error: 'Invalid balance' });
    }

    const user = await UserModel.findOneAndUpdate(
      { userId },
      { balance: Math.max(0, parseInt(balance, 10)) },
      { upsert: true, new: true }
    );

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user balance' });
  }
}

