import { LinkModel } from '../models/Link';

export async function enqueueLink(ownerUserId: string, url: string, budget: number) {
  return LinkModel.create({ ownerUserId, url, budget });
}

export async function getNextLinkForUser(userId: string) {
  // Find a link with remaining budget that the user has not visited yet
  const link = await LinkModel.findOne({ budget: { $gt: 0 }, visitors: { $ne: userId } }).sort({ createdAt: 1 });
  return link;
}

export async function markVisited(linkId: string, userId: string) {
  return LinkModel.findByIdAndUpdate(
    linkId,
    { $inc: { budget: -1 }, $addToSet: { visitors: userId } },
    { new: true }
  );
}

export async function addBudget(linkId: string, amount: number) {
  return LinkModel.findByIdAndUpdate(linkId, { $inc: { budget: Math.max(0, amount) } }, { new: true });
}

export async function removeBudget(linkId: string, amount: number) {
  const link = await LinkModel.findByIdAndUpdate(linkId, { $inc: { budget: -Math.max(0, amount) } }, { new: true });
  if (link && link.budget < 0) {
    link.budget = 0;
    await link.save();
  }
  return link;
}


