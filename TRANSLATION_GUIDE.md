# Complete Translation Guide

## Overview
This guide explains how to ensure ALL content in the application changes when a user selects a language.

## Current Status

### ✅ Fully Translated Pages
- Home Page (`src/app/page.tsx`)
- Chat Page (`src/app/chat/page.tsx`)
- Header Component (`src/components/layout/Header.tsx`)
- Footer Component (`src/components/layout/Footer.tsx`)
- Dashboard Page (`src/app/dashboard/page.tsx`) - **Just Updated**
- Appointments Page (`src/app/appointments/page.tsx`) - **Just Updated**

### ⏳ Pages Needing Translation
The following pages need to be updated to use translations:

1. **Services** (`src/app/services/page.tsx`)
2. **Dentists** (`src/app/dentists/page.tsx`)
3. **FAQs** (`src/app/faqs/page.tsx`)
4. **Profile** (`src/app/profile/page.tsx`)
5. **Payments** (`src/app/payments/page.tsx`)
6. **Documents** (`src/app/documents/page.tsx`)
7. **Referrals** (`src/app/referrals/page.tsx`)
8. **Recommendations** (`src/app/recommendations/page.tsx`)
9. **Notifications** (`src/app/notifications/page.tsx`)
10. **Insurance** (`src/app/insurance/page.tsx`)
11. **Prescriptions** (`src/app/prescriptions/page.tsx`)
12. **Compliance** (`src/app/compliance/page.tsx`)
13. **Support** (`src/app/support/page.tsx`)
14. **Auth Pages** (`src/app/auth/login/page.tsx`, `src/app/auth/register/page.tsx`)
15. And more...

## How to Translate a Page

### Step 1: Import useTranslation Hook

Add this import at the top of your page component:

```typescript
import { useTranslation } from 'react-i18next';
```

### Step 2: Initialize Translation Hook

Inside your component, add:

```typescript
const { t } = useTranslation();
```

### Step 3: Replace Hard-coded Text

Replace all hard-coded strings with translation keys:

**Before:**
```typescript
<h1>My Appointments</h1>
<p>Manage your dental appointments</p>
<button>Book Appointment</button>
```

**After:**
```typescript
<h1>{t('appointments.myAppointmentsTitle')}</h1>
<p>{t('appointments.subtitlePatient')}</p>
<button>{t('appointments.bookNew')}</button>
```

### Step 4: Add Translation Keys

Add the translation keys to all language files:
- `src/lib/i18n/locales/en.json`
- `src/lib/i18n/locales/es.json`
- `src/lib/i18n/locales/fr.json`
- `src/lib/i18n/locales/de.json`
- `src/lib/i18n/locales/zh.json`
- `src/lib/i18n/locales/ar.json`

### Step 5: Handle Dynamic Content

For dynamic content with variables:

```typescript
// Before
<p>Welcome, {user.firstName}</p>

// After
<p>{t('dashboard.welcomePatient', { name: user.firstName })}</p>
```

## Translation Key Structure

Translation keys are organized by page/section:

```json
{
  "common": {
    // Shared UI elements
  },
  "dashboard": {
    // Dashboard-specific translations
  },
  "appointments": {
    // Appointments-specific translations
  },
  "services": {
    // Services-specific translations
  }
}
```

## Example: Translating Services Page

### 1. Update the Component

```typescript
'use client';

import { useTranslation } from 'react-i18next';
// ... other imports

export default function ServicesPage() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('services.title')}</h1>
      <p>{t('services.subtitle')}</p>
      <input placeholder={t('services.searchPlaceholder')} />
      {/* ... rest of component */}
    </div>
  );
}
```

### 2. Add Translation Keys

Add to `en.json`:
```json
{
  "services": {
    "title": "Our Services",
    "subtitle": "Comprehensive dental care services",
    "searchPlaceholder": "Search services...",
    "noServices": "No services found"
  }
}
```

Add corresponding translations to other language files.

## Quick Translation Checklist

For each page:
- [ ] Import `useTranslation` hook
- [ ] Initialize `const { t } = useTranslation()`
- [ ] Replace all hard-coded strings with `t('key')`
- [ ] Add translation keys to all 6 language files
- [ ] Test language switching
- [ ] Verify RTL layout for Arabic

## Testing Translations

1. Start the development server: `npm run dev`
2. Navigate to any page
3. Click the language switcher in the header
4. Select a different language
5. Verify all text changes
6. Check that layout adjusts for RTL (Arabic)

## Important Notes

1. **Always use translation keys** - Never hard-code user-facing text
2. **Use fallback values** - `t('key', 'Fallback text')` provides a fallback if translation is missing
3. **Keep keys organized** - Group related translations together
4. **Test all languages** - Ensure translations work for all 6 supported languages
5. **Handle plurals** - Use i18next pluralization for count-based text
6. **Date/Time formatting** - Use locale-aware formatting functions

## Next Steps

To complete full translation coverage:

1. Update remaining pages one by one using the pattern above
2. Add missing translation keys as you encounter them
3. Test each page after translation
4. Consider using a translation management tool for easier maintenance

## Need Help?

Refer to:
- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Documentation](https://react.i18next.com/)
- Existing translated pages for examples

