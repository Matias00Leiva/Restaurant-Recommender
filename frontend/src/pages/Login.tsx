import GoogleLoginButton from "../components/GoogleLoginButton";
import { useLanguage } from "../i18n/LanguageContext.tsx";

export default function Login() {
  const { t } = useLanguage();

  const params = new URLSearchParams(window.location.search);
  const authError = params.get("authError");

  return (
    <main className="login-page">
      <div className="login-layout">
        <section className="login-presentation">
          <span className="login-eyebrow">
            {t("discover")}
          </span>

          <h1>{t("loginTitle")}</h1>

          <p>{t("loginDescription")}</p>

          <div className="login-decoration" aria-hidden="true">
            <span>🍽️</span>
          </div>
        </section>

        <section className="login-panel">
          <div className="login-logo">
            <span className="brand-symbol">F</span>
            <span>FoodieFind</span>
          </div>

          <h2>{t("welcome")}</h2>

          <p>{t("loginMessage")}</p>

          {authError && (
            <p className="error-message">
              {t("loginError")}
            </p>
          )}

          <div className="login-action">
            <GoogleLoginButton />
          </div>

          <p className="login-note">
            {t("loginNote")}
          </p>
        </section>
      </div>
    </main>
  );
}
