# Integrazione OAuth2 - Guida Frontend

Questa guida spiega come integrare l'autenticazione Google OAuth2 nel tuo frontend.

## Panoramica del Flusso

```
1. User clicks "Login with Google" button
   ↓
2. Frontend redirects to: GET /api/auth/google
   ↓
3. Backend redirects to Google's authorization page
   ↓
4. User authorizes the application
   ↓
5. Google redirects to: GET /api/auth/google/callback
   ↓
6. Backend processes the authentication and creates/links user
   ↓
7. Backend redirects to: FRONTEND_URL/oauth/callback?token=JWT_TOKEN
   ↓
8. Frontend extracts and stores the token
```

## Implementazione Frontend

### HTML/JavaScript Vanilla

```html
<!-- Login Page -->
<!DOCTYPE html>
<html>
  <head>
    <title>Login</title>
  </head>
  <body>
    <h1>Login</h1>

    <!-- Autenticazione Classica -->
    <form id="loginForm">
      <input type="email" name="email" placeholder="Email" required />
      <input type="password" name="password" placeholder="Password" required />
      <button type="submit">Login</button>
    </form>

    <!-- OAuth Google -->
    <div>
      <p>oppure</p>
      <a href="http://localhost:3000/api/auth/google">
        <button>Accedi con Google</button>
      </a>
    </div>

    <script>
      // Gestione login classico
      document
        .getElementById("loginForm")
        .addEventListener("submit", async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target);

          const response = await fetch(
            "http://localhost:3000/api/users/login",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: formData.get("email"),
                password: formData.get("password"),
              }),
            }
          );

          const data = await response.json();

          if (data.success) {
            localStorage.setItem("token", data.data.token);
            window.location.href = "/dashboard";
          } else {
            alert("Login fallito: " + data.message);
          }
        });
    </script>
  </body>
</html>
```

```html
<!-- OAuth Callback Page -->
<!DOCTYPE html>
<html>
  <head>
    <title>Autenticazione...</title>
  </head>
  <body>
    <h1>Autenticazione in corso...</h1>
    <script>
      // Estrai il token dall'URL
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");
      const error = urlParams.get("error");

      if (error) {
        alert("Errore durante l'autenticazione: " + error);
        window.location.href = "/login";
      } else if (token) {
        // Salva il token
        localStorage.setItem("token", token);

        // Redirect alla dashboard
        window.location.href = "/dashboard";
      } else {
        alert("Nessun token ricevuto");
        window.location.href = "/login";
      }
    </script>
  </body>
</html>
```

### React

```jsx
// LoginPage.jsx
import React from "react";
import { useState } from "react";

const BACKEND_URL = "http://localhost:3000";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleClassicLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(`${BACKEND_URL}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("token", data.data.token);
        window.location.href = "/dashboard";
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Errore durante il login");
    }
  };

  const handleGoogleLogin = () => {
    // Redirect alla pagina di autenticazione Google
    window.location.href = `${BACKEND_URL}/api/auth/google`;
  };

  return (
    <div className="login-container">
      <h1>Login</h1>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleClassicLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>

      <div className="divider">oppure</div>

      <button onClick={handleGoogleLogin} className="google-login-btn">
        <img src="/google-icon.svg" alt="Google" />
        Accedi con Google
      </button>
    </div>
  );
}

export default LoginPage;
```

```jsx
// OAuthCallback.jsx
import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error) {
      alert(`Errore durante l'autenticazione: ${error}`);
      navigate("/login");
    } else if (token) {
      // Salva il token
      localStorage.setItem("token", token);

      // Redirect alla dashboard
      navigate("/dashboard");
    } else {
      alert("Nessun token ricevuto");
      navigate("/login");
    }
  }, [searchParams, navigate]);

  return (
    <div className="oauth-callback">
      <h1>Autenticazione in corso...</h1>
      <p>Attendere prego...</p>
    </div>
  );
}

export default OAuthCallback;
```

```jsx
// App.jsx - Configurazione delle routes
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import OAuthCallback from "./pages/OAuthCallback";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

### Vue.js

