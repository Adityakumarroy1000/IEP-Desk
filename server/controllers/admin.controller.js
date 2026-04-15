import User from "../models/User.js";
import Analysis from "../models/Analysis.js";
import Profile from "../models/Profile.js";

export async function getStats(req, res) {
  const totalUsers = await User.countDocuments();
  const totalAnalyses = await Analysis.countDocuments();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaySignups = await User.countDocuments({ createdAt: { $gte: today } });

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const activeThisWeek = await User.countDocuments({ lastActive: { $gte: weekAgo } });

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const signups = await User.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);

  const signupsByDay = signups.map((s) => ({ date: s._id, count: s.count }));
  const recentUsers = await User.find().sort({ createdAt: -1 }).limit(10);

  res.json({
    totalUsers,
    totalAnalyses,
    todaySignups,
    activeThisWeek,
    signupsByDay,
    recentUsers
  });
}

export async function getUsers(req, res) {
  const search = req.query.search || "";
  const query = search
    ? { $or: [{ name: new RegExp(search, "i") }, { email: new RegExp(search, "i") }] }
    : {};
  const users = await User.find(query).sort({ createdAt: -1 }).limit(100);
  res.json(users);
}

export async function updateUser(req, res) {
  const { role, plan } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { role, plan }, { new: true });
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
}

export async function deleteUser(req, res) {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  await Profile.deleteMany({ userId: user._id });
  await Analysis.deleteMany({ userId: user._id });
  res.json({ message: "Deleted" });
}

export async function getAnalyses(req, res) {
  const analyses = await Analysis.find().sort({ createdAt: -1 }).limit(200);
  const results = [];
  for (const analysis of analyses) {
    const user = await User.findById(analysis.userId);
    const profile = await Profile.findById(analysis.profileId);
    results.push({
      _id: analysis._id,
      userEmail: user?.email,
      childName: profile?.childName,
      state: profile?.state,
      overallScore: analysis.result?.overallScore?.score,
      createdAt: analysis.createdAt
    });
  }
  res.json(results);
}
