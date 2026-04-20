// =============================================================
// src/api/supabaseClient.js
//
// Drop-in replacement for base44Client.js
// מחקה בדיוק את ה-API של Base44 כדי שלא צריך לגעת בשאר הקוד
// =============================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnon);

// ---------------------------------------------------------------
// Table name map: Base44 entity name → Supabase table name
// ---------------------------------------------------------------
const TABLE = {
  Product:        'products',
  Customer:       'customers',
  Order:          'orders',
  OrderTemplate:  'order_templates',
  Debt:           'debts',
  Network:        'networks',
  Return:         'returns',
  PaymentHistory: 'payment_history',
  CRMContact:     'crm_contacts',
  Interaction:    'interactions',
  Category:       'categories',
  PriceGroup:     'price_groups',
  AppSettings:    'app_settings',
  User:           'users',
};

// ---------------------------------------------------------------
// Generic entity builder
// Mimics: base44.entities.X.list() / filter() / create() / update() / delete() / get()
// ---------------------------------------------------------------
function buildEntity(tableName) {
  return {
    // list(sortField, limit)  - e.g. list('-created_date', 100)
    async list(sort = '-created_at', limit = 1000) {
      const ascending = !sort.startsWith('-');
      const column    = sort.replace(/^-/, '').replace('created_date', 'created_at');

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order(column, { ascending })
        .limit(limit);

      if (error) throw error;
      return data ?? [];
    },

    // filter(conditions, sort, limit)
    // Base44 uses { field: value } for equality filters
    async filter(conditions = {}, sort = '-created_at', limit = 1000) {
      const ascending = !sort.startsWith('-');
      const column    = sort.replace(/^-/, '').replace('created_date', 'created_at');

      let query = supabase
        .from(tableName)
        .select('*')
        .order(column, { ascending })
        .limit(limit);

      for (const [key, value] of Object.entries(conditions)) {
        if (value === null || value === undefined) continue;
        query = query.eq(key, value);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },

    // get(id)
    async get(id) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },

    // create(obj)
    async create(obj) {
      const { data, error } = await supabase
        .from(tableName)
        .insert([obj])
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    // update(id, changes)
    async update(id, changes) {
      const { data, error } = await supabase
        .from(tableName)
        .update(changes)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    // delete(id)
    async delete(id) {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    },
  };
}

// ---------------------------------------------------------------
// AUTH - mimics base44.auth.*
// ---------------------------------------------------------------
const auth = {
  // Returns current user with role from public.users
  async me() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (!profile) return null;

    return {
      id:        profile.id,
      email:     profile.email,
      full_name: profile.full_name,
      role:      profile.role,
    };
  },

  logout(redirectUrl) {
    supabase.auth.signOut().then(() => {
      if (redirectUrl) {
        window.location.href = '/login';
      }
    });
  },

  redirectToLogin(returnUrl) {
    window.location.href = `/login?returnTo=${encodeURIComponent(returnUrl || '/')}`;
  },
};

// ---------------------------------------------------------------
// FUNCTIONS - mimics base44.functions.invoke(name, payload)
// Calls Supabase Edge Functions
// ---------------------------------------------------------------
const functions = {
  async invoke(name, payload = {}) {
    const { data, error } = await supabase.functions.invoke(name, {
      body: payload,
    });
    if (error) throw error;
    return data;
  },
};

// ---------------------------------------------------------------
// STORAGE - helper for product images
// ---------------------------------------------------------------
export const storage = {
  async uploadProductImage(file) {
    const ext      = file.name.split('.').pop();
    const fileName = `${Date.now()}.${ext}`;
    const path     = `products/${fileName}`;

    const { error } = await supabase.storage
      .from('product-images')
      .upload(path, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(path);

    return data.publicUrl;
  },
};

// ---------------------------------------------------------------
// Main export - same shape as base44 object
// ---------------------------------------------------------------
export const base44 = {
  entities: Object.fromEntries(
    Object.entries(TABLE).map(([entityName, tableName]) => [
      entityName,
      buildEntity(tableName),
    ])
  ),
  auth,
  functions,
};
