import type { Prisma } from '../generated/prisma/client';
import { prisma } from './db';
import type {
  AppData,
  University,
  Department,
  Professor,
  ActivityLog,
  ActivityAction,
  User,
  OutreachRecord,
  MastersCourse,
} from '@/types';

type UserRow = {
  id: string;
  username: string;
  name: string;
  avatar: string;
  color: string;
  glowColor: string;
  accentBg: string;
  role: string;
};

export async function getAppData(user: User | UserRow): Promise<AppData> {
  const [unis, logs, courses] = await Promise.all([
    prisma.university.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        departments: {
          orderBy: { createdAt: 'asc' },
          include: {
            professors: {
              where: { OR: [{ visibility: 'public' }, { ownerId: user.id }] },
              orderBy: { createdAt: 'asc' },
              include: {
                outreach: { where: { userId: user.id } },
                owner: { select: { name: true } },
                bookmarks: { where: { userId: user.id }, select: { id: true } },
              },
            },
          },
        },
      },
    }),
    prisma.activityLog.findMany({
      where: { userId: user.id },
      orderBy: { timestamp: 'desc' },
      take: 50,
    }),
    prisma.mastersCourse.findMany({
      where: { OR: [{ ownerId: user.id }, { visibility: 'public' }] },
      orderBy: { updatedAt: 'desc' },
      include: { owner: { select: { name: true } } },
    }),
  ]);

  const universities: University[] = unis.map((uni) => ({
    id: uni.id,
    name: uni.name,
    country: uni.country,
    city: uni.city,
    ranking: uni.ranking ?? undefined,
    portalUrl: uni.portalUrl ?? undefined,
    websiteUrl: uni.websiteUrl ?? undefined,
    notes: uni.notes ?? undefined,
    createdAt: uni.createdAt.toISOString(),
    departments: uni.departments.map((dept) => ({
      id: dept.id,
      universityId: dept.universityId,
      name: dept.name,
      degreeLevel: dept.degreeLevel as Department['degreeLevel'],
      websiteUrl: dept.websiteUrl ?? undefined,
      deadlines: (dept.deadlines ?? {}) as Department['deadlines'],
      requirements: (dept.requirements ?? {}) as Department['requirements'],
      createdAt: dept.createdAt.toISOString(),
      professors: dept.professors.map((prof) => {
        const rec = prof.outreach[0];
        return {
          id: prof.id,
          departmentId: prof.departmentId,
          name: prof.name,
          title: prof.title,
          email: prof.email,
          websiteUrl: prof.websiteUrl ?? undefined,
          scholarUrl: prof.scholarUrl ?? undefined,
          researchAreas: prof.researchAreas,
          acceptingStudents: prof.acceptingStudents as Professor['acceptingStudents'],
          notes: prof.notes ?? undefined,
          visibility: (prof.visibility === 'private' ? 'private' : 'public') as Professor['visibility'],
          ownerId: prof.ownerId ?? undefined,
          ownerName: prof.owner?.name,
          onMyList: prof.ownerId === user.id || prof.bookmarks.length > 0,
          createdAt: prof.createdAt.toISOString(),
          myOutreach: rec
            ? ({
                id: rec.id,
                userId: rec.userId,
                status: rec.status as OutreachRecord['status'],
                dateEmailed: rec.dateEmailed ?? undefined,
                responseDate: rec.responseDate ?? undefined,
                followUpDate: rec.followUpDate ?? undefined,
                notes: rec.notes ?? undefined,
                emailSubject: rec.emailSubject ?? undefined,
                lastUpdated: rec.lastUpdated.toISOString(),
              } satisfies OutreachRecord)
            : null,
        };
      }),
    })),
  }));

  const activityLogs: ActivityLog[] = logs.map((log) => ({
    id: log.id,
    timestamp: log.timestamp.toISOString(),
    userId: log.userId,
    action: log.action as ActivityAction,
    description: log.description,
    metadata: (log.metadata ?? undefined) as ActivityLog['metadata'],
  }));

  const mastersCourses: MastersCourse[] = courses.map((c) => ({
    id: c.id,
    universityName: c.universityName,
    departmentName: c.departmentName,
    ieltsReq: c.ieltsReq,
    lastDate: c.lastDate,
    applicationLink: c.applicationLink,
    description: c.description ?? '',
    visibility: (c.visibility === 'public' ? 'public' : 'private') as MastersCourse['visibility'],
    ownerId: c.ownerId ?? undefined,
    ownerName: c.owner?.name,
    isMine: c.ownerId === user.id,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return {
    version: '1.0.0',
    universities,
    mastersCourses,
    me: {
      id: user.id,
      username: user.username,
      name: user.name,
      avatar: user.avatar,
      color: user.color,
      glowColor: user.glowColor,
      accentBg: user.accentBg,
      role: user.role,
    },
    activityLogs,
  };
}

export async function logActivity(
  userId: string,
  action: ActivityAction,
  description: string,
  metadata?: ActivityLog['metadata']
): Promise<void> {
  await prisma.activityLog.create({
    data: {
      userId,
      action,
      description,
      metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });

  const overflow = await prisma.activityLog.findMany({
    where: { userId },
    orderBy: { timestamp: 'desc' },
    skip: 50,
    select: { id: true },
  });
  if (overflow.length > 0) {
    await prisma.activityLog.deleteMany({
      where: { id: { in: overflow.map((o) => o.id) } },
    });
  }
}