```vue
<!-- LoginPage.vue -->
<template>
  <div class="login-container">
    <h1>Login</h1>

    <div v-if="error" class="error">{{ error }}</div>

    <form @submit.prevent="handleClassicLogin">
      <input v-model="email" type="email" placeholder="Email" required />
      <input
        v-model="password"
        type="password"
        placeholder="Password"
        required
      />
      <button type="submit">Login</button>
    </form>

    <div class="divider">oppure</div>

    <button @click="handleGoogleLogin" class="google-login-btn">
      <img src="/google-icon.svg" alt="Google" />
      Accedi con Google
    </button>
  </div>
</template>

<script>
export default {
  name: "LoginPage",
  data() {
    return {
      email: "",
      password: "",
      error: "",
    };
  },
  methods: {
    async handleClassicLogin() {
      this.error = "";

      try {
        const response = await fetch("http://localhost:3000/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: this.email,
            password: this.password,
          }),
        });

        const data = await response.json();

        if (data.success) {
          localStorage.setItem("token", data.data.token);
          this.$router.push("/dashboard");
        } else {
          this.error = data.message;
        }
      } catch (err) {
        this.error = "Errore durante il login";
      }
    },
    handleGoogleLogin() {
      window.location.href = "http://localhost:3000/api/auth/google";
    },
  },
};
</script>
```

```vue
<!-- OAuthCallback.vue -->
<template>
  <div class="oauth-callback">
    <h1>Autenticazione in corso...</h1>
    <p>Attendere prego...</p>
  </div>
</template>

<script>
export default {
  name: "OAuthCallback",
  mounted() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    const error = urlParams.get("error");

    if (error) {
      alert(`Errore durante l'autenticazione: ${error}`);
      this.$router.push("/login");
    } else if (token) {
      localStorage.setItem("token", token);
      this.$router.push("/dashboard");
    } else {
      alert("Nessun token ricevuto");
      this.$router.push("/login");
    }
  },
};
</script>
```

## Utilizzo del Token JWT

Una volta ottenuto il token, utilizzalo per le richieste autenticate:

```javascript
// Esempio di richiesta autenticata
async function fetchUserProfile(userId) {
  const token = localStorage.getItem("token");

  const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  return data;
}
```

## Gestione degli Errori

Gli errori possibili durante l'OAuth:

- `authentication_failed`: Autenticazione Google fallita
- `oauth_error`: Errore generico durante il processo OAuth

```javascript
// Gestione errori nella callback page
const error = urlParams.get("error");

switch (error) {
  case "authentication_failed":
    alert("Autenticazione fallita. Riprova.");
    break;
  case "oauth_error":
    alert("Errore durante l'autenticazione. Riprova più tardi.");
    break;
  default:
    if (error) {
      alert("Errore sconosciuto: " + error);
    }
}
```

## Best Practices

1. **Sicurezza del Token**

   - Salva il token in modo sicuro (considera httpOnly cookies invece di localStorage per maggiore sicurezza)
   - Non esporre il token nelle URL dopo il redirect iniziale
   - Implementa refresh token per sessioni lunghe

2. **User Experience**

   - Mostra un indicatore di caricamento durante il processo OAuth
   - Gestisci gli errori in modo user-friendly
   - Fornisci feedback chiaro all'utente

3. **Produzione**

   - Usa HTTPS in produzione
   - Configura correttamente i redirect URI in Google Cloud Console
   - Usa variabili d'ambiente per gli URL

4. **Testing**
   - Testa sia il flusso OAuth che quello classico
   - Testa il collegamento account (utente esistente con stessa email)
   - Testa la gestione degli errori

## Troubleshooting

### Errore "redirect_uri_mismatch"

- Verifica che l'URI di callback in Google Cloud Console corrisponda esattamente a quello configurato nel backend
- L'URI deve includere il protocollo (http/https) e la porta se non standard

### Token non ricevuto

- Controlla la configurazione delle variabili d'ambiente (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
- Verifica che il FRONTEND_URL sia configurato correttamente
- Controlla i log del backend per errori

### CORS Errors

- Verifica che CORS_ORIGIN sia configurato correttamente nel backend
- Assicurati che il frontend faccia richieste dall'origine consentita
