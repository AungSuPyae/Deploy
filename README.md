cd NutriGen_Bot

environment:
cd backend
npm install
firebase login
firebase use --add
cd ../frontend
npm install





backend:
cd D:\SEPM\NutriGen_Bot\backend

download json file from firebase firestore first in project setting -> service account -> generate new private key, then move that file into backend/functions changing the name of serviceAccount in index.js following that file

firebase emulators:start



Frontend:
cd D:\SEPM\NutriGen_Bot\frontend
npm run dev

Project structure:

NutriGen_Bot/
│
├── backend/
│   ├── dataconnect/
│   │   ├── connector/
│   │   │   ├── connector.yaml
│   │   │   ├── mutations.gql
│   │   │   ├── queries.gql
│   │   ├── schema/
│   │   │   ├── schema.gql
│   │   │   ├── dataconnect.yaml
│   ├── functions/
│   │   ├── node_modules/
│   │   ├── .gitignore
│   │   ├── index.js
│   │   ├── package-lock.json
│   │   ├── package.json
│   ├── src/
│   │   ├── cacheResults.js
│   │   ├── calculateTDEE.js
│   │   ├── searchRecipe.js
│   ├── .firebaserc
│   ├── .gitignore
│   ├── firebase.json
│   ├── package-lock.json
│   ├── package.json
│
├── frontend/
│   ├── .next/
│   ├── node_modules/
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── file.svg
│   │   ├── globe.svg
│   │   ├── next.svg
│   │   ├── vercel.svg
│   │   ├── window.svg
│   ├── src/
│   │   ├── api/
│   │   │   ├── authService.js
│   │   │   ├── blogService.js
│   │   │   ├── getRecipe.js
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├──login.tsx
│   │   │   │   ├──signup.tsx
│   │   │   ├── components/
│   │   │   │   ├── common/
│   │   │   │   │   ├── footer.tsx
│   │   │   │   │   ├── header.tsx
│   │   │   │   │   ├── layout.tsx
│   │   │   ├── recipe/
│   │   │   │   ├──[id].tsx
│   │   │   ├── _app.tsx
│   │   │   ├── _document.tsx
│   │   │   ├── about.tsx
│   │   │   ├── index.tsx
│   │   ├── styles/
│   │   │   ├── globals.css
│   ├── .gitignore
│   ├── eslint.config.mjs
│   ├── next-env.d.ts
│   ├── next.config.mjs
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── postcss.config.mjs
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── netlify.toml
│   ├── README.md


Working scope of developer:

backend/
│── functions/                # Folder containing all auxiliary code
│   │── index.js              # Main declaration file of Firebase Functions <-- Write API Endpoints
│   │── package.json          # List of dependencies
│   │── .gitignore            # Gitignore file
│── src/                  # Contains supporting logic files
│   │   ├── auth.js           # Authentication handling (Login, Register)
│   │   ├── recipes.js        # API handling to get recipes
│   │   ├── firestore.js      # Functions that work with Firestore Database
│   │   ├── users.js          # User information management
│── firebase.json             # Firebase configuration
│── .firebaserc               # Firebase project link
│── package.json              # Common dependencies


📂 frontend
 ├── 📂 src
 │    ├── 📂 pages
 │    │    ├── 📄 index.tsx   <-- Home Page
 │    │    ├── 📄 login.tsx   <-- Login Page
 │    │    ├── 📄 about.tsx   <-- About Page
 │    ├── 📂 styles
 │    │    ├── 📄 globals.css  <-- Contains Tailwind CSS
 │    ├── 📂 api
 │    │    ├── 📄 getRecipe.js  <-- Sends request to backend API
