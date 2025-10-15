import { LinkModel } from '../models/Link';
import crypto from 'crypto';

export async function enqueueLink(ownerUserId: string, url: string, budget: number) {
  return LinkModel.create({ ownerUserId, url, budget });
}

export async function getNextLinkForUser(userId: string) {
  // Find a link with remaining budget that the user has not visited yet
  const link = await LinkModel.findOne({ budget: { $gt: 0 }, visitors: { $ne: userId } }).sort({ createdAt: 1 });
  
  if (link) {
    // Kullanıcı için unique tracking token oluştur
    const token = crypto.randomBytes(32).toString('hex');
    
    // Click tracking bilgisini kaydet
    if (!link.clickTracking) {
      link.clickTracking = new Map();
    }
    
    link.clickTracking.set(userId, {
      token,
      clicked: false,
      clickedAt: undefined,
      verified: false,
      verifiedAt: undefined
    });
    
    await link.save();
  }
  
  return link;
}

export async function markClicked(linkId: string, userId: string, token: string) {
  // Link ID ve User ID ile doğrudan buluyoruz - çok daha hızlı!
  const link = await LinkModel.findById(linkId);
  
  if (!link || !link.clickTracking) return null;
  
  const tracking = link.clickTracking.get(userId);
  
  // Token doğrulaması
  if (!tracking || tracking.token !== token) {
    console.log(`Invalid token for user ${userId} on link ${linkId}`);
    return null;
  }
  
  // Daha önce tıklandı mı kontrol et
  if (tracking.clicked) {
    console.log(`User ${userId} already clicked link ${linkId}`);
    return { link, userId, targetUrl: link.url };
  }
  
  // Clicked durumunu güncelle
  link.clickTracking.set(userId, {
    ...tracking,
    clicked: true,
    clickedAt: new Date()
  });
  
  await link.save();
  return { link, userId, targetUrl: link.url };
}

export async function markVisited(linkId: string, userId: string) {
  const link = await LinkModel.findById(linkId);
  
  if (!link) return null;
  
  // Kullanıcının linke tıklayıp tıklamadığını kontrol et
  const tracking = link.clickTracking?.get(userId);
  
  if (!tracking || !tracking.clicked) {
    // Kullanıcı linke tıklamamış!
    console.log(`User ${userId} tried to verify without clicking link ${linkId}`);
    return null;
  }
  
  // Daha önce verify edilmiş mi kontrol et
  if (tracking.verified) {
    console.log(`User ${userId} already verified link ${linkId}`);
    return null;
  }
  
  // Verify işlemini kaydet
  link.clickTracking.set(userId, {
    ...tracking,
    verified: true,
    verifiedAt: new Date()
  });
  
  // Budget'ı azalt ve visitor olarak ekle
  link.budget = Math.max(0, link.budget - 1);
  if (!link.visitors.includes(userId)) {
    link.visitors.push(userId);
  }
  
  await link.save();
  return link;
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

// Kullanıcının kendi linklerini getir
export async function getUserLinks(userId: string, page: number = 0, limit: number = 10) {
  const skip = page * limit;
  
  const [links, total] = await Promise.all([
    LinkModel.find({ ownerUserId: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    LinkModel.countDocuments({ ownerUserId: userId })
  ]);
  
  return {
    links,
    total,
    page,
    hasMore: (skip + links.length) < total
  };
}


