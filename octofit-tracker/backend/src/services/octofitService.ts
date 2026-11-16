import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function badRequest(message: string) {
  const error = new Error(message) as Error & { status?: number };
  error.status = 400;
  return error;
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw badRequest('Activity payload must be an object');
  }

  const payload = input as Record<string, unknown>;
  const { userId, teamId, type, minutes } = payload;

  if (typeof userId !== 'string' || !mongoose.isValidObjectId(userId)) {
    throw badRequest('userId must be a valid ObjectId');
  }

  if (typeof teamId !== 'string' || !mongoose.isValidObjectId(teamId)) {
    throw badRequest('teamId must be a valid ObjectId');
  }

  if (typeof type !== 'string' || type.trim().length === 0) {
    throw badRequest('type is required');
  }

  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw badRequest('minutes must be a positive number');
  }

  const userExists = await User.exists({ _id: userId });
  if (!userExists) {
    const error = new Error('User not found') as Error & { status?: number };
    error.status = 404;
    throw error;
  }

  const teamExists = await Team.exists({ _id: teamId });
  if (!teamExists) {
    const error = new Error('Team not found') as Error & { status?: number };
    error.status = 404;
    throw error;
  }

  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw badRequest('Team payload must be an object');
  }

  const payload = input as Record<string, unknown>;
  const { name, mascot, members } = payload;

  if (typeof name !== 'string' || name.trim().length === 0) {
    throw badRequest('name is required');
  }

  const cleanedMembers = Array.isArray(members) ? members : [];
  for (const memberId of cleanedMembers) {
    if (typeof memberId !== 'string' || !mongoose.isValidObjectId(memberId)) {
      throw badRequest('members must contain valid ObjectIds');
    }
  }

  if (typeof mascot !== 'string') {
    throw badRequest('mascot is required');
  }

  const team = await Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: cleanedMembers,
  });

  if (cleanedMembers.length > 0) {
    await User.updateMany({ _id: { $in: cleanedMembers } }, { $addToSet: { team: team._id } });
  }

  return team;
}

export async function getLeaderboard() {
  const teams = await Team.find().select('_id name').lean();
  const totals = await Activity.aggregate<{ _id: mongoose.Types.ObjectId; totalPoints: number }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));

  return teams
    .map((team) => ({
      teamName: team.name,
      totalPoints: pointsByTeam.get(team._id.toString()) ?? 0,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    const error = new Error('User not found') as Error & { status?: number };
    error.status = 404;
    throw error;
  }

  const latestActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const focus = user.fitnessGoal || latestActivity?.type;
  const workouts = await Workout.find().lean();
  const orderedWorkouts = [...workouts].sort((a, b) => {
    const aMatches = a.focus.toLowerCase() === focus?.toLowerCase();
    const bMatches = b.focus.toLowerCase() === focus?.toLowerCase();
    return Number(bMatches) - Number(aMatches);
  });

  return orderedWorkouts.map((workout) => ({
    ...workout,
    reason: workout.focus.toLowerCase() === focus?.toLowerCase()
      ? `Recommended to support your ${focus} goal and recent activity.`
      : `Suggested to complement your ${focus} goal and recent activity.`,
  }));
}

export { User };
