import { useLanguage } from "../i18n/LanguageContext.tsx";

export default function GoogleLoginButton() {
  const { t } = useLanguage();

  return (
    <a href="http://localhost:8000/api/auth/google">
      {t("googleButton")}
    </a>
  );
}
