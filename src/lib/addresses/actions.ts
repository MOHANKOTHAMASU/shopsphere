'use server';

import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { Address } from '@/types/ecommerce';
import { memoryAddresses } from '@/lib/admin/store';
import { getDemoUserAction } from '@/lib/auth/actions';

const FALLBACK_DEFAULT_ADDRESS: Address = {
  id: 'addr-default-mock',
  userId: 'usr-demo-customer',
  fullName: 'Rahul Sharma',
  phone: '+91 98765 43210',
  street: '42, Brigade Metropolis, Whitefield Main Road',
  apartment: 'Tower B, Flat 804',
  city: 'Bengaluru',
  state: 'Karnataka',
  postalCode: '560048',
  country: 'India',
  isDefault: true,
  type: 'Home',
};

/**
 * Fetch saved delivery addresses for the authenticated customer
 */
export async function getAddressesAction(): Promise<{
  success: boolean;
  addresses: Address[];
}> {
  if (!isSupabaseConfigured()) {
    const demoUser = await getDemoUserAction();
    const currentUserId = demoUser?.id || 'usr-demo-customer';

    const userAddresses = memoryAddresses.filter(
      (a) => a.userId === currentUserId || a.userId === 'usr-demo-customer'
    );

    if (userAddresses.length === 0) {
      const defaultAddr = { ...FALLBACK_DEFAULT_ADDRESS, userId: currentUserId };
      memoryAddresses.push(defaultAddr);
      return { success: true, addresses: [defaultAddr] };
    }

    return { success: true, addresses: userAddresses };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: true, addresses: [] };
    }

    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return { success: true, addresses: [{ ...FALLBACK_DEFAULT_ADDRESS, userId: user.id }] };
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
    return { success: true, addresses: [FALLBACK_DEFAULT_ADDRESS] };
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
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        if (isDefault) {
          // If setting this address as default, unset other addresses
          await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
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
            .eq('user_id', user.id)
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
              user_id: user.id,
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
      }
    } catch {
      // ignore
    }
  }

  // Fallback memory persistence
  const demoUser = await getDemoUserAction();
  const currentUserId = demoUser?.id || 'usr-demo-customer';

  if (isDefault) {
    memoryAddresses.forEach((a) => {
      if (a.userId === currentUserId) a.isDefault = false;
    });
  }

  if (addressData.id) {
    const existingIndex = memoryAddresses.findIndex((a) => a.id === addressData.id);
    if (existingIndex !== -1) {
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
 */
export async function deleteAddressAction(addressId: string): Promise<{ success: boolean }> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase.from('addresses').delete().eq('id', addressId).eq('user_id', user.id);
      }
    } catch {
      // ignore
    }
  }

  // Memory store deletion
  const index = memoryAddresses.findIndex((a) => a.id === addressId);
  if (index !== -1) {
    memoryAddresses.splice(index, 1);
  }

  return { success: true };
}
