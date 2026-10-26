import GoogleLoginButton from "../components/GoogleLoginButton"; // se importa el componente GoogleLoginButton desde la carpeta components para poder utilizarlo en la página de inicio de sesión.

export default function Login() {
  return (
    <main>
      <h1>FoodieFind</h1>

      <p>
        Encuentra restaurantes según tus preferencias.
      </p>

      <GoogleLoginButton />
    </main>
  );
} // se exporta la función Login que representa la página de inicio de sesión de la aplicación. Se muestra un título, una descripción y el botón de inicio de sesión con Google.