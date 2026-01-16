export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    full_name: string
                    role: 'reporter' | 'maintenance' | 'sub_director' | 'admin'
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    full_name: string
                    role?: 'reporter' | 'maintenance' | 'sub_director' | 'admin'
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    full_name?: string
                    role?: 'reporter' | 'maintenance' | 'sub_director' | 'admin'
                    created_at?: string
                    updated_at?: string
                }
            }
            properties: {
                Row: {
                    id: string
                    name: string
                    address: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    address?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    address?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            units: {
                Row: {
                    id: string
                    property_id: string
                    name: string
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    property_id: string
                    name: string
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    property_id?: string
                    name?: string
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            tickets: {
                Row: {
                    id: string
                    property_id: string
                    unit_id: string | null
                    type: 'corrective' | 'preventive'
                    category: 'ac' | 'appliances' | 'plumbing' | 'wifi' | 'furniture' | 'locks' | 'electricity' | 'painting' | 'cleaning' | 'pest_control' | 'other'
                    priority: 'low' | 'medium' | 'high' | 'urgent'
                    status: 'reported' | 'assigned' | 'in_progress' | 'resolved' | 'closed'
                    description: string
                    requires_spend: boolean
                    assigned_to_user_id: string | null
                    created_by: string
                    created_at: string
                    updated_at: string
                    resolved_at: string | null
                    closed_at: string | null
                }
                Insert: {
                    id?: string
                    property_id: string
                    unit_id?: string | null
                    type?: 'corrective' | 'preventive'
                    category: 'ac' | 'appliances' | 'plumbing' | 'wifi' | 'furniture' | 'locks' | 'electricity' | 'painting' | 'cleaning' | 'pest_control' | 'other'
                    priority?: 'low' | 'medium' | 'high' | 'urgent'
                    status?: 'reported' | 'assigned' | 'in_progress' | 'resolved' | 'closed'
                    description: string
                    requires_spend?: boolean
                    assigned_to_user_id?: string | null
                    created_by: string
                    created_at?: string
                    updated_at?: string
                    resolved_at?: string | null
                    closed_at?: string | null
                }
                Update: {
                    id?: string
                    property_id?: string
                    unit_id?: string | null
                    type?: 'corrective' | 'preventive'
                    category?: 'ac' | 'appliances' | 'plumbing' | 'wifi' | 'furniture' | 'locks' | 'electricity' | 'painting' | 'cleaning' | 'pest_control' | 'other'
                    priority?: 'low' | 'medium' | 'high' | 'urgent'
                    status?: 'reported' | 'assigned' | 'in_progress' | 'resolved' | 'closed'
                    description?: string
                    requires_spend?: boolean
                    assigned_to_user_id?: string | null
                    created_by?: string
                    created_at?: string
                    updated_at?: string
                    resolved_at?: string | null
                    closed_at?: string | null
                }
            }
            ticket_comments: {
                Row: {
                    id: string
                    ticket_id: string
                    author_id: string
                    body: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    ticket_id: string
                    author_id: string
                    body: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    ticket_id?: string
                    author_id?: string
                    body?: string
                    created_at?: string
                }
            }
            ticket_attachments: {
                Row: {
                    id: string
                    ticket_id: string
                    url: string
                    kind: 'image' | 'video' | 'invoice'
                    created_at: string
                    uploaded_by: string
                }
                Insert: {
                    id?: string
                    ticket_id: string
                    url: string
                    kind?: 'image' | 'video' | 'invoice'
                    created_at?: string
                    uploaded_by: string
                }
                Update: {
                    id?: string
                    ticket_id?: string
                    url?: string
                    kind?: 'image' | 'video' | 'invoice'
                    created_at?: string
                    uploaded_by?: string
                }
            }
            ticket_costs: {
                Row: {
                    id: string
                    ticket_id: string
                    labor_amount: number
                    parts_amount: number
                    total_amount: number
                    invoice_attachment_id: string | null
                    created_at: string
                    updated_at: string
                    updated_by: string
                }
                Insert: {
                    id?: string
                    ticket_id: string
                    labor_amount?: number
                    parts_amount?: number
                    invoice_attachment_id?: string | null
                    created_at?: string
                    updated_at?: string
                    updated_by: string
                }
                Update: {
                    id?: string
                    ticket_id?: string
                    labor_amount?: number
                    parts_amount?: number
                    invoice_attachment_id?: string | null
                    created_at?: string
                    updated_at?: string
                    updated_by?: string
                }
            }
            ticket_audit_logs: {
                Row: {
                    id: string
                    ticket_id: string
                    actor_id: string
                    action: string
                    from_value: Json | null
                    to_value: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    ticket_id: string
                    actor_id: string
                    action: string
                    from_value?: Json | null
                    to_value?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    ticket_id?: string
                    actor_id?: string
                    action?: string
                    from_value?: Json | null
                    to_value?: Json | null
                    created_at?: string
                }
            }
            property_blocks: {
                Row: {
                    id: string
                    property_id: string
                    unit_id: string | null
                    is_blocked: boolean
                    reason: string
                    blocked_by: string
                    blocked_at: string
                    unblocked_at: string | null
                }
                Insert: {
                    id?: string
                    property_id: string
                    unit_id?: string | null
                    is_blocked?: boolean
                    reason: string
                    blocked_by: string
                    blocked_at?: string
                    unblocked_at?: string | null
                }
                Update: {
                    id?: string
                    property_id?: string
                    unit_id?: string | null
                    is_blocked?: boolean
                    reason?: string
                    blocked_by?: string
                    blocked_at?: string
                    unblocked_at?: string | null
                }
            }
            preventive_tasks: {
                Row: {
                    id: string
                    property_id: string
                    unit_id: string | null
                    category: 'ac' | 'appliances' | 'plumbing' | 'wifi' | 'furniture' | 'locks' | 'electricity' | 'painting' | 'cleaning' | 'pest_control' | 'other'
                    description: string
                    recurrence_type: 'days' | 'weeks' | 'months'
                    recurrence_interval: number
                    last_generated_at: string | null
                    next_scheduled_at: string | null
                    is_active: boolean
                    created_by: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    property_id: string
                    unit_id?: string | null
                    category: 'ac' | 'appliances' | 'plumbing' | 'wifi' | 'furniture' | 'locks' | 'electricity' | 'painting' | 'cleaning' | 'pest_control' | 'other'
                    description: string
                    recurrence_type: 'days' | 'weeks' | 'months'
                    recurrence_interval: number
                    last_generated_at?: string | null
                    next_scheduled_at?: string | null
                    is_active?: boolean
                    created_by: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    property_id?: string
                    unit_id?: string | null
                    category?: 'ac' | 'appliances' | 'plumbing' | 'wifi' | 'furniture' | 'locks' | 'electricity' | 'painting' | 'cleaning' | 'pest_control' | 'other'
                    description?: string
                    recurrence_type?: 'days' | 'weeks' | 'months'
                    recurrence_interval?: number
                    last_generated_at?: string | null
                    next_scheduled_at?: string | null
                    is_active?: boolean
                    created_by?: string
                    created_at?: string
                    updated_at?: string
                }
            }
        }
        Views: {
            active_blocks: {
                Row: {
                    id: string
                    property_id: string
                    unit_id: string | null
                    is_blocked: boolean
                    reason: string
                    blocked_by: string
                    blocked_at: string
                    unblocked_at: string | null
                    property_name: string
                    unit_name: string | null
                    blocked_by_name: string
                    blocked_duration_hours: number
                }
            }
        }
        Functions: {
            get_user_role: {
                Args: Record<string, never>
                Returns: 'reporter' | 'maintenance' | 'sub_director' | 'admin'
            }
        }
        Enums: {
            user_role: 'reporter' | 'maintenance' | 'sub_director' | 'admin'
            ticket_type: 'corrective' | 'preventive'
            ticket_category: 'ac' | 'appliances' | 'plumbing' | 'wifi' | 'furniture' | 'locks' | 'electricity' | 'painting' | 'cleaning' | 'pest_control' | 'other'
            ticket_priority: 'low' | 'medium' | 'high' | 'urgent'
            ticket_status: 'reported' | 'assigned' | 'in_progress' | 'resolved' | 'closed'
            attachment_kind: 'image' | 'video' | 'invoice'
            recurrence_type: 'days' | 'weeks' | 'months'
        }
    }
}
