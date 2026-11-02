import { getSupabaseClient } from '../lib/supabase';
import type { ServiceResult } from '../types/database';

export interface AppSettingsDTO {
  paymentGatewayEnabled: boolean;
  paymentDeadlineMinutes: number;
  maxOpenUnpaidOrders: number;
  maxQtyPerItem: number;
  orderCooldownThreshold: number;
  qrisImageUrl: string;
}

export const DEFAULT_APP_SETTINGS: AppSettingsDTO = {
  paymentGatewayEnabled: false,
  paymentDeadlineMinutes: 60,
  maxOpenUnpaidOrders: 2,
  maxQtyPerItem: 10,
  orderCooldownThreshold: 3,
  qrisImageUrl: '',
};

const BUCKET = 'payment-assets';
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

function mapSettings(rows: { key: string; value: unknown }[]): AppSettingsDTO {
  const byKey = new Map(rows.map((row) => [row.key, row.value]));
  const num = (key: string, fallback: number) => {
    const value = Number(byKey.get(key));
    return Number.isFinite(value) ? value : fallback;
  };
  return {
    paymentGatewayEnabled: byKey.get('payment_gateway_enabled') === true,
    paymentDeadlineMinutes: num('payment_deadline_minutes', DEFAULT_APP_SETTINGS.paymentDeadlineMinutes),
    maxOpenUnpaidOrders: num('max_open_unpaid_orders', DEFAULT_APP_SETTINGS.maxOpenUnpaidOrders),
    maxQtyPerItem: num('max_qty_per_item', DEFAULT_APP_SETTINGS.maxQtyPerItem),
    orderCooldownThreshold: num('order_cooldown_threshold', DEFAULT_APP_SETTINGS.orderCooldownThreshold),
    qrisImageUrl: String(byKey.get('qris_image_url') ?? ''),
  };
}

export const settingsAdminService = {
  async getSettings(): Promise<ServiceResult<AppSettingsDTO>> {
    const sb = getSupabaseClient();
    if (!sb) return { success: false, error: 'UNAVAILABLE' };

    const { data, error } = await sb.from('app_settings').select('key, value');
    if (error) return { success: false, error: 'UNKNOWN' };
    return { success: true, data: mapSettings(data || []) };
  },

  async updateSettings(settings: AppSettingsDTO): Promise<ServiceResult<AppSettingsDTO>> {
    const sb = getSupabaseClient();
    if (!sb) return { success: false, error: 'UNAVAILABLE' };

    const { error } = await sb.rpc('admin_update_settings', {
      p_settings: {
        payment_gateway_enabled: settings.paymentGatewayEnabled,
        payment_deadline_minutes: settings.paymentDeadlineMinutes,
        max_open_unpaid_orders: settings.maxOpenUnpaidOrders,
        max_qty_per_item: settings.maxQtyPerItem,
        order_cooldown_threshold: settings.orderCooldownThreshold,
        qris_image_url: settings.qrisImageUrl,
      },
    });
    if (error) {
      return {
        success: false,
        error: error.message.includes('FORBIDDEN') ? 'FORBIDDEN' : 'INVALID_SETTINGS',
      };
    }
    return { success: true, data: settings };
  },

  async uploadQris(file: File): Promise<ServiceResult<string>> {
    const sb = getSupabaseClient();
    if (!sb) return { success: false, error: 'UNAVAILABLE' };
    if (!ALLOWED_TYPES.includes(file.type)) return { success: false, error: 'INVALID_FILE_TYPE' };
    if (file.size > MAX_UPLOAD_BYTES) return { success: false, error: 'FILE_TOO_LARGE' };

    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const path = `qris-${Date.now()}.${ext}`;
    const { error } = await sb.storage.from(BUCKET).upload(path, file, {
      contentType: file.type,
      cacheControl: '3600',
    });
    if (error) return { success: false, error: 'UPLOAD_FAILED' };

    const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
    return { success: true, data: data.publicUrl };
  },
};
