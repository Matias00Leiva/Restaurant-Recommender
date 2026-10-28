import GoogleLoginButton from "../components/GoogleLoginButton"; // se importa el componente GoogleLoginButton desde la carpeta components para poder utilizarlo en la página de inicio de sesión.

export default function Login() {
  const params = new URLSearchParams(window.location.search);
  const authError = params.get("authError");

  return (
    <main>
      <h1>FoodieFind</h1>

      <p>Encuentra restaurantes según tus preferencias.</p>

      {authError && (
        <p className="error-message">
          No se pudo iniciar sesión con Google. Inténtalo nuevamente.
        </p>
      )}

      <GoogleLoginButton />
    </main>
  );
}