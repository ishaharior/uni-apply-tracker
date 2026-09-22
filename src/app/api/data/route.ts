import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { Prisma } from '@/generated/prisma/client';
import { getCurrentUser } from '@/lib/auth';
import { getAppData, logActivity } from '@/lib/data-service';
import { importDataset } from '@/lib/import-data';
import { INITIAL_DATASET } from '@/lib/initial-data';
import type { LegacyDataset } from '@/types';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const data = await getAppData(user);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('GET /api/data error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, payload } = body ?? {};

    switch (action) {
      case 'UPDATE_OUTREACH': {
        const { professorId, record } = payload ?? {};
        const prof = await prisma.professor.findUnique({
          where: { id: professorId },
          include: {
            outreach: { where: { userId: user.id } },
            department: { include: { university: true } },
          },
        });
        if (!prof) {
          return NextResponse.json({ success: false, error: 'Professor not found' }, { status: 404 });
        }

        const existing = prof.outreach[0];
        const oldStatus = existing?.status ?? 'not_contacted';
        const newStatus = record?.status ?? oldStatus;

        const data = {
          status: newStatus,
          dateEmailed: record?.dateEmailed || null,
          responseDate: record?.responseDate || null,
          followUpDate: record?.followUpDate || null,
          emailSubject: record?.emailSubject || null,
          notes: record?.notes || null,
          lastUpdated: new Date(),
        };

        await prisma.outreachRecord.upsert({
          where: {
            professorId_userId: { professorId: prof.id, userId: user.id },
          },
          create: {
            professorId: prof.id,
            userId: user.id,
            ...data,
          },
          update: data,
        });

        const uniName = prof.department.university.name;
        const actionDesc =
          oldStatus !== newStatus
            ? `${user.name} changed status to "${String(newStatus).replace('_', ' ').toUpperCase()}" for ${prof.name} (${uniName})`
            : `${user.name} updated notes for ${prof.name}`;
        await logActivity(user.id, 'updated_outreach', actionDesc, {
          professorName: prof.name,
          universityName: uniName,
          newStatus,
        });

        const appData = await getAppData(user);
        return NextResponse.json({ success: true, data: appData });
      }

      case 'ADD_UNIVERSITY': {
        const p = payload ?? {};
        const uni = await prisma.university.create({
          data: {
            name: String(p.name ?? '').trim() || 'New University',
            country: String(p.country ?? '').trim() || 'Unknown',
            city: String(p.city ?? '').trim(),
            ranking: p.ranking ? Number(p.ranking) : null,
            portalUrl: String(p.portalUrl ?? '').trim() || null,
            websiteUrl: String(p.websiteUrl ?? '').trim() || null,
            notes: String(p.notes ?? '').trim() || null,
          },
        });
        await logActivity(user.id, 'added_university', `${user.name} added university: ${uni.name}`, {
          universityName: uni.name,
        });
        const appData = await getAppData(user);
        return NextResponse.json({ success: true, data: appData, added: uni });
      }

      case 'UPDATE_UNIVERSITY': {
        const { id, updates } = payload ?? {};
        const existing = await prisma.university.findUnique({ where: { id } });
        if (!existing) {
          return NextResponse.json({ success: false, error: 'University not found' }, { status: 404 });
        }
        await prisma.university.update({
          where: { id },
          data: {
            ...(updates.name !== undefined ? { name: updates.name } : {}),
            ...(updates.country !== undefined ? { country: updates.country } : {}),
            ...(updates.city !== undefined ? { city: updates.city } : {}),
            ...(updates.ranking !== undefined
              ? { ranking: updates.ranking ? Number(updates.ranking) : null }
              : {}),
            ...(updates.portalUrl !== undefined ? { portalUrl: updates.portalUrl || null } : {}),
            ...(updates.websiteUrl !== undefined ? { websiteUrl: updates.websiteUrl || null } : {}),
            ...(updates.notes !== undefined ? { notes: updates.notes || null } : {}),
          },
        });
        const appData = await getAppData(user);
        return NextResponse.json({ success: true, data: appData });
      }

      case 'DELETE_UNIVERSITY': {
        const { id } = payload ?? {};
        const target = await prisma.university.findUnique({ where: { id } });
        if (target) {
          await prisma.university.delete({ where: { id } });
          await logActivity(user.id, 'deleted_entity', `${user.name} deleted university: ${target.name}`, {
            universityName: target.name,
          });
        }
        const appData = await getAppData(user);
        return NextResponse.json({ success: true, data: appData });
      }

      case 'ADD_DEPARTMENT': {
        const { universityId, department } = payload ?? {};
        const uni = await prisma.university.findUnique({ where: { id: universityId } });
        if (!uni) {
          return NextResponse.json({ success: false, error: 'University not found' }, { status: 404 });
        }
        const dept = await prisma.department.create({
          data: {
            universityId,
            name: String(department?.name ?? '').trim() || 'New Department',
            degreeLevel: department?.degreeLevel || 'PhD',
            websiteUrl: String(department?.websiteUrl ?? '').trim() || null,
            deadlines: (department?.deadlines ?? {}) as Prisma.InputJsonValue,
            requirements: (department?.requirements ?? {}) as Prisma.InputJsonValue,
          },
        });
        await logActivity(
          user.id,
          'added_department',
          `${user.name} added department "${dept.name}" to ${uni.name}`,
          { universityName: uni.name, departmentName: dept.name }
        );
        const appData = await getAppData(user);
        return NextResponse.json({ success: true, data: appData, added: dept });
      }

      case 'UPDATE_DEPARTMENT': {
        const { universityId, departmentId, updates } = payload ?? {};
        const dept = await prisma.department.findFirst({
          where: { id: departmentId, universityId },
        });
        if (!dept) {
          return NextResponse.json({ success: false, error: 'Department not found' }, { status: 404 });
        }
        await prisma.department.update({
          where: { id: departmentId },
          data: {
            ...(updates.name !== undefined ? { name: updates.name } : {}),
            ...(updates.degreeLevel !== undefined ? { degreeLevel: updates.degreeLevel } : {}),
            ...(updates.websiteUrl !== undefined ? { websiteUrl: updates.websiteUrl || null } : {}),
            ...(updates.deadlines !== undefined
              ? { deadlines: (updates.deadlines ?? {}) as Prisma.InputJsonValue }
              : {}),
            ...(updates.requirements !== undefined
              ? { requirements: (updates.requirements ?? {}) as Prisma.InputJsonValue }
              : {}),
          },
        });
        const appData = await getAppData(user);
        return NextResponse.json({ success: true, data: appData });
      }

      case 'DELETE_DEPARTMENT': {
        const { universityId, departmentId } = payload ?? {};
        const dept = await prisma.department.findFirst({
          where: { id: departmentId, universityId },
        });
        if (!dept) {
          return NextResponse.json({ success: false, error: 'Department not found' }, { status: 404 });
        }
        await prisma.department.delete({ where: { id: departmentId } });
        const appData = await getAppData(user);
        return NextResponse.json({ success: true, data: appData });
      }

      case 'ADD_PROFESSOR': {
        const { universityId, departmentId, professor } = payload ?? {};
        const dept = await prisma.department.findFirst({
          where: { id: departmentId, universityId },
          include: { university: true },
        });
        if (!dept) {
          return NextResponse.json({ success: false, error: 'Department not found' }, { status: 404 });
        }
        const areas = Array.isArray(professor?.researchAreas)
          ? professor.researchAreas
          : String(professor?.researchAreas ?? '')
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean);
        const prof = await prisma.professor.create({
          data: {
            departmentId,
            name: String(professor?.name ?? '').trim() || 'Dr. Unknown',
            title: String(professor?.title ?? '').trim() || 'Professor',
            email: String(professor?.email ?? '').trim(),
            websiteUrl: String(professor?.websiteUrl ?? '').trim() || null,
            scholarUrl: String(professor?.scholarUrl ?? '').trim() || null,
            researchAreas: areas,
            acceptingStudents: professor?.acceptingStudents || 'unknown',
            notes: String(professor?.notes ?? '').trim() || null,
            visibility: professor?.visibility === 'private' ? 'private' : 'public',
            ownerId: user.id,
          },
          include: { owner: { select: { name: true } } },
        });
        await logActivity(
          user.id,
          'added_professor',
          `${user.name} added professor ${prof.name} to ${dept.name} (${dept.university.name})`,
          {
            universityName: dept.university.name,
            departmentName: dept.name,
            professorName: prof.name,
          }
        );
        const appData = await getAppData(user);
        return NextResponse.json({ success: true, data: appData, added: prof });
      }

      case 'UPDATE_PROFESSOR': {
        const { universityId, departmentId, professorId, updates } = payload ?? {};
        const dept = await prisma.department.findFirst({
          where: { id: departmentId, universityId },
        });
        if (!dept) {
          return NextResponse.json({ success: false, error: 'Department not found' }, { status: 404 });
        }
        const prof = await prisma.professor.findFirst({
          where: { id: professorId, departmentId },
        });
        if (!prof) {
          return NextResponse.json({ success: false, error: 'Professor not found' }, { status: 404 });
        }

        const isOwner = prof.ownerId === user.id;
        const isPublic = prof.visibility !== 'private';
        if (!isPublic && !isOwner) {
          return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        let researchAreas: string[] | undefined;
        if (updates.researchAreas !== undefined) {
          researchAreas =
            typeof updates.researchAreas === 'string'
              ? updates.researchAreas.split(',').map((s: string) => s.trim()).filter(Boolean)
              : updates.researchAreas;
        }

        let visibility: string | undefined;
        if (updates.visibility !== undefined) {
          if (!isOwner) {
            return NextResponse.json({ success: false, error: 'Only the owner can change visibility' }, { status: 403 });
          }
          visibility = updates.visibility === 'private' ? 'private' : 'public';
        }

        await prisma.professor.update({
          where: { id: professorId },
          data: {
            ...(updates.name !== undefined ? { name: updates.name } : {}),
            ...(updates.title !== undefined ? { title: updates.title } : {}),
            ...(updates.email !== undefined ? { email: updates.email || '' } : {}),
            ...(updates.websiteUrl !== undefined ? { websiteUrl: updates.websiteUrl || null } : {}),
            ...(updates.scholarUrl !== undefined ? { scholarUrl: updates.scholarUrl || null } : {}),
            ...(researchAreas !== undefined ? { researchAreas } : {}),
            ...(updates.acceptingStudents !== undefined
              ? { acceptingStudents: updates.acceptingStudents }
              : {}),
            ...(updates.notes !== undefined ? { notes: updates.notes || null } : {}),
            ...(visibility !== undefined ? { visibility } : {}),
          },
        });
        const appData = await getAppData(user);
        return NextResponse.json({ success: true, data: appData });
      }

      case 'DELETE_PROFESSOR': {
        const { universityId, departmentId, professorId } = payload ?? {};
        const dept = await prisma.department.findFirst({
          where: { id: departmentId, universityId },
        });
        if (!dept) {
          return NextResponse.json({ success: false, error: 'Department not found' }, { status: 404 });
        }
        const prof = await prisma.professor.findFirst({
          where: { id: professorId, departmentId },
        });
        if (!prof) {
          return NextResponse.json({ success: false, error: 'Professor not found' }, { status: 404 });
        }
        if (prof.ownerId !== user.id) {
          return NextResponse.json({ success: false, error: 'Only the owner can delete this professor' }, { status: 403 });
        }
        await prisma.professor.delete({ where: { id: professorId } });
        const appData = await getAppData(user);
        return NextResponse.json({ success: true, data: appData });
      }

      case 'ADD_TO_LIST': {
        const { professorId } = payload ?? {};
        const prof = await prisma.professor.findUnique({ where: { id: professorId } });
        if (!prof) {
          return NextResponse.json({ success: false, error: 'Professor not found' }, { status: 404 });
        }
        if (prof.visibility !== 'public' && prof.ownerId !== user.id) {
          return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }
        if (prof.ownerId !== user.id) {
          await prisma.professorBookmark.upsert({
            where: { userId_professorId: { userId: user.id, professorId: prof.id } },
            create: { userId: user.id, professorId: prof.id },
            update: {},
          });
          await logActivity(
            user.id,
            'toggled_list',
            `${user.name} added ${prof.name} to their list`,
            { professorName: prof.name }
          );
        }
        const appData = await getAppData(user);
        return NextResponse.json({ success: true, data: appData });
      }

      case 'REMOVE_FROM_LIST': {
        const { professorId } = payload ?? {};
        const prof = await prisma.professor.findUnique({ where: { id: professorId } });
        if (!prof) {
          return NextResponse.json({ success: false, error: 'Professor not found' }, { status: 404 });
        }
        if (prof.ownerId === user.id) {
          return NextResponse.json(
            { success: false, error: 'Cannot remove your own professor from your list' },
            { status: 400 }
          );
        }
        await prisma.professorBookmark.deleteMany({
          where: { userId: user.id, professorId: prof.id },
        });
        await logActivity(
          user.id,
          'toggled_list',
          `${user.name} removed ${prof.name} from their list`,
          { professorName: prof.name }
        );
        const appData = await getAppData(user);
        return NextResponse.json({ success: true, data: appData });
      }

      case 'RESET_DATA': {
        await importDataset(prisma, INITIAL_DATASET, { ownerId: user.id });
        const appData = await getAppData(user);
        return NextResponse.json({ success: true, data: appData });
      }

      case 'IMPORT_DATA': {
        if (!payload || !Array.isArray(payload.universities)) {
          return NextResponse.json({ success: false, error: 'Invalid backup format' }, { status: 400 });
        }
        let friends = payload.friends;
        if (!friends || typeof friends !== 'object') {
          const users = await prisma.user.findMany();
          friends = Object.fromEntries(
            users.map((u) => [
              u.username,
              {
                id: u.username,
                name: u.name,
                role: u.role,
                avatar: u.avatar,
                color: u.color,
                glowColor: u.glowColor,
                accentBg: u.accentBg,
              },
            ])
          );
        }
        const dataset: LegacyDataset = {
          version: payload.version || '1.0.0',
          friends,
          universities: payload.universities,
          activityLogs: Array.isArray(payload.activityLogs) ? payload.activityLogs : [],
        };
        await importDataset(prisma, dataset, { ownerId: user.id });
        const appData = await getAppData(user);
        return NextResponse.json({ success: true, data: appData });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('POST /api/data error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
