import { signInWithGoogle, getCachedAccessToken } from './firebase';

export interface GoogleContactItem {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
}

export async function fetchGoogleContacts(): Promise<GoogleContactItem[]> {
  try {
    let token = getCachedAccessToken();
    if (!token) {
      const res = await signInWithGoogle();
      if (!res) {
        // User closed or cancelled the popup window
        return [];
      }
      token = res?.accessToken || null;
    }

    if (!token) {
      return [];
    }

    const fetchContacts = async (accessToken: string) => {
      const response = await fetch(
        'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers,photos&pageSize=100',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      return response;
    };

    let response = await fetchContacts(token);

    if (!response.ok && response.status === 401) {
      // Retry with fresh popup login if unauthorized or expired token
      const freshRes = await signInWithGoogle();
      if (freshRes?.accessToken) {
        response = await fetchContacts(freshRes.accessToken);
      } else {
        return [];
      }
    }

    if (!response.ok) {
      console.warn(`Google Contacts API error (${response.status})`);
      return [];
    }

    const data = await response.json().catch(() => ({}));
    if (!data.connections || !Array.isArray(data.connections)) {
      return [];
    }

    return data.connections
      .map((person: any) => {
        const name = person.names?.[0]?.displayName || 'איש קשר ללא שם';
        const email = person.emailAddresses?.[0]?.value;
        const phone = person.phoneNumbers?.[0]?.value;
        const photoUrl = person.photos?.[0]?.url;
        const id = person.resourceName || `google_${Math.random().toString(36).substring(2, 9)}`;

        return {
          id,
          name,
          email,
          phone,
          photoUrl,
        };
      })
      .filter((c: GoogleContactItem) => c.name !== 'איש קשר ללא שם' || c.email || c.phone);
  } catch (err: any) {
    if (
      err?.code === 'auth/popup-closed-by-user' ||
      err?.code === 'auth/cancelled-popup-request' ||
      (typeof err?.message === 'string' && err.message.includes('popup-closed-by-user'))
    ) {
      console.warn('Google Contacts import cancelled: popup closed by user.');
      return [];
    }
    throw err;
  }
}
