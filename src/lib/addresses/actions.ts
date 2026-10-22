'use server';

import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { Address } from '@/types/ecommerce';
import { memoryAddresses } from '@/lib/admin/store';
import { getDemoUserAction } from '@/lib/auth/actions';
import { getAuthenticatedCaller } from '@/lib/auth/admin-guard';

/**
 * Fetch saved delivery addresses for the authenticated customer
 * Strictly prevents customer-to-customer address visibility
 */
export async function getAddressesAction(): Promise<{
  success: boolean;
  addresses: Address[];
}> {
  const caller = await getAuthenticatedCaller();
  if (!caller) {
    return { success: false, addresses: [] };
  }

  if (!isSupabaseConfigured()) {
    const userAddresses = memoryAddresses.filter((a) => a.userId === caller.userId);
    return { success: true, addresses: userAddresses };
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', caller.userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return { success: true, addresses: [] };
    }

    const addresses: Address[] = data.map((row) => ({
      id: row.id,
      userId: row.user_id,
      fullName: row.full_name,
      phone: row.phone,
      street: row.street,
      apartment: row.apartment || undefined,
      city: row.city,
      state: row.state,
      postalCode: row.postal_code,
      country: row.country,
      isDefault: row.is_default,
      type: (row.type as 'Home' | 'Work' | 'Other') || 'Home',
    }));

    return { success: true, addresses };
  } catch {
    const userAddresses = memoryAddresses.filter((a) => a.userId === caller.userId);
    return { success: true, addresses: userAddresses };
  }
}

/**
 * Add or update a customer delivery address
 */
export async function saveAddressAction(addressData: {
  id?: string;
  fullName: string;
  phone: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  isDefault?: boolean;
  type?: 'Home' | 'Work' | 'Other';
}): Promise<{
  success: boolean;
  address?: Address;
  error?: string;
}> {
  const caller = await getAuthenticatedCaller();
  if (!caller) {
    return { success: false, error: 'Authentication required to save delivery addresses.' };
  }

  if (
    !addressData.fullName ||
    !addressData.phone ||
    !addressData.street ||
    !addressData.city ||
    !addressData.postalCode
  ) {
    return { success: false, error: 'Please provide all required address fields.' };
  }

  const country = addressData.country || 'India';
  const type = addressData.type || 'Home';
  const isDefault = !!addressData.isDefault;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();

      if (isDefault) {
        // If setting this address as default, unset other addresses
        await supabase.from('addresses').update({ is_default: false }).eq('user_id', caller.userId);
      }

        if (addressData.id && !addressData.id.startsWith('addr-default-mock')) {
          // Update existing
          const { data, error } = await supabase
            .from('addresses')
            .update({
              full_name: addressData.fullName,
              phone: addressData.phone,
              street: addressData.street,
              apartment: addressData.apartment || null,
              city: addressData.city,
              state: addressData.state,
              postal_code: addressData.postalCode,
              country,
              is_default: isDefault,
              type,
            })
            .eq('id', addressData.id)
            .eq('user_id', caller.userId)
            .select()
            .single();

          if (!error && data) {
            return {
              success: true,
              address: {
                id: data.id,
                userId: data.user_id,
                fullName: data.full_name,
                phone: data.phone,
                street: data.street,
                apartment: data.apartment || undefined,
                city: data.city,
                state: data.state,
                postalCode: data.postal_code,
                country: data.country,
                isDefault: data.is_default,
                type: (data.type as 'Home' | 'Work' | 'Other') || 'Home',
              },
            };
          }
        } else {
          // Insert new address
          const { data, error } = await supabase
            .from('addresses')
            .insert({
              user_id: caller.userId,
              full_name: addressData.fullName,
              phone: addressData.phone,
              street: addressData.street,
              apartment: addressData.apartment || null,
              city: addressData.city,
              state: addressData.state,
              postal_code: addressData.postalCode,
              country,
              is_default: isDefault,
              type,
            })
            .select()
            .single();

          if (!error && data) {
            return {
              success: true,
              address: {
                id: data.id,
                userId: data.user_id,
                fullName: data.full_name,
                phone: data.phone,
                street: data.street,
                apartment: data.apartment || undefined,
                city: data.city,
                state: data.state,
                postalCode: data.postal_code,
                country: data.country,
                isDefault: data.is_default,
                type: (data.type as 'Home' | 'Work' | 'Other') || 'Home',
              },
            };
          }
        }
    } catch {
      // ignore
    }
  }

  // Fallback memory persistence with strict caller ownership
  const currentUserId = caller.userId;

  if (isDefault) {
    memoryAddresses.forEach((a) => {
      if (a.userId === currentUserId) a.isDefault = false;
    });
  }

  if (addressData.id) {
    const existingIndex = memoryAddresses.findIndex((a) => a.id === addressData.id);
    if (existingIndex !== -1) {
      if (memoryAddresses[existingIndex].userId !== currentUserId) {
        return { success: false, error: 'Unauthorized: You do not have permission to modify this address.' };
      }
      const updatedAddr: Address = {
        ...memoryAddresses[existingIndex],
        fullName: addressData.fullName,
        phone: addressData.phone,
        street: addressData.street,
        apartment: addressData.apartment,
        city: addressData.city,
        state: addressData.state,
        postalCode: addressData.postalCode,
        country,
        isDefault,
        type,
      };
      memoryAddresses[existingIndex] = updatedAddr;
      return { success: true, address: updatedAddr };
    }
  }

  const newAddress: Address = {
    id: `addr-${Date.now()}`,
    userId: currentUserId,
    fullName: addressData.fullName,
    phone: addressData.phone,
    street: addressData.street,
    apartment: addressData.apartment,
    city: addressData.city,
    state: addressData.state,
    postalCode: addressData.postalCode,
    country,
    isDefault,
    type,
  };

  memoryAddresses.push(newAddress);
  return { success: true, address: newAddress };
}

/**
 * Delete a saved delivery address
 * Strictly verifies ownership before deleting
 */
export async function deleteAddressAction(addressId: string): Promise<{ success: boolean; error?: string }> {
  const caller = await getAuthenticatedCaller();
  if (!caller) {
    return { success: false, error: 'Authentication required to delete addresses.' };
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      await supabase.from('addresses').delete().eq('id', addressId).eq('user_id', caller.userId);
    } catch {
      // ignore
    }
  }

  // Memory store deletion with strict ownership check
  const index = memoryAddresses.findIndex((a) => a.id === addressId);
  if (index !== -1) {
    if (memoryAddresses[index].userId !== caller.userId) {
      return { success: false, error: 'Unauthorized: You do not have permission to delete this address.' };
    }
    memoryAddresses.splice(index, 1);
  }

  return { success: true };
}
