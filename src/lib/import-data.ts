import fs from 'fs';
import path from 'path';
import type { Prisma, PrismaClient } from '../generated/prisma/client';
import { hashPassword } from './password';
import { INITIAL_DATASET } from './initial-data';
import type { LegacyDataset } from '@/types';

export function loadDatasetFromDisk(): LegacyDataset {
  try {
    const file = path.join(process.cwd(), 'data', 'tracker-data.json');
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, 'utf-8');
      const parsed = JSON.parse(raw) as LegacyDataset;
      if (parsed && Array.isArray(parsed.universities)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Failed reading tracker-data.json, falling back to initial dataset', error);
  }
  return INITIAL_DATASET;
}

export async function syncUsers(
  prisma: PrismaClient,
  friends: LegacyDataset['friends']
): Promise<Map<string, string>> {
  const idMap = new Map<string, string>();
  const entries = Object.entries(friends);
  const defaultHash = await hashPassword('A123456');

  for (const [key, friend] of entries) {
    const username = friend.id || key;
    const user = await prisma.user.upsert({
      where: { username },
      update: {
        name: friend.name,
        avatar: friend.avatar,
        color: friend.color,
        glowColor: friend.glowColor,
        accentBg: friend.accentBg,
        role: friend.role,
      },
      create: {
        username,
        name: friend.name,
        passwordHash: defaultHash,
        avatar: friend.avatar,
        color: friend.color,
        glowColor: friend.glowColor,
        accentBg: friend.accentBg,
        role: friend.role,
      },
    });
    idMap.set(username, user.id);
    idMap.set(key, user.id);
  }

  return idMap;
}

export async function importDataset(
  prisma: PrismaClient,
  data: LegacyDataset,
  options?: { ownerId?: string; ownerUsername?: string }
): Promise<void> {
  const userIdMap = await syncUsers(prisma, data.friends ?? {});

  const resolveOwner = (username?: string): string | null => {
    if (username) {
      const byName = userIdMap.get(username);
      if (byName) return byName;
    }
    if (options?.ownerUsername) {
      const byOpt = userIdMap.get(options.ownerUsername);
      if (byOpt) return byOpt;
    }
    if (options?.ownerId) return options.ownerId;
    const first = userIdMap.values().next();
    return first.done ? null : first.value;
  };

  await prisma.activityLog.deleteMany({});
  await prisma.professorBookmark.deleteMany({});
  await prisma.university.deleteMany({});

  let baseTime = Date.now() - (data.universities.length + 1) * 60_000;

  const nextTime = () => {
    baseTime += 1;
    return new Date(baseTime);
  };

  for (const uni of data.universities ?? []) {
    const uniCreatedAt = uni.createdAt ? new Date(uni.createdAt).getTime() : NaN;
    const uniTime = Number.isNaN(uniCreatedAt) ? nextTime() : new Date(Math.max(uniCreatedAt, baseTime + 1));
    baseTime = uniTime.getTime();
    await prisma.university.create({
      data: {
        id: uni.id,
        name: uni.name,
        country: uni.country,
        city: uni.city ?? '',
        ranking: uni.ranking ?? null,
        portalUrl: uni.portalUrl || null,
        websiteUrl: uni.websiteUrl || null,
        notes: uni.notes || null,
        createdAt: uniTime,
        departments: {
          create: (uni.departments ?? []).map((dept, deptIdx) => {
            const deptTime = new Date(baseTime + 1 + deptIdx);
            return {
              id: dept.id,
              name: dept.name,
              degreeLevel: dept.degreeLevel,
              websiteUrl: dept.websiteUrl || null,
              deadlines: (dept.deadlines ?? {}) as Prisma.InputJsonValue,
              requirements: (dept.requirements ?? {}) as Prisma.InputJsonValue,
              createdAt: deptTime,
              professors: {
                create: (dept.professors ?? []).map((prof, profIdx) => ({
                  id: prof.id,
                  name: prof.name,
                  title: prof.title,
                  email: prof.email ?? '',
                  websiteUrl: prof.websiteUrl || null,
                  scholarUrl: prof.scholarUrl || null,
                  researchAreas: prof.researchAreas ?? [],
                  acceptingStudents: prof.acceptingStudents ?? 'unknown',
                  notes: prof.notes || null,
                  visibility: prof.visibility === 'private' ? 'private' : 'public',
                  ownerId: resolveOwner(prof.ownerUsername),
                  createdAt: new Date(deptTime.getTime() + 1 + profIdx),
                  outreach: {
                    create: Object.entries(prof.outreach ?? {})
                      .map(([friendKey, rec]) => {
                        const userId = userIdMap.get(friendKey) ?? userIdMap.get(rec.friendId);
                        if (!userId) return null;
                        return {
                          userId,
                          status: rec.status ?? 'not_contacted',
                          dateEmailed: rec.dateEmailed || null,
                          responseDate: rec.responseDate || null,
                          followUpDate: rec.followUpDate || null,
                          notes: rec.notes || null,
                          emailSubject: rec.emailSubject || null,
                          lastUpdated: rec.lastUpdated ? new Date(rec.lastUpdated) : new Date(),
                        };
                      })
                      .filter((x): x is NonNullable<typeof x> => x !== null),
                  },
                })),
              },
            };
          }),
        },
      },
    });
    baseTime += 1 + (uni.departments?.length ?? 0);
  }

  const logCreates = (data.activityLogs ?? [])
    .map((log) => {
      const userId = userIdMap.get(log.friendId);
      if (!userId) return null;
      return {
        id: log.id,
        userId,
        timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
        action: log.action,
        description: log.description,
        metadata: (log.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (logCreates.length > 0) {
    await prisma.activityLog.createMany({ data: logCreates });
  }
}
