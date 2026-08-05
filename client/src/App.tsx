import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppProvider } from "@/components/AppProvider";
import HomePage    from "@/pages/Home";
import LoginPage   from "@/pages/Login";
import RegisterPage from "@/pages/Register";
import ProfilesPage from "@/pages/Profiles";
import BrowsePage  from "@/pages/Browse";

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/"         element={<HomePage />} />
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profiles" element={<ProfilesPage />} />
          <Route path="/browse"   element={<BrowsePage />} />
          {/* Catch-all → redirect to home */}
          <Route path="*"         element={<HomePage />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}
