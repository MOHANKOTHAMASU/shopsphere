'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  CheckCircle2,
  Trash2,
  Edit2,
  MapPin,
  Home,
  Briefcase,
  Layers,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Address } from '@/types/ecommerce';
import {
  getAddressesAction,
  saveAddressAction,
  deleteAddressAction,
} from '@/lib/addresses/actions';

export default function CustomerAddressesPage() {
  const { user, profile } = useAuth();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [apartment, setApartment] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Karnataka');
  const [postalCode, setPostalCode] = useState('');
  const [type, setType] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [isDefault, setIsDefault] = useState(false);

  const fetchAddresses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAddressesAction();
      if (res.success) {
        setAddresses(res.addresses);
      }
    } catch {
      setError('Unable to load saved addresses.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    getAddressesAction()
      .then((res) => {
        if (isMounted) {
          if (res.success) {
            setAddresses(res.addresses);
          }
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError('Unable to load saved addresses.');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const openAddForm = () => {
    setEditingId(null);
    setFullName(profile?.full_name || user?.user_metadata?.full_name || '');
    setPhone(profile?.phone || '');
    setStreet('');
    setApartment('');
    setCity('');
    setState('Karnataka');
    setPostalCode('');
    setType('Home');
    setIsDefault(addresses.length === 0);
    setError(null);
    setSuccessMessage(null);
    setIsFormOpen(true);
  };

  const openEditForm = (addr: Address) => {
    setEditingId(addr.id);
    setFullName(addr.fullName);
    setPhone(addr.phone);
    setStreet(addr.street);
    setApartment(addr.apartment || '');
    setCity(addr.city);
    setState(addr.state);
    setPostalCode(addr.postalCode);
    setType(addr.type || 'Home');
    setIsDefault(!!addr.isDefault);
    setError(null);
    setSuccessMessage(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !street || !city || !postalCode) {
      setError('Please fill in all required address fields.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await saveAddressAction({
        id: editingId || undefined,
        fullName,
        phone,
        street,
        apartment: apartment || undefined,
        city,
        state,
        postalCode,
        country: 'India',
        isDefault,
        type,
      });

      if (res.success && res.address) {
        setSuccessMessage(
          editingId ? 'Address updated successfully.' : 'New address saved successfully.'
        );
        handleCloseForm();
        await fetchAddresses();
      } else {
        setError(res.error || 'Failed to save address.');
      }
    } catch {
      setError('An error occurred while saving the address.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (addressId: string) => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await deleteAddressAction(addressId);
      setSuccessMessage('Address removed successfully.');
      await fetchAddresses();
    } catch {
      setError('Failed to delete address.');
      setIsLoading(false);
    }
  };

  const handleSetDefault = async (addr: Address) => {
    if (addr.isDefault) return;
    setIsLoading(true);
    try {
      await saveAddressAction({
        ...addr,
        isDefault: true,
      });
      setSuccessMessage(`Set ${addr.fullName}'s address as default.`);
      await fetchAddresses();
    } catch {
      setError('Failed to update default address.');
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Saved Delivery Addresses</h1>
          <p className="text-xs text-slate-500">
            Manage your doorstep shipping locations for fast, seamless 1-click checkout
          </p>
        </div>

        <button
          onClick={openAddForm}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Address</span>
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Add / Edit Address Form */}
      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="p-6 rounded-2xl bg-slate-50 border border-indigo-200 space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-indigo-600" />
              <span>{editingId ? 'Edit Delivery Address' : 'Enter New Delivery Address'}</span>
            </h3>
            <button
              type="button"
              onClick={handleCloseForm}
              className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="Receiver name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mobile Phone *</label>
              <input
                type="tel"
                required
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Street Address *</label>
              <input
                type="text"
                required
                placeholder="Flat / Building name, street name, locality"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Apartment / Floor / Landmark (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Tower B, Flat 804, Near City Center"
                value={apartment}
                onChange={(e) => setApartment(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">City *</label>
              <input
                type="text"
                required
                placeholder="e.g. Bengaluru"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">State *</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800"
              >
                <option value="Karnataka">Karnataka</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Delhi">Delhi NCR</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Telangana">Telangana</option>
                <option value="Gujarat">Gujarat</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
                <option value="West Bengal">West Bengal</option>
                <option value="Kerala">Kerala</option>
                <option value="Rajasthan">Rajasthan</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">PIN Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. 560048"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Address Type</label>
              <div className="flex gap-2">
                {(['Home', 'Work', 'Other'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex-1 h-10 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      type === t
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-300 bg-white text-slate-600'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isDefaultCheckbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="isDefaultCheckbox" className="text-xs font-semibold text-slate-700">
              Make this my default shipping address
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={handleCloseForm}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{editingId ? 'Save Changes' : 'Save Address'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3">
          <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading your saved addresses...</p>
        </div>
      ) : addresses.length === 0 ? (
        /* Empty State */
        <div className="py-12 text-center max-w-sm mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
            <MapPin className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No Saved Addresses</h3>
            <p className="text-xs text-slate-500 mt-1">
              Add your home or office address to enable instant doorstep delivery during checkout.
            </p>
          </div>
          <button
            onClick={openAddForm}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Address Now</span>
          </button>
        </div>
      ) : (
        /* Addresses Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((addr) => {
            const TypeIcon = addr.type === 'Work' ? Briefcase : addr.type === 'Other' ? Layers : Home;

            return (
              <div
                key={addr.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                  addr.isDefault
                    ? 'bg-indigo-50/40 border-indigo-300 shadow-xs'
                    : 'bg-white border-slate-200/90 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded flex items-center gap-1">
                      <TypeIcon className="w-3 h-3" />
                      <span>{addr.type || 'Home'}</span>
                    </span>

                    {addr.isDefault ? (
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Default</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetDefault(addr)}
                        className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                      >
                        Set as Default
                      </button>
                    )}
                  </div>

                  <h4 className="font-bold text-sm text-slate-900">{addr.fullName}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {addr.apartment ? `${addr.apartment}, ` : ''}
                    {addr.street}
                    <br />
                    {addr.city}, {addr.state} - {addr.postalCode}
                  </p>
                  <p className="text-xs text-slate-700 font-mono mt-2 font-medium">
                    Phone: {addr.phone}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
                  <button
                    onClick={() => openEditForm(addr)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 font-semibold text-slate-600 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 font-semibold text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
