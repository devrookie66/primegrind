import { UserModel } from '../models/User';

export async function addPoints(userId: string, amount: number): Promise<number> {
  const user = await UserModel.findOneAndUpdate(
    { userId },
    { $inc: { balance: Math.max(0, amount) } },
    { upsert: true, new: true }
  );
  return user.balance;
}

export async function removePoints(userId: string, amount: number): Promise<number> {
  const user = await UserModel.findOneAndUpdate(
    { userId },
    { $inc: { balance: -Math.max(0, amount) } },
    { upsert: true, new: true }
  );
  if (user.balance < 0) {
    user.balance = 0;
    await user.save();
  }
  return user.balance;
}

export async function getUserBalance(userId: string): Promise<number> {
  const user = await UserModel.findOne({ userId });
  return user?.balance ?? 0;
}


