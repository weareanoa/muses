import { atom, computed } from 'nanostores';
import { withBase } from '../lib/paths';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  authService,
  loadLocalCurrentUser,
  persistLocalSession,
  getLocalStoredUsers,
  saveLocalUsers,
  type RegisterRequestPayload,
} from '../services/authService';
import type { UserProfileDTO, UserAddressDTO } from '../types/database';

export type UserAddress = UserAddressDTO;
export type User = UserProfileDTO;
export type RegisterPayload = RegisterRequestPayload;

export const currentUser = atom<User | null>(loadLocalCurrentUser());
export const isAuthenticated = computed(currentUser, (user) => Boolean(user));
export const isAuthModalOpen = atom<boolean>(false);

if (typeof window !== 'undefined') {
  currentUser.subscribe((user) => {
    persistLocalSession(user);
    if (user) {
      authService.syncProfileToRemote(user);
    }
  });

  if (isSupabaseConfigured()) {
    authService.getSessionUser().then((remoteUser) => {
      if (remoteUser) {
        currentUser.set(remoteUser);
      }
    });
  }
}

export function requestOtp(email: string): { success: boolean; testCode: string; message: string } {
  return authService.requestOtpSync(email);
}

export function verifyOtp(
  email: string,
  inputCode: string
): { success: boolean; error?: string; user?: User } {
  const result = authService.verifyOtpSync(email, inputCode);
  if (result.success && result.user) {
    currentUser.set(result.user);
  }
  return result;
}

export async function loginWithGoogle(): Promise<{
  success: boolean;
  error?: string;
}> {
  return authService.loginWithGoogle();
}

export function logoutUser(redirectToAuth = false) {
  authService.signOut();
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

  authService.syncAddressToRemote(user.id, newAddr);
  return newAddr;
}

export function updateUserAddress(id: string, updates: Partial<UserAddress>) {
  const user = currentUser.get();
  if (!user || !user.addresses) return;

  let updatedTarget: UserAddress | null = null;
  const updatedList = user.addresses.map((addr) => {
    if (addr.id === id) {
      updatedTarget = { ...addr, ...updates };
      return updatedTarget;
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

  if (updatedTarget) {
    authService.syncAddressToRemote(user.id, updatedTarget);
  }
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

  authService.deleteAddressFromRemote(id);
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

export function registerUser(payload: RegisterPayload): {
  success: boolean;
  error?: string;
  user?: User;
} {
  const users = getLocalStoredUsers();
  const cleanEmail = payload.email.trim().toLowerCase();

  if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    return { success: false, error: 'Akun dengan email ini sudah terdaftar.' };
  }

  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  const now = new Date();
  const formattedDate = now.toLocaleDateString('id-ID', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

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
  currentUser.set(newUser);

  authService.signUp(payload).catch(() => {});
  return { success: true, user: newUser };
}

export function loginUser(
  emailOrUsername: string,
  pass: string
): { success: boolean; error?: string; user?: User } {
  const users = getLocalStoredUsers();
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
  authService.signInWithPassword(emailOrUsername, pass).catch(() => {});
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
