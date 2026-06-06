import prisma from '../config/prisma.js';
import emailService from '../utils/emailService.js';
import { createHttpError } from '../utils/httpError.js';

const CONTACT_RECEIVER_EMAIL = process.env.CONTACT_RECEIVER_EMAIL || 'shanjid.maktech@gmail.com';
const TICKET_SORTABLE_FIELDS = ['createdAt', 'name', 'email'];

class SupportService {
  async submitContactMessage({ name, email, message }) {
    const normalizedName = name?.trim();
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedMessage = message?.trim();

    if (!normalizedName || !normalizedEmail || !normalizedMessage) {
      throw createHttpError(400, 'name, email, and message are required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      throw createHttpError(400, 'Invalid email format');
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        name: normalizedName,
        email: normalizedEmail,
        message: normalizedMessage
      },
      select: {
        id: true,
        name: true,
        email: true,
        message: true,
        createdAt: true
      }
    });

    const emailSent = await emailService.sendContactMessage({
      toEmail: CONTACT_RECEIVER_EMAIL,
      senderName: normalizedName,
      senderEmail: normalizedEmail,
      message: normalizedMessage
    });

    return {
      statusCode: 201,
      message: emailSent
        ? 'Message sent successfully'
        : 'Message saved, but email delivery is temporarily unavailable',
      data: ticket
    };
  }

  async getTickets({ query = {} }) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search = ''
    } = query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const isValidSortField = TICKET_SORTABLE_FIELDS.includes(sortBy);
    const validSortOrder = sortOrder?.toLowerCase() === 'asc' ? 'asc' : 'desc';

    const whereClause = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { message: { contains: search, mode: 'insensitive' } }
          ]
        }
      : {};

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where: whereClause,
        orderBy: isValidSortField
          ? { [sortBy]: validSortOrder }
          : { createdAt: 'desc' },
        skip,
        take: limitNum,
        select: {
          id: true,
          name: true,
          email: true,
          message: true,
          createdAt: true
        }
      }),
      prisma.supportTicket.count({ where: whereClause })
    ]);

    return {
      statusCode: 200,
      message: 'Support tickets retrieved successfully',
      data: tickets,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    };
  }

  async getTicketById({ id }) {
    if (!id) {
      throw createHttpError(400, 'Ticket ID is required');
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        message: true,
        createdAt: true
      }
    });

    if (!ticket) {
      throw createHttpError(404, 'Support ticket not found');
    }

    return {
      statusCode: 200,
      message: 'Support ticket retrieved successfully',
      data: ticket
    };
  }

  async deleteTicket({ id }) {
    if (!id) {
      throw createHttpError(400, 'Ticket ID is required');
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id }
    });

    if (!ticket) {
      throw createHttpError(404, 'Support ticket not found');
    }

    await prisma.supportTicket.delete({
      where: { id }
    });

    return {
      statusCode: 200,
      message: 'Support ticket deleted successfully'
    };
  }
}

export default new SupportService();