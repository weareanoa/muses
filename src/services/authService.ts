import { getSupabaseClient } from '../lib/supabase';
import type { UserProfileDTO, UserAddressDTO, ServiceResult } from '../types/database';

export interface RegisterRequestPayload {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  username?: string;
  bias?: string;
  biasEmoji?: string;
  initialAddress?: Omit<UserAddressDTO, 'id'>;
}

interface StoredOtp {
  email: string;
  code: string;
  expiresAt: number;
  attempts: number;
}

const DEFAULT_USERS: (UserProfileDTO & { password?: string })[] = [
  {
    id: 'user_muses_default',
    name: 'Winaa',
    email: 'winarahmaliaxx@gmail.com',
    password: 'muses2026',
    phone: '0813111111111',
    username: 'winaa',
    authProvider: 'email',
    bias: 'Faril',
    biasEmoji: '☾',
    membershipTier: 'Official MUSES CIRCLE',
    membershipNumber: 'MSE-261022',
    joinedAt: '22 Oktober 2026',
    addresses: [
      {
        id: 'addr_default_1',
        label: 'Rumah',
        recipientName: 'Wina',
        phone: '(+62) 8131111111111',
        street: 'Perumahan hantu, Jalan dengan sepatu rodaku Blok A1 No. 3, RT.0/RW.1, Bekasi Timur',
        district: 'TAMBUN SELATAN',
        city: 'KAB. BEKASI',
        province: 'JAWA BARAT',
        postalCode: '17510',
        detail: '',
        isDefault: true,
      },
    ],
    selectedAddressId: 'addr_default_1',
  },
  {
    id: 'user_muses_fahmi',
    name: 'Fahmi',
    email: 'fahmi@email.com',
    password: 'muses2026',
    phone: '081234567890',
    username: 'fahmi',
    authProvider: 'email',
    bias: 'Faril',
    biasEmoji: '☾',
    membershipTier: 'Official MUSES CIRCLE',
    membershipNumber: 'MSE-261023',
    joinedAt: '22 Oktober 2026',
    addresses: [
      {
        id: 'addr_fahmi_1',
        label: 'Rumah',
        recipientName: 'Fahmi',
        phone: '081234567890',
        street: 'Jl. Melpomene No. 18',
        district: 'Coblong',
        city: 'Bandung',
        province: 'Jawa Barat',
        postalCode: '40123',
        detail: '',
        isDefault: true,
      },
    ],
    selectedAddressId: 'addr_fahmi_1',
  },
];

function mapDbAddressToDto(row: any): UserAddressDTO {
  return {
    id: row.id,
    label: row.label || 'Rumah',
    recipientName: row.recipient_name,
    phone: row.phone,
    street: row.street,
    district: row.district || '',
    city: row.city,
    province: row.province,
    postalCode: row.postal_code,
    detail: row.detail || '',
    isDefault: Boolean(row.is_default),
  };
}

function mapDbProfileToDto(profile: any, addresses: UserAddressDTO[] = []): UserProfileDTO {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    username: profile.username,
    authProvider: profile.auth_provider || 'email',
    avatar: profile.avatar,
    bias: profile.bias || 'Faril',
    biasEmoji: profile.bias_emoji || '🦋',
    membershipTier: profile.membership_tier || 'Official MUSES CIRCLE',
    membershipNumber: profile.membership_number,
    joinedAt: profile.joined_at
      ? new Date(profile.joined_at).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : undefined,
    addresses,
    selectedAddressId: profile.selected_address_id || addresses.find((a) => a.isDefault)?.id || addresses[0]?.id,
  };
}

