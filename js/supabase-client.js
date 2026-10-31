/**
 * Supabase Client Integration for Masar Al-Moallem Pro 2026
 * Handles Supabase Auth, Session Management, and Protected API synchronization.
 */
(function () {
  'use strict';

  const SUPABASE_CONFIG = {
    url: 'https://wnzmmkhoplcmelqzjskz.supabase.co',
    // Publishable public key (safe for client side)
    publishableKey: 'sb_publishable_qY2-rsMI9NwR6Q2AKF4h_Q_pz-UBlVp'
  };

  let supabaseClient = null;

  function initClient() {
    try {
      if (typeof supabase !== 'undefined' && supabase.createClient) {
        supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.publishableKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        });
        window.supabaseClient = supabaseClient;
        console.log('✅ Supabase client initialized successfully.');
      } else {
        console.warn('Supabase SDK not loaded yet. Retrying...');
      }
    } catch (e) {
      console.error('Failed to init Supabase client:', e);
    }
  }

  // Auto-init when SDK is ready
  if (typeof supabase !== 'undefined') {
    initClient();
  } else {
    window.addEventListener('DOMContentLoaded', initClient);
  }

  window.supabaseAuth = {
    getClient: function () {
      if (!supabaseClient) initClient();
      return supabaseClient;
    },

    getSession: async function () {
      const client = this.getClient();
      if (!client) return null;
      try {
        const { data, error } = await client.auth.getSession();
        if (error) throw error;
        return data.session;
      } catch (err) {
        console.warn('Supabase getSession notice:', err.message);
        return null;
      }
    },

    signIn: async function (email, password) {
      const client = this.getClient();
      if (!client) throw new Error('عميل Supabase غير متوفر حالياً');
      
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) throw error;
      if (data && data.session) {
        localStorage.setItem('supabase_access_token', data.session.access_token);
      }
      return data;
    },

    signUp: async function (email, password, metadata) {
      const client = this.getClient();
      if (!client) throw new Error('عميل Supabase غير متوفر حالياً');

      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: metadata || {}
        }
      });

      if (error) throw error;
      return data;
    },

    signOut: async function () {
      const client = this.getClient();
      localStorage.removeItem('supabase_access_token');
      if (client) {
        try {
          await client.auth.signOut();
        } catch (e) {
          console.warn('Sign out notice:', e);
        }
      }
    },

    signInWithGoogle: async function () {
      const client = this.getClient();
      if (!client) throw new Error('عميل Supabase غير متوفر');

      const { data, error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) throw error;
      return data;
    }
  };
})();

