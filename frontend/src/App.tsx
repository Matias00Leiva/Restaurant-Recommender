import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SharedPage from "./pages/SharedPage.tsx";

import {
  LanguageProvider,
  LanguageSwitcher,
} from "./i18n/LanguageContext.tsx";

import "./App.css";

function App() {
  const path = window.location.pathname;

  let page;

  if (path === "/share") {
    page = <SharedPage />;
  } else if (path === "/dashboard") {
    page = <Dashboard />;
  } else {
    page = <Login />;
  }

  return (
    <LanguageProvider>
      <LanguageSwitcher />
      {page}
    </LanguageProvider>
  );
}

export default App;