export function getLocalStoredUsers(): (UserProfileDTO & { password?: string })[] {
  if (typeof window === 'undefined') return DEFAULT_USERS;
  try {
    const raw = localStorage.getItem('muses_registered_users');
    if (!raw) {
      localStorage.setItem('muses_registered_users', JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_USERS;
  }
}

export function saveLocalUsers(users: (UserProfileDTO & { password?: string })[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('muses_registered_users', JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save users', err);
  }
}

export function loadLocalCurrentUser(): UserProfileDTO | null {
  if (typeof window === 'undefined') return null;
  try {
    const isLoggedOut = localStorage.getItem('muses_is_logged_out');
    if (isLoggedOut === 'true') {
      return null;
    }
    const saved = localStorage.getItem('muses_current_user');
    if (saved) {
      return JSON.parse(saved);
    }
    localStorage.setItem('muses_current_user', JSON.stringify(DEFAULT_USERS[0]));
    return DEFAULT_USERS[0];
  } catch {
    return null;
  }
}

export function persistLocalSession(user: UserProfileDTO | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.removeItem('muses_is_logged_out');
      localStorage.setItem('muses_current_user', JSON.stringify(user));
      const users = getLocalStoredUsers();
      const idx = users.findIndex((u) => u.id === user.id || u.email === user.email);
      if (idx > -1) {
        users[idx] = { ...users[idx], ...user };
        saveLocalUsers(users);
      }
    } else {
      localStorage.setItem('muses_is_logged_out', 'true');
      localStorage.removeItem('muses_current_user');
    }
  } catch (err) {
    console.error('Failed to persist session', err);
  }
}

export const authService = {
  async getSessionUser(): Promise<UserProfileDTO | null> {
    const sb = getSupabaseClient();
    if (sb) {
      const { data: sessionData } = await sb.auth.getSession();
      const authUser = sessionData.session?.user;
      if (!authUser) return null;

      const { data: profile } = await sb
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      const { data: addrRows } = await sb
        .from('user_addresses')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: true });

      const addresses = (addrRows || []).map(mapDbAddressToDto);
      if (profile) {
        return mapDbProfileToDto(profile, addresses);
      }
    }
    return loadLocalCurrentUser();
  },

  async signInWithPassword(
    emailOrUsername: string,
    password: string
  ): Promise<ServiceResult<UserProfileDTO>> {
    const cleanInput = emailOrUsername.trim().toLowerCase();
    const sb = getSupabaseClient();

    if (sb && cleanInput.includes('@')) {
      const { data, error } = await sb.auth.signInWithPassword({
        email: cleanInput,
        password,
      });

      if (error || !data.user) {
        return {
          success: false,
          error: error?.message || 'Gagal masuk. Silakan periksa kembali email dan kata sandi Anda.',
        };
      }

      const userProfile = await this.getSessionUser();
      if (userProfile) {
        return { success: true, data: userProfile };
      }
    }

    const users = getLocalStoredUsers();
    const found = users.find(
      (u) =>
        u.email.toLowerCase() === cleanInput ||
        u.username?.toLowerCase() === cleanInput.replace(/^@/, '') ||
        (u.phone && u.phone.replace(/\s+/g, '') === cleanInput.replace(/\s+/g, ''))
    );

    if (!found) {
      return { success: false, error: 'Akun tidak ditemukan. Silakan periksa kembali email Anda.' };
    }

    if (found.password && password && found.password !== password) {
      return { success: false, error: 'Kata sandi tidak sesuai. Silakan periksa kembali.' };
    }

    return { success: true, data: found };
  },

  async signUp(payload: RegisterRequestPayload): Promise<ServiceResult<UserProfileDTO>> {
    const cleanEmail = payload.email.trim().toLowerCase();
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const username = (payload.username || payload.name.toLowerCase().replace(/[^a-z0-9]/g, '_')).trim();
    const sb = getSupabaseClient();

    if (sb && payload.password) {
      const { data, error } = await sb.auth.signUp({
        email: cleanEmail,
        password: payload.password,
      });

      if (error || !data.user) {
        return {
          success: false,
          error: error?.message || 'Pendaftaran gagal. Silakan coba kembali.',
        };
      }

      const profileInsert = {
        id: data.user.id,
        name: payload.name.trim(),
        email: cleanEmail,
        phone: payload.phone || '+62 812 3456 7890',
        username,
        auth_provider: 'email',
        bias: payload.bias || 'Faril',
        bias_emoji: payload.biasEmoji || '🦋',
        membership_tier: 'Verified MUSES CIRCLE',
        membership_number: `MUSES-${randomDigits}`,
      };

      await sb.from('profiles').upsert(profileInsert);

      if (payload.initialAddress) {
        await sb.from('user_addresses').insert({
          user_id: data.user.id,
          label: payload.initialAddress.label || 'Rumah',
          recipient_name: payload.initialAddress.recipientName,
          phone: payload.initialAddress.phone,
          street: payload.initialAddress.street,
          district: payload.initialAddress.district,
          city: payload.initialAddress.city,
          province: payload.initialAddress.province,
          postal_code: payload.initialAddress.postalCode,
          detail: payload.initialAddress.detail,
          is_default: true,
        });
      }

      const profile = await this.getSessionUser();
      if (profile) {
        return { success: true, data: profile };
      }
    }

    const users = getLocalStoredUsers();
    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'Akun dengan email ini sudah terdaftar.' };
    }

    const formattedDate = new Date().toLocaleDateString('id-ID', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const initialAddresses: UserAddressDTO[] = [];
    let selectedAddressId: string | undefined;

    if (payload.initialAddress) {
      const addrId = `addr_${Date.now()}`;
      initialAddresses.push({
        ...payload.initialAddress,
        id: addrId,
        isDefault: true,
      });
      selectedAddressId = addrId;
    }

    const newUser: UserProfileDTO & { password?: string } = {
      id: `muses_${Date.now()}`,
      name: payload.name.trim(),
      email: cleanEmail,
      phone: payload.phone || '+62 812 3456 7890',
      password: payload.password,
      username,
      bias: payload.bias || 'Faril',
      biasEmoji: payload.biasEmoji || '🦋',
      membershipTier: 'Verified MUSES CIRCLE',
      membershipNumber: `MUSES-${randomDigits}`,
      joinedAt: formattedDate,
      addresses: initialAddresses,
      selectedAddressId,
    };

    users.push(newUser);
    saveLocalUsers(users);
    return { success: true, data: newUser };
  },

  requestOtpSync(email: string): { success: boolean; testCode: string; message: string } {
    const cleanEmail = email.trim().toLowerCase();
    const testCode = '123456';
    const expiresAt = Date.now() + 5 * 60 * 1000;

    const otpData: StoredOtp = {
      email: cleanEmail,
      code: testCode,
      expiresAt,
      attempts: 0,
    };

    try {
      sessionStorage.setItem(`otp_${cleanEmail}`, JSON.stringify(otpData));
    } catch {}

    const sb = getSupabaseClient();
    if (sb) {
      sb.auth.signInWithOtp({ email: cleanEmail }).catch(() => {});
    }

    return {
      success: true,
      testCode,
      message: `Kode verifikasi 6 digit telah dikirim ke ${cleanEmail}. Gunakan kode: ${testCode}`,
    };
  },

  verifyOtpSync(
    email: string,
    inputCode: string
  ): { success: boolean; error?: string; user?: UserProfileDTO } {
    const cleanEmail = email.trim().toLowerCase();
    let otpData: StoredOtp | null = null;

    try {
      const raw = sessionStorage.getItem(`otp_${cleanEmail}`);
      if (raw) otpData = JSON.parse(raw);
    } catch {}

    if (!otpData) {
      if (inputCode === '123456') {
        otpData = { email: cleanEmail, code: '123456', expiresAt: Date.now() + 60000, attempts: 0 };
      } else {
        return {
          success: false,
          error: 'Sesi OTP tidak ditemukan atau telah kedaluwarsa. Silakan kirim ulang.',
        };
      }
    }

    if (Date.now() > otpData.expiresAt) {
      return {
        success: false,
        error: 'Kode OTP telah kedaluwarsa. Silakan kirim ulang kode baru.',
      };
    }

    if (otpData.attempts >= 5) {
      return {
        success: false,
        error: 'Batas percobaan (5x) terlampaui. Silakan minta kode verifikasi baru.',
      };
    }

    if (otpData.code !== inputCode.trim()) {
      otpData.attempts += 1;
      try {
        sessionStorage.setItem(`otp_${cleanEmail}`, JSON.stringify(otpData));
      } catch {}
      const remaining = 5 - otpData.attempts;
      return { success: false, error: `Kode OTP salah. Sisa kesempatan: ${remaining} kali.` };
    }

    try {
      sessionStorage.removeItem(`otp_${cleanEmail}`);
    } catch {}

    const sb = getSupabaseClient();
    if (sb) {
      sb.auth.verifyOtp({ email: cleanEmail, token: inputCode.trim(), type: 'email' }).catch(() => {});
    }

    const users = getLocalStoredUsers();
    let found = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!found) {
      const randomDigits = Math.floor(100000 + Math.random() * 900000);
      const initialName = cleanEmail
        .split('@')[0]
        .replace(/[._]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

      const newUser: UserProfileDTO = {
        id: `muses_${Date.now()}`,
        name: initialName,
        email: cleanEmail,
        phone: '+62 812 3456 7890',
        username: cleanEmail.split('@')[0],
        authProvider: 'email',
        bias: 'Faril',
        biasEmoji: '🦋',
        membershipTier: 'Official MUSES CIRCLE',
        membershipNumber: `MUSES-${randomDigits}`,
        joinedAt: new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        addresses: [
          {
            id: `addr_${Date.now()}`,
            label: 'Rumah',
            recipientName: initialName,
            phone: '+62 812 3456 7890',
            street: 'Jl. Melati No. 12',
            city: 'Jakarta',
            province: 'DKI Jakarta',
            postalCode: '12190',
            isDefault: true,
          },
        ],
        selectedAddressId: `addr_${Date.now()}`,
      };

      users.push(newUser);
      saveLocalUsers(users);
      found = newUser;
    }

    return { success: true, user: found };
  },

  loginWithGoogleSync(): { success: boolean; user: UserProfileDTO } {
    const sb = getSupabaseClient();
    if (sb && typeof window !== 'undefined') {
      sb.auth
        .signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin },
        })
        .catch(() => {});
    }

    const users = getLocalStoredUsers();
    const googleEmail = 'fan.muses@gmail.com';
    let found = users.find((u) => u.email.toLowerCase() === googleEmail);

    if (!found) {
      const randomDigits = Math.floor(100000 + Math.random() * 900000);
      const addrId = `addr_google_${Date.now()}`;
      const newUser: UserProfileDTO = {
        id: `muses_google_${Date.now()}`,
        name: 'Fahmi',
        email: googleEmail,
        phone: '+62 813 9876 5432',
        username: 'fahmi',
        authProvider: 'google',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
        bias: 'Faril',
        biasEmoji: '🦋',
        membershipTier: 'Verified Google CIRCLE',
        membershipNumber: `MUSES-G-${randomDigits}`,
        joinedAt: new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        addresses: [
          {
            id: addrId,
            label: 'Rumah',
            recipientName: 'Fahmi',
            phone: '+62 813 9876 5432',
            street: 'Jl. Sudirman Kav. 52',
            city: 'Jakarta Selatan',
            province: 'DKI Jakarta',
            postalCode: '12190',
            isDefault: true,
          },
        ],
        selectedAddressId: addrId,
      };
      users.push(newUser);
      saveLocalUsers(users);
      found = newUser;
    }

    return { success: true, user: found };
  },

  async signOut(): Promise<void> {
    const sb = getSupabaseClient();
    if (sb) {
      await sb.auth.signOut().catch(() => {});
    }
    persistLocalSession(null);
  },

  async syncProfileToRemote(user: UserProfileDTO): Promise<void> {
    const sb = getSupabaseClient();
    if (!sb) return;
    try {
      await sb
        .from('profiles')
        .update({
          name: user.name,
          phone: user.phone,
          username: user.username,
          bias: user.bias,
          bias_emoji: user.biasEmoji,
          selected_address_id: user.selectedAddressId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    } catch {}
  },

  async syncAddressToRemote(userId: string, address: UserAddressDTO): Promise<void> {
    const sb = getSupabaseClient();
    if (!sb) return;
    try {
      await sb.from('user_addresses').upsert({
        id: address.id.startsWith('addr_') ? undefined : address.id,
        user_id: userId,
        label: address.label,
        recipient_name: address.recipientName,
        phone: address.phone,
        street: address.street,
        district: address.district,
        city: address.city,
        province: address.province,
        postal_code: address.postalCode,
        detail: address.detail,
        is_default: address.isDefault,
      });
    } catch {}
  },

  async deleteAddressFromRemote(addressId: string): Promise<void> {
    const sb = getSupabaseClient();
    if (!sb) return;
    try {
      await sb.from('user_addresses').delete().eq('id', addressId);
    } catch {}
  },
};

