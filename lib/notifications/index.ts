/**
 * =============================================
 * NOTIFICATION CENTER
 * =============================================
 * 
 * This module provides a centralized notification service
 * for the maintenance ticket management system.
 * 
 * =============================================
 */

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type Ticket = Database['public']['Tables']['tickets']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

export interface NotificationPayload {
    type: 'ticket_created' | 'ticket_assigned' | 'ticket_status_changed' | 'ticket_resolved' | 'ticket_closed' | 'property_blocked'
    title: string
    message: string
    data: Record<string, any>
    recipients: string[] // User IDs
    priority: 'low' | 'medium' | 'high' | 'urgent'
}

/**
 * Send notification when a new ticket is created
 * Sends a Telegram notification (individual webhook call) to all sub_directors
 */
export async function sendTicketCreatedNotification(
    ticket: Ticket,
    createdBy: Profile
): Promise<void> {
    const supabase = await createClient()
    const { data: managers, error } = await (supabase
        .from('profiles') as any)
        .select('id, full_name, telegram_chat_id')
        .in('role', ['sub_director', 'admin'])

    if (error) {
        console.error('Error fetching managers for notification:', error)
        return
    }

    const webhookUrl = process.env.N8N_TICKET_CREATED_WEBHOOK_URL
    if (!webhookUrl) {
        console.warn('N8N_TICKET_CREATED_WEBHOOK_URL is not set')
        return
    }

    if (managers && managers.length > 0) {
        for (const manager of managers) {
            if (manager.telegram_chat_id) {
                try {
                    await fetch(webhookUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ticket_id: ticket.id,
                            created_by: createdBy.full_name,
                            category: ticket.category,
                            description: ticket.description,
                            priority: ticket.priority,
                            created_by_id: createdBy.id,
                            telegram_chat_id: manager.telegram_chat_id
                        })
                    })
                } catch (err) {
                    console.error(`Failed to send creation webhook to manager ${manager.full_name}:`, err)
                }
            }
        }
    }
}

/**
 * Send notification when a ticket is assigned
 * Sends a Telegram notification to the assigned user
 */
export async function sendTicketAssignedNotification(
    ticket: Ticket,
    assignedTo: Profile,
    assignedBy: string = 'System'
): Promise<void> {
    const webhookUrl = process.env.N8N_TICKET_ASSIGNED_WEBHOOK_URL
    if (!webhookUrl) {
        console.warn('N8N_TICKET_ASSIGNED_WEBHOOK_URL is not set')
        return
    }

    if (assignedTo.telegram_chat_id) {
        try {
            await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticket_id: ticket.id,
                    assigned_by: assignedBy,
                    category: ticket.category,
                    description: ticket.description,
                    user_telegram_chat_id: assignedTo.telegram_chat_id,
                    user_id: assignedTo.id,
                    priority: ticket.priority
                })
            })
        } catch (err) {
            console.error(`Failed to send assignment webhook to ${assignedTo.full_name}:`, err)
        }
    }
}

/**
 * Send notification when ticket status changes
 */
export async function sendTicketStatusChangedNotification(
    ticket: Ticket,
    oldStatus: string,
    newStatus: string
): Promise<void> {
    console.log('📢 [NOTIFICATION PLACEHOLDER] Status Changed:', {
        ticketId: ticket.id,
        from: oldStatus,
        to: newStatus,
    })
}

/**
 * Send notification when a ticket is resolved
 */
export async function sendTicketResolvedNotification(
    ticket: Ticket
): Promise<void> {
    console.log('📢 [NOTIFICATION PLACEHOLDER] Ticket Resolved:', {
        ticketId: ticket.id,
    })
}

/**
 * Send notification when a ticket is closed
 */
export async function sendTicketClosedNotification(
    ticket: Ticket
): Promise<void> {
    console.log('📢 [NOTIFICATION PLACEHOLDER] Ticket Closed:', {
        ticketId: ticket.id,
    })
}

/**
 * Send notification when a property is blocked
 */
export async function sendPropertyBlockedNotification(
    propertyId: string,
    propertyName: string,
    reason: string,
    blockedBy: Profile
): Promise<void> {
    console.log('📢 [NOTIFICATION PLACEHOLDER] Property Blocked:', {
        propertyId,
        propertyName,
        reason,
        blockedBy: blockedBy.full_name,
    })
}

/**
 * Send urgent notification for high priority tickets
 */
export async function sendUrgentTicketNotification(
    ticket: Ticket
): Promise<void> {
    if (ticket.priority === 'urgent') {
        console.log('🚨 [NOTIFICATION PLACEHOLDER] URGENT TICKET:', {
            ticketId: ticket.id,
            category: ticket.category,
        })
    }
}

/**
 * Generic notification sender
 */
export async function sendNotification(
    payload: NotificationPayload
): Promise<void> {
    console.log('📢 [NOTIFICATION PLACEHOLDER] Generic Notification:', payload)
}

