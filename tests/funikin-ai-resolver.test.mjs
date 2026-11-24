import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Test mock / logic unit tests
describe('FunikIn AI Key Policy & Resolution Suite', () => {
  const mockServerEnv = {
    groqApiKey: 'server-groq-key',
    groqModel: 'llama-3.3-70b-versatile',
    geminiApiKeys: ['server-gemini-key-1', 'server-gemini-key-2'],
    geminiModel: 'gemini-1.5-flash',
  };

  function mockResolveAiKeyForActor({ actor, isPro, funikinUserId, userKeys, requiredProvider }) {
    if (isPro || actor.role === 'admin' || actor.role === 'superadmin' || actor.tier === 'pro') {
      if (requiredProvider === 'gemini') {
        return { isPro: true, apiKey: mockServerEnv.geminiApiKeys[0], provider: 'gemini', model: mockServerEnv.geminiModel };
      }
      return { isPro: true, apiKey: mockServerEnv.groqApiKey, provider: 'groq', model: mockServerEnv.groqModel };
    }

    // Akun Gratis
    if (!funikinUserId) {
      throw new Error('Akun gratis wajib menghubungkan akun FunikIn untuk menggunakan fitur AI. Silakan masuk atau hubungkan akun Anda dengan FunikIn di menu Akun, lalu atur API key Anda di auth.funikin.com (atau upgrade ke Akun Pro).');
    }

    if (requiredProvider === 'groq') {
      const key = userKeys?.groq;
      if (!key) {
        throw new Error('Akun gratis wajib memasukkan API Key Groq sendiri di auth.funikin.com untuk menggunakan fitur AI ini. Silakan kunjungi https://auth.funikin.com menu AI Key Management untuk menambahkan API key Anda (atau upgrade ke Akun Pro).');
      }
      return { isPro: false, apiKey: key, provider: 'groq', model: mockServerEnv.groqModel };
    }

    if (requiredProvider === 'gemini') {
      const key = userKeys?.gemini;
      if (!key) {
        throw new Error('Akun gratis wajib memasukkan API Key Google Gemini sendiri di auth.funikin.com untuk menggunakan fitur ini. Silakan kunjungi https://auth.funikin.com menu AI Key Management untuk menambahkan API key Anda (atau upgrade ke Akun Pro).');
      }
      return { isPro: false, apiKey: key, provider: 'gemini', model: mockServerEnv.geminiModel };
    }

    if (userKeys?.groq) {
      return { isPro: false, apiKey: userKeys.groq, provider: 'groq', model: mockServerEnv.groqModel };
    }
    if (userKeys?.gemini) {
      return { isPro: false, apiKey: userKeys.gemini, provider: 'gemini', model: mockServerEnv.geminiModel };
    }

    throw new Error('Akun gratis wajib mengatur API Key AI (Groq atau Google Gemini) sendiri di auth.funikin.com untuk menggunakan fitur ini. Buka https://auth.funikin.com menu AI Key Management untuk menambahkan API key Anda (atau upgrade ke Akun Pro).');
  }

  describe('1. Pro User AI Access', () => {
    it('User role admin otomatis menggunakan server AI key', () => {
      const actor = { id: 'admin-1', email: 'admin@responku.id', displayName: 'Admin', role: 'admin' };
      const creds = mockResolveAiKeyForActor({ actor, isPro: true, requiredProvider: 'groq' });
      assert.equal(creds.isPro, true);
      assert.equal(creds.apiKey, mockServerEnv.groqApiKey);
      assert.equal(creds.provider, 'groq');
    });

    it('User role superadmin otomatis menggunakan server AI key', () => {
      const actor = { id: 'super-1', email: 'super@responku.id', displayName: 'Super', role: 'superadmin' };
      const creds = mockResolveAiKeyForActor({ actor, isPro: true, requiredProvider: 'gemini' });
      assert.equal(creds.isPro, true);
      assert.equal(creds.apiKey, mockServerEnv.geminiApiKeys[0]);
      assert.equal(creds.provider, 'gemini');
    });

    it('User reader dengan tier: "pro" menggunakan server AI key tanpa butuh akun FunikIn', () => {
      const actor = { id: 'user-pro', email: 'pro@responku.id', displayName: 'Pro User', role: 'reader', tier: 'pro' };
      const creds = mockResolveAiKeyForActor({ actor, isPro: true, requiredProvider: 'groq' });
      assert.equal(creds.isPro, true);
      assert.equal(creds.apiKey, mockServerEnv.groqApiKey);
    });
  });

  describe('2. Free User without FunikIn Account Linked', () => {
    it('Menolak request AI jika akun gratis belum terhubung ke FunikIn', () => {
      const actor = { id: 'user-free-1', email: 'free@gmail.com', displayName: 'Free User', role: 'reader', tier: 'free' };
      assert.throws(
        () => mockResolveAiKeyForActor({ actor, isPro: false, funikinUserId: null, requiredProvider: 'groq' }),
        /Akun gratis wajib menghubungkan akun FunikIn/i
      );
    });
  });

  describe('3. Free User with FunikIn Linked but Missing AI Key', () => {
    it('Menolak jika belum ada API key Groq di auth.funikin.com saat butuh Groq', () => {
      const actor = { id: 'user-free-2', email: 'free2@gmail.com', displayName: 'Free User 2', role: 'reader', tier: 'free' };
      assert.throws(
        () => mockResolveAiKeyForActor({ actor, isPro: false, funikinUserId: 'uuid-funikin-123', userKeys: {}, requiredProvider: 'groq' }),
        /Akun gratis wajib memasukkan API Key Groq sendiri di auth\.funikin\.com/i
      );
    });

    it('Menolak jika hanya ada key OpenAI padahal sistem meminta Groq', () => {
      const actor = { id: 'user-free-3', email: 'free3@gmail.com', displayName: 'Free User 3', role: 'reader', tier: 'free' };
      assert.throws(
        () => mockResolveAiKeyForActor({ actor, isPro: false, funikinUserId: 'uuid-funikin-123', userKeys: { openai: 'sk-123' }, requiredProvider: 'groq' }),
        /Akun gratis wajib memasukkan API Key Groq sendiri di auth\.funikin\.com/i
      );
    });
  });

  describe('4. Free User with Active FunikIn Key', () => {
    it('Berhasil menggunakan API Key Groq milik user yang tersimpan di FunikIn', () => {
      const actor = { id: 'user-free-4', email: 'free4@gmail.com', displayName: 'Free User 4', role: 'reader', tier: 'free' };
      const userGroqKey = 'gsk_user_personal_key_999';
      const creds = mockResolveAiKeyForActor({
        actor,
        isPro: false,
        funikinUserId: 'uuid-funikin-123',
        userKeys: { groq: userGroqKey },
        requiredProvider: 'groq',
      });
      assert.equal(creds.isPro, false);
      assert.equal(creds.apiKey, userGroqKey);
      assert.equal(creds.provider, 'groq');
    });

    it('Berhasil menggunakan API Key Gemini milik user yang tersimpan di FunikIn', () => {
      const actor = { id: 'user-free-5', email: 'free5@gmail.com', displayName: 'Free User 5', role: 'reader', tier: 'free' };
      const userGeminiKey = 'AIzaSy_user_personal_key_888';
      const creds = mockResolveAiKeyForActor({
        actor,
        isPro: false,
        funikinUserId: 'uuid-funikin-123',
        userKeys: { gemini: userGeminiKey },
        requiredProvider: 'gemini',
      });
      assert.equal(creds.isPro, false);
      assert.equal(creds.apiKey, userGeminiKey);
      assert.equal(creds.provider, 'gemini');
    });
  });
});
