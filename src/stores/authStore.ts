import { atom, computed } from 'nanostores';
import { withBase } from '../lib/paths';

export interface UserAddress {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  district?: string;
  postalCode: string;
  detail?: string;
  isDefault: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  username?: string;
  authProvider?: 'google' | 'email' | 'credentials';
  avatar?: string;
  bias?: string;
  biasEmoji?: string;
  membershipTier?: string;
  membershipNumber?: string;
  joinedAt?: string;
  addresses?: UserAddress[];
  selectedAddressId?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  username?: string;
  bias?: string;
  biasEmoji?: string;
  initialAddress?: Omit<UserAddress, 'id'>;
}

interface StoredOtp {
  email: string;
  code: string;
  expiresAt: number;
  attempts: number;
}

const DEFAULT_USERS: (User & { password?: string })[] = [
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
    id: 'user_muses_aulia',
    name: 'Aulia Rahma',
    email: 'aulia@email.com',
    password: 'muses2026',
    phone: '081234567890',
    username: 'aulia',
    authProvider: 'email',
    bias: 'Faril',
    biasEmoji: '☾',
    membershipTier: 'Official MUSES CIRCLE',
    membershipNumber: 'MSE-261023',
    joinedAt: '22 Oktober 2026',
    addresses: [
      {
        id: 'addr_aulia_1',
        label: 'Rumah',
        recipientName: 'Aulia Rahma',
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
    selectedAddressId: 'addr_aulia_1',
  },
];

function getStoredUsers(): (User & { password?: string })[] {
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

function saveUsers(users: (User & { password?: string })[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('muses_registered_users', JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save users', err);
  }
}

function loadInitialUser(): User | null {
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

export const currentUser = atom<User | null>(loadInitialUser());
export const isAuthenticated = computed(currentUser, (user) => Boolean(user));
export const isAuthModalOpen = atom<boolean>(false);

if (typeof window !== 'undefined') {
  currentUser.subscribe((user) => {
    try {
      if (user) {
        localStorage.removeItem('muses_is_logged_out');
        localStorage.setItem('muses_current_user', JSON.stringify(user));
        const users = getStoredUsers();
        const idx = users.findIndex((u) => u.id === user.id || u.email === user.email);
        if (idx > -1) {
          users[idx] = { ...users[idx], ...user };
          saveUsers(users);
        }
      } else {
        localStorage.setItem('muses_is_logged_out', 'true');
        localStorage.removeItem('muses_current_user');
      }
    } catch (err) {
      console.error('Failed to update current user session', err);
    }
  });
}

export function requestOtp(email: string): { success: boolean; testCode: string; message: string } {
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

  return {
    success: true,
    testCode,
    message: `Kode verifikasi 6 digit telah dikirim ke ${cleanEmail}. Gunakan kode: ${testCode}`,
  };
}

export function verifyOtp(email: string, inputCode: string): { success: boolean; error?: string; user?: User } {
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
      return { success: false, error: 'Sesi OTP tidak ditemukan atau telah kedaluwarsa. Silakan kirim ulang.' };
    }
  }

  if (Date.now() > otpData.expiresAt) {
    return { success: false, error: 'Kode OTP telah kedaluwarsa. Silakan kirim ulang kode baru.' };
  }

  if (otpData.attempts >= 5) {
    return { success: false, error: 'Batas percobaan (5x) terlampaui. Silakan minta kode verifikasi baru.' };
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

  const users = getStoredUsers();
  let found = users.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!found) {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const initialName = cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    const newUser: User = {
      id: `muses_${Date.now()}`,
      name: initialName,
      email: cleanEmail,
      phone: '+62 812 3456 7890',
      username: cleanEmail.split('@')[0],
      authProvider: 'email',
      bias: 'Aria',
      biasEmoji: '✦',
      membershipTier: 'Official MUSES CIRCLE',
      membershipNumber: `MUSES-${randomDigits}`,
      joinedAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
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
    saveUsers(users);
    found = newUser;
  }

  currentUser.set(found);
  return { success: true, user: found };
}

export function loginWithGoogle(): { success: boolean; user: User } {
  const users = getStoredUsers();
  const googleEmail = 'fan.muses@gmail.com';
  let found = users.find((u) => u.email.toLowerCase() === googleEmail);

  if (!found) {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const newUser: User = {
      id: `muses_google_${Date.now()}`,
      name: 'Bintang Pratama',
      email: googleEmail,
      phone: '+62 813 9876 5432',
      username: 'bintang_pratama',
      authProvider: 'google',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
      bias: 'Stella',
      biasEmoji: '✧',
      membershipTier: 'Verified Google CIRCLE',
      membershipNumber: `MUSES-G-${randomDigits}`,
      joinedAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      addresses: [
        {
          id: `addr_google_${Date.now()}`,
          label: 'Rumah',
          recipientName: 'Bintang Pratama',
          phone: '+62 813 9876 5432',
          street: 'Jl. Sudirman Kav. 52',
          city: 'Jakarta Selatan',
          province: 'DKI Jakarta',
          postalCode: '12190',
          isDefault: true,
        },
      ],
      selectedAddressId: `addr_google_${Date.now()}`,
    };
    users.push(newUser);
    saveUsers(users);
    found = newUser;
  }

  currentUser.set(found);
  return { success: true, user: found };
}

export function logoutUser(redirectToAuth = false) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('muses_is_logged_out', 'true');
    localStorage.removeItem('muses_current_user');
  }
  currentUser.set(null);
  if (redirectToAuth && typeof window !== 'undefined') {
    window.location.href = withBase('/auth');
  }
}

export function updateUserProfile(updates: Partial<User>) {
  const user = currentUser.get();
  if (!user) return;
  const updated = { ...user, ...updates };
  currentUser.set(updated);
}

export function addUserAddress(addressData: Omit<UserAddress, 'id'>): UserAddress {
  const user = currentUser.get();
  const newAddr: UserAddress = {
    ...addressData,
    id: `addr_${Date.now()}`,
  };

  if (!user) {
    const guestUser: User = {
      id: `guest_${Date.now()}`,
      name: addressData.recipientName || 'MUSES Guest',
      email: 'guest@muses.id',
      phone: addressData.phone,
      username: 'guest_muses',
      addresses: [{ ...newAddr, isDefault: true }],
      selectedAddressId: newAddr.id,
    };
    currentUser.set(guestUser);
    return newAddr;
  }

  const currentAddresses = user.addresses || [];
  let updatedList = [...currentAddresses];

  if (newAddr.isDefault || updatedList.length === 0) {
    newAddr.isDefault = true;
    updatedList = updatedList.map((a) => ({ ...a, isDefault: false }));
  }

  updatedList.push(newAddr);
  currentUser.set({
    ...user,
    addresses: updatedList,
    selectedAddressId: newAddr.id,
  });
  return newAddr;
}

export function updateUserAddress(id: string, updates: Partial<UserAddress>) {
  const user = currentUser.get();
  if (!user || !user.addresses) return;

  const updatedList = user.addresses.map((addr) => {
    if (addr.id === id) {
      return { ...addr, ...updates };
    }
    if (updates.isDefault) {
      return { ...addr, isDefault: false };
    }
    return addr;
  });

  currentUser.set({
    ...user,
    addresses: updatedList,
    selectedAddressId: updates.isDefault ? id : user.selectedAddressId,
  });
}

export function deleteUserAddress(id: string) {
  const user = currentUser.get();
  if (!user || !user.addresses) return;

  const updatedList = user.addresses.filter((a) => a.id !== id);
  let newSelected = user.selectedAddressId;

  if (newSelected === id) {
    newSelected = updatedList[0]?.id;
  }

  currentUser.set({
    ...user,
    addresses: updatedList,
    selectedAddressId: newSelected,
  });
}

export function updateUserRecipient(name: string, email: string, phone: string) {
  const user = currentUser.get();
  if (!user) return;
  currentUser.set({
    ...user,
    name,
    email,
    phone,
  });
}

export function registerUser(payload: RegisterPayload): { success: boolean; error?: string; user?: User } {
  const users = getStoredUsers();
  const cleanEmail = payload.email.trim().toLowerCase();

  if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    return { success: false, error: 'Akun dengan email ini sudah terdaftar.' };
  }

  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  const now = new Date();
  const formattedDate = now.toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' });

  const initialAddresses: UserAddress[] = [];
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

  const newUser: User & { password?: string } = {
    id: `muses_${Date.now()}`,
    name: payload.name.trim(),
    email: cleanEmail,
    phone: payload.phone || '+62 812 3456 7890',
    password: payload.password,
    username: (payload.username || payload.name.toLowerCase().replace(/[^a-z0-9]/g, '_')).trim(),
    bias: payload.bias || 'Aria',
    biasEmoji: payload.biasEmoji || '✦',
    membershipTier: 'Verified MUSES CIRCLE',
    membershipNumber: `MUSES-${randomDigits}`,
    joinedAt: formattedDate,
    addresses: initialAddresses,
    selectedAddressId,
  };

  users.push(newUser);
  saveUsers(users);
  currentUser.set(newUser);
  return { success: true, user: newUser };
}

export function loginUser(emailOrUsername: string, pass: string): { success: boolean; error?: string; user?: User } {
  const users = getStoredUsers();
  const cleanInput = emailOrUsername.trim().toLowerCase();

  const found = users.find(
    (u) =>
      u.email.toLowerCase() === cleanInput ||
      u.username?.toLowerCase() === cleanInput.replace(/^@/, '') ||
      (u.phone && u.phone.replace(/\s+/g, '') === cleanInput.replace(/\s+/g, ''))
  );

  if (!found) {
    return { success: false, error: 'Akun tidak ditemukan. Silakan periksa kembali email Anda.' };
  }

  if (found.password && pass && found.password !== pass) {
    return { success: false, error: 'Kata sandi tidak sesuai. Silakan periksa kembali.' };
  }

  currentUser.set(found);
  return { success: true, user: found };
}

export function setSelectedAddress(id: string) {
  const user = currentUser.get();
  if (!user) return;
  currentUser.set({
    ...user,
    selectedAddressId: id,
  });
}
