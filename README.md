# The Sprint Execution 2026 – 1.0

A complete, production-ready landing and lead capture web application for the 90-day accountability challenge.

## Tech Stack
- **Frontend**: React (Vite)
- **Styling**: Tailwind CSS 4.0
- **Animations**: Framer Motion
- **Database**: Google Firebase Firestore
- **Hosting**: Firebase Hosting

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory and add your Firebase credentials:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```
*(Refer to `.env.example` for the full list including other constants).*

### 3. Development
Run the app locally in development mode:
```bash
npm run dev
```

### 4. Build for Production
Create an optimized production build in the `dist` folder:
```bash
npm run build
```

### 5. Deploy to Firebase
Deploy the build to Firebase Hosting:
```bash
firebase deploy --only hosting
```

## Security & Database
Leads are stored in the `sprint_leads` collection in Firestore. Access is restricted via `firestore.rules` to ensure only write operations are allowed from the client, preventing data leaks.

## Customization
Update links and phone numbers in `src/constants.ts`:
- `PAYSTACK_LINK`: Your Paystack payment URL.
- `SELAR_LINK`: Your Selar payment URL.
- `WHATSAPP_NUMBER`: The WhatsApp number for payment confirmation.
