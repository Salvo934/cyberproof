/** Traduce gli errori di Supabase Auth in messaggi comprensibili, senza rivelare dettagli interni. */
export function authErrorMessage(error: { code?: string; message?: string } | null | undefined): string {
  switch (error?.code) {
    case "invalid_credentials":
      return "Email o password non corretti.";
    case "email_not_confirmed":
      return "Conferma prima il tuo indirizzo email: controlla la casella di posta.";
    case "user_already_exists":
    case "email_exists":
      return "Esiste già un account con questa email. Prova ad accedere.";
    case "weak_password":
      return "La password è troppo debole: usa almeno 10 caratteri, con lettere e numeri.";
    case "same_password":
      return "La nuova password deve essere diversa da quella attuale.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Troppi tentativi in poco tempo. Riprova tra qualche minuto.";
    case "signup_disabled":
      return "Le nuove registrazioni sono disabilitate.";
    default:
      return "Operazione non riuscita. Riprova.";
  }
}

export const MIN_PASSWORD_LENGTH = 10;

export function validatePassword(password: string): string | undefined {
  if (password.length < MIN_PASSWORD_LENGTH) return `Usa almeno ${MIN_PASSWORD_LENGTH} caratteri.`;
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) return "Includi almeno una lettera e un numero.";
  return undefined;
}

export function validateEmail(email: string): string | undefined {
  if (!email) return "Inserisci la tua email.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Indirizzo email non valido.";
  return undefined;
}
